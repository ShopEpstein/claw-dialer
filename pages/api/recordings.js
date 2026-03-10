// pages/api/recordings.js
// Call recording storage, transcript webhook, AI analysis, Brevo email follow-up
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const STORE_PATH = '/tmp/claw_recordings.json';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = 'chase@solanasolarsolutions.com';
const BREVO_FROM_NAME = 'Chase @ VinLedger';

// ── Simple JSON file store (Vercel /tmp persists within function execution) ──
function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
  } catch (e) {}
  return { recordings: [] };
}

function saveStore(data) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data));
  } catch (e) {}
}

// ── Brevo email sender ────────────────────────────────────────────────────────
async function sendBrevoEmail({ to, toName, subject, html }) {
  if (!BREVO_API_KEY || !to) return { ok: false, error: 'No API key or email' };
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
        to: [{ email: to, name: toName || '' }],
        subject,
        htmlContent: html,
      }),
    });
    const data = await r.json();
    return { ok: r.ok, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function buildFollowUpEmail(contactName, business, product = 'VinLedger') {
  const subject = `Quick follow-up — ${business || contactName || 'your dealership'}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#080A0F;padding:24px 32px;">
          <span style="font-family:'Courier New',monospace;font-size:20px;color:#14F1C6;letter-spacing:4px;font-weight:bold;">VINLEDGER</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Hey ${contactName ? contactName.split(' ')[0] : 'there'},</p>
          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            Just following up on our conversation. I wanted to make sure you had the link to see what VinLedger does for your inventory.
          </p>
          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px;">
            Here's the short version: we put a <strong>Trust Score and a Google-indexed page</strong> on every VIN on your lot — overnight. Buyers researching your vehicles find confidence-building info before they even call you. That closes deals.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:#14F1C6;border-radius:3px;padding:0;">
                <a href="https://vinledgerai.live/pricing" style="display:block;padding:14px 28px;color:#080A0F;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px;">→ See Plans &amp; Pricing</a>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-left:3px solid #14F1C6;padding:16px;margin:0 0 24px;">
            <tr><td>
              <p style="font-size:13px;color:#555;margin:0 0 8px;font-weight:bold;">FOUNDING PARTNER RATE</p>
              <p style="font-size:13px;color:#555;margin:0;line-height:1.5;">
                $99/mo — <strong>locks forever</strong> for anyone who signs up during our launch window. CARFAX charges $99–$300/mo just for reports with no marketing, no landing pages, no CRM.
              </p>
            </td></tr>
          </table>
          <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 16px;">
            Just reply to this email or text me at (850) 341-4324. No pressure — happy to answer any questions first.
          </p>
          <p style="font-size:14px;color:#333;margin:0;">
            — Chase<br>
            <span style="color:#888;font-size:12px;">Solana Solar Solutions · VinLedger · (850) 341-4324</span>
          </p>
        </td></tr>
        <tr><td style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #eee;">
          <p style="font-size:11px;color:#aaa;margin:0;line-height:1.5;">
            You're receiving this because you expressed interest in VinLedger during a recent call. 
            Reply STOP to opt out. Solana Solar Solutions · 11000 Tanton Lane, Pensacola FL 32506
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, html };
}

// ── AI transcript analysis ────────────────────────────────────────────────────
async function analyzeTranscript(transcript, contactName, outcome) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You analyze sales call transcripts. Return JSON only, no markdown.
Format: {"summary":"2-sentence summary","sentiment":"positive|neutral|negative","objections":["list"],"buying_signals":["list"],"what_worked":"one thing","what_to_improve":"one thing","follow_up_action":"specific next step"}`,
      messages: [{ role: 'user', content: `Outcome: ${outcome}\nContact: ${contactName}\n\nTranscript:\n${transcript}` }],
    });
    const text = response.content[0].text.trim().replace(/```json|```/g, '');
    return JSON.parse(text);
  } catch (e) {
    return {
      summary: 'Analysis unavailable',
      sentiment: 'neutral',
      objections: [],
      buying_signals: [],
      what_worked: '',
      what_to_improve: '',
      follow_up_action: '',
    };
  }
}

