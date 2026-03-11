// pages/api/recordings.js
// Call recording storage, transcript webhook, AI analysis, Brevo email follow-up
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const STORE_PATH = '/tmp/claw_recordings.json';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = 'campaigns@transbidlive.faith';
const BREVO_FROM_NAME = 'Chase @ VinHunter';

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

function buildFollowUpEmail(contactName, business, product = 'VinHunter') {
  const isVinHunter = !product || product.toLowerCase().includes('vin') || product.toLowerCase().includes('hunter');
  const isClaw = product.toLowerCase().includes('claw');
  const isTransBid = product.toLowerCase().includes('transbid');

  const subject = isVinHunter
    ? `4 things CARFAX can't check — ${business || contactName || 'your dealership'}`
    : isClaw
    ? `Your 21-agent AI system — ${business || contactName || 'your business'}`
    : isTransBid
    ? `Zero-commission contracting — ${business || contactName}`
    : `Quick follow-up — ${business || contactName || 'your business'}`;

  const vinHunterBody = `
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">
            Good talking with you. Quick follow-up on what we discussed.
          </p>
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 12px;">
            CARFAX gives you a report. VinHunter gives you 4 things CARFAX <em>structurally cannot check</em>:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>Active NHTSA federal investigations</strong> — CARFAX doesn't show open investigations, only closed ones</span>
            </td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>Cross-model complaint patterns</strong> — flags VINs from model lines with known hidden defects</span>
            </td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>AI fraud detection</strong> + theft databases CARFAX doesn't access</span>
            </td></tr>
            <tr><td style="padding:8px 0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>Google-indexed Trust Score page</strong> for every VIN on your lot — built overnight, drives inbound buyers</span>
            </td></tr>
          </table>
          <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
            CARFAX charges <strong>$40–50 per report</strong>. Our Dealer Reports plan is <strong style="color:#14F1C6;">$49/mo flat</strong> — unlimited reports. Most dealers recoup the cost on the first report of the month.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:#14F1C6;border-radius:3px;">
              <a href="https://vinledgerai.live/pricing" style="display:block;padding:14px 28px;color:#080A0F;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px;">→ See All Plans &amp; Pricing</a>
            </td></tr>
          </table>
          <table width="100%" cellpadding="16" cellspacing="0" style="background:#f9f9f9;border-left:3px solid #14F1C6;margin:0 0 24px;">
            <tr><td>
              <p style="font-size:12px;color:#888;margin:0 0 8px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Dealer Plans</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong>Free</strong> — NHTSA decodes, recalls, Trust Score page</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong style="color:#14F1C6;">$49/mo</strong> — Unlimited branded VIN reports + profit tracking (replaces CARFAX)</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong style="color:#14F1C6;">$99/mo</strong> — SEO pages for every VIN on your lot, lead capture, custom landing page built free</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;"><strong>$249/mo</strong> — Full shop CRM (replaces Tekmetric), repair orders, customer portal, AI diagnostics. $499 setup.</td></tr>
              </table>
              <p style="font-size:12px;color:#14F1C6;margin:10px 0 0;font-weight:bold;">Founding partner rate locks forever — price never goes up once you're in.</p>
            </td></tr>
          </table>`;

  const clawBody = `
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">
            Good talking with you. Here's the full picture on what we deploy.
          </p>
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">
            <strong>21 specialized AI agents</strong> working your business 24/7 — handling leads, content, research, outreach, customer service, analytics, and more. While you sleep.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:#FF6B2B;border-radius:3px;">
              <a href="https://econoclaw.vercel.app" style="display:block;padding:14px 28px;color:#fff;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px;">→ See EconoClaw Plans</a>
            </td></tr>
          </table>
          <table width="100%" cellpadding="16" cellspacing="0" style="background:#f9f9f9;border-left:3px solid #FF6B2B;margin:0 0 24px;">
            <tr><td>
              <p style="font-size:12px;color:#888;margin:0 0 8px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Pricing</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong style="color:#FF6B2B;">$500 setup + $99/mo</strong> — EconoClaw launch pricing. 21 agents, software-only. Founding rate locks forever.</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong>$9/day · $49/wk · $149/mo</strong> — RentAClaw. Try it before you commit.</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong>$2,400–$4,800</strong> — WhiteGloveClaw. Full hardware deployment (VPS/Mac Mini), same-day go-live. 20% below market leader.</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;">Agency: $5,000+ setup + $1,500/mo for the same thing. We do it for a fraction.</td></tr>
              </table>
            </td></tr>
          </table>`;

  const transbidBody = `
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">
            Good talking with you. Here's why TransBid is different from every other lead platform.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>Zero upfront cost</strong> — no lead fees, no subscription</span>
            </td></tr>
            <tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>0.5% only when you win</strong> — HomeAdvisor charges 15–30% hidden through inflated quotes</span>
            </td></tr>
            <tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>Public bidding</strong> — every bid is visible, no lead fee on unserious prospects</span>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;"><strong>Veteran-owned businesses pay 0%</strong> — forever</span>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:#14F1C6;border-radius:3px;">
              <a href="https://transbid.live" style="display:block;padding:14px 28px;color:#080A0F;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px;">→ Post Your First Project Free</a>
            </td></tr>
          </table>`;

  const bodyContent = isVinHunter ? vinHunterBody : isClaw ? clawBody : isTransBid ? transbidBody : vinHunterBody;
  const brandName = isVinHunter ? 'VinHunter' : isClaw ? 'EconoClaw' : isTransBid ? 'TransBid Live' : 'VinHunter';
  const brandColor = isVinHunter ? '#14F1C6' : isClaw ? '#FF6B2B' : '#14F1C6';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#080A0F;padding:24px 32px;">
          <span style="font-family:'Courier New',monospace;font-size:18px;color:${brandColor};letter-spacing:3px;font-weight:bold;">${brandName.toUpperCase()}</span>
          ${isVinHunter ? '<span style="font-family:Arial,sans-serif;font-size:11px;color:#6B7A8D;letter-spacing:2px;margin-left:8px;">// VINLEDGER AI LIVE</span>' : ''}
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Hey ${contactName ? contactName.split(' ')[0] : 'there'},</p>
          ${bodyContent}
          <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;">
            No pressure at all — just reply here or text me at (850) 341-4324 if you have questions or want a quick walkthrough.
          </p>
          <p style="font-size:14px;color:#333;margin:0;">
            — Chase<br>
            <span style="color:#888;font-size:12px;">VinHunter · VinLedger AI Live · EconoClaw · TransBid Live · (850) 341-4324</span>
          </p>
        </td></tr>
        <tr><td style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #eee;">
          <p style="font-size:11px;color:#aaa;margin:0;line-height:1.5;">
            You're receiving this because you expressed interest during a recent call.
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

  // ── GET PATTERN ANALYSIS — reads from client-sent callLog, NOT /tmp ─────────
  if (action === 'patterns') {
    // Accept POST with summaries from client (localStorage callLog)
    // OR fall back to /tmp store if somehow populated
    let summaries = [];
    let total = 0;
    if (req.method === 'POST' && req.body?.summaries) {
      summaries = req.body.summaries;
      total = req.body.total || summaries.length;
    } else {
      const store = loadStore();
      total = store.recordings.length;
      summaries = store.recordings
        .filter(r => r.outcome)
        .slice(0, 60)
        .map(r => `[${r.outcome}] Script:${r.script||'?'} Duration:${r.duration||0}s`);
    }
    if (summaries.length < 2) {
      return res.status(200).json({ patterns: null, total });
    }
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: 'You analyze sales call outcome patterns. Return JSON only, no markdown. Format: {"top_objections":["top 3 objections or reasons for failure"],"top_signals":["top 3 buying signals or success patterns"],"best_opening":"what opening approach is working","best_product":"which product/script is converting best","win_rate_insight":"one key insight about win rate","script_recommendation":"specific script change to make right now","single_best_change":"the ONE thing that would most improve results"}',
        messages: [{ role: 'user', content: 'Analyze these ' + total + ' sales call outcomes and give actionable coaching:\n' + summaries.join('\n') }],
      });
      const text = response.content[0].text.trim().replace(/```json|```/g, '');
      const patterns = JSON.parse(text);
      return res.status(200).json({ patterns, total });
    } catch(e) {
      return res.status(200).json({ patterns: null, total, error: e.message });
    }
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
    const { amount, description, contactName, product } = req.body || {};
    const isVH = !product || product.toLowerCase().includes('vin') || product.toLowerCase().includes('hunter');
    const isWG = product?.toLowerCase().includes('whiteglov');
    const brandName = isWG ? 'WhiteGloveClaw' : isVH ? 'VinHunter' : 'EconoClaw';
    const url = isVH ? 'https://vinledgerai.live/pricing' : 'https://econoclaw.vercel.app';
    const squareLink = `https://square.link/u/${brandName.replace(/\s/g,'')}-${Date.now()}`;
    const amt = amount || (isVH ? '99' : '99');
    const smsText = `Chase @ ${brandName}: Here's your payment link for $${amt} — ${squareLink} · ${url} · Reply STOP to opt out.`;
    return res.status(200).json({
      ok: true,
      note: `Generate a manual Square payment link from your Square dashboard for $${amt} (${description || brandName}) and paste it into the SMS template below.`,
      squareDashboard: 'https://squareup.com/dashboard/items/create',
      smsTemplate: smsText,
      amount: amt,
      product: brandName,
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