// ── Pattern analysis across all calls ────────────────────────────────────────
async function analyzePatterns(recordings) {
  if (recordings.length < 2) return null;
  const summaries = recordings
    .filter(r => r.analysis)
    .slice(0, 30)
    .map(r => `[${r.outcome}] Objections: ${(r.analysis.objections || []).join(', ')}. Worked: ${r.analysis.what_worked}. Signal: ${(r.analysis.buying_signals || []).join(', ')}`)
    .join('\n');
  if (!summaries) return null;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: 'You analyze patterns across multiple sales calls. Return JSON only, no markdown. Format: {"top_objections":["top 3 objections across all calls"],"top_signals":["top 3 buying signals"],"best_approach":"what is working","patterns":"key insight from the data","recommendation":"one specific change to make right now"}',
      messages: [{ role: 'user', content: `Analyze these ${recordings.length} call outcomes:\n${summaries}` }],
    });
    const text = response.content[0].text.trim().replace(/```json|```/g, '');
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── TRANSCRIPT WEBHOOK (called by Twilio after recording completes) ─────────
  if (action === 'transcript-webhook') {
    const { RecordingSid, RecordingUrl, TranscriptionText, TranscriptionStatus, CallSid } = req.body || {};
    if (TranscriptionStatus !== 'completed' || !TranscriptionText) {
      return res.status(200).end();
    }
    const store = loadStore();
    const existing = store.recordings.find(r => r.callSid === CallSid);
    if (existing) {
      existing.transcript = TranscriptionText;
      existing.recordingUrl = RecordingUrl;
      existing.transcribedAt = new Date().toISOString();
      // Kick off AI analysis async — don't block the webhook response
      analyzeTranscript(TranscriptionText, existing.contactName, existing.outcome).then(analysis => {
        const store2 = loadStore();
        const rec = store2.recordings.find(r => r.callSid === CallSid);
        if (rec) {
          rec.analysis = analysis;
          saveStore(store2);
        }
      });
    } else {
      store.recordings.unshift({
        id: Date.now(),
        callSid: CallSid,
        recordingSid: RecordingSid,
        recordingUrl: RecordingUrl,
        transcript: TranscriptionText,
        transcribedAt: new Date().toISOString(),
        contactName: 'Unknown',
        outcome: 'unknown',
        analysis: null,
      });
    }
    saveStore(store);
    return res.status(200).end();
  }

  // ── SAVE CALL RECORD (called from twilio.js on call completion) ────────────
  if (action === 'save' && req.method === 'POST') {
    const { callSid, contactName, contactPhone, contactEmail, business, outcome, duration, script, notes } = req.body || {};
    const store = loadStore();
    const existing = store.recordings.findIndex(r => r.callSid === callSid);
    const record = {
      id: existing >= 0 ? store.recordings[existing].id : Date.now(),
      callSid,
      contactName,
      contactPhone,
      contactEmail,
      business,
      outcome,
      duration,
      script,
      notes,
      timestamp: new Date().toISOString(),
      transcript: existing >= 0 ? store.recordings[existing].transcript : null,
      recordingUrl: existing >= 0 ? store.recordings[existing].recordingUrl : null,
      analysis: existing >= 0 ? store.recordings[existing].analysis : null,
    };
    if (existing >= 0) store.recordings[existing] = record;
    else store.recordings.unshift(record);
    // Keep last 500
    store.recordings = store.recordings.slice(0, 500);
    saveStore(store);
    return res.status(200).json({ ok: true });
  }

  // ── LIST RECORDINGS ────────────────────────────────────────────────────────
  if (action === 'list') {
    const store = loadStore();
    const limit = parseInt(req.query.limit || '50');
    return res.status(200).json({ recordings: store.recordings.slice(0, limit), total: store.recordings.length });
  }

  // ── GET PATTERN ANALYSIS ───────────────────────────────────────────────────
  if (action === 'patterns') {
    const store = loadStore();
    const patterns = await analyzePatterns(store.recordings);
    return res.status(200).json({ patterns, total: store.recordings.length });
  }

  // ── SEND BREVO EMAIL FOLLOW-UP ─────────────────────────────────────────────
  if (action === 'email' && req.method === 'POST') {
    const { to, contactName, business, product } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Missing email' });
    const { subject, html } = buildFollowUpEmail(contactName, business, product);
    const result = await sendBrevoEmail({ to, toName: contactName, subject, html });
    // Log the send
    if (result.ok) {
      const store = loadStore();
      const rec = store.recordings.find(r => r.contactEmail === to || r.contactName === contactName);
      if (rec) {
        rec.emailSentAt = new Date().toISOString();
        saveStore(store);
      }
    }
    return res.status(result.ok ? 200 : 500).json(result);
  }

  // ── GENERATE SQUARE PAY LINK ───────────────────────────────────────────────
  if (action === 'pay-link' && req.method === 'POST') {
    const { amount, description, contactName } = req.body || {};
    // Square doesn't have a simple link API without OAuth setup
    // Return a pre-built Square checkout URL pattern or manual instructions
    const amountCents = Math.round((parseFloat(amount) || 99) * 100);
    // Manual Square link (until Square API is connected)
    const squareLink = `https://square.link/u/VinLedger-${Date.now()}`;
    const smsText = `Chase @ VinLedger: Here's your payment link for $${amount || '99'}/mo — ${squareLink} Reply STOP to opt out.`;
    return res.status(200).json({
      ok: true,
      note: 'Generate a manual Square payment link from your Square dashboard and paste it here, or integrate Square API with your access token.',
      squareDashboard: 'https://squareup.com/dashboard/items/create',
      smsTemplate: smsText,
      amount: amount || 99,
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
