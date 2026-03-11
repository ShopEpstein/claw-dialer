// pages/api/recordings.js
// Call recording storage, transcript webhook, AI analysis, Brevo email follow-up
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import twilio from 'twilio';

const STORE_PATH = '/tmp/claw_recordings.json';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = 'campaigns@transbidlive.faith';
const BREVO_FROM_NAME = 'Chase @ VinHunter';

// ── Store: /tmp is ephemeral on Vercel but we use Twilio API as source of truth ──
// /tmp stores AI analysis + transcripts + contact metadata (the enrichment layer)
// Twilio stores the actual call records + recording URLs (the persistent layer)
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
    // Keep last 500 records in /tmp
    if (data.recordings) data.recordings = data.recordings.slice(0, 500);
    fs.writeFileSync(STORE_PATH, JSON.stringify(data));
  } catch (e) {}
}

// Fetch live call list from Twilio and merge with our enrichment store
async function getEnrichedRecordings(limit = 50) {
  const store = loadStore();
  // Build a map of our enrichment data keyed by callSid
  const enrichMap = {};
  for (const r of store.recordings) {
    if (r.callSid) enrichMap[r.callSid] = r;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // Fetch recent calls from Twilio (these always exist regardless of /tmp)
    const calls = await client.calls.list({ limit: Math.min(limit, 100) });
    const merged = calls.map(call => {
      const enriched = enrichMap[call.sid] || {};
      return {
        id: enriched.id || call.sid,
        callSid: call.sid,
        contactName: enriched.contactName || '',
        contactPhone: call.to,
        contactEmail: enriched.contactEmail || '',
        contactId: enriched.contactId || '',
        script: enriched.script || '',
        outcome: enriched.outcome || (call.status === 'completed' ? (parseInt(call.duration||0) >= 15 ? 'answered' : 'voicemail') : call.status),
        duration: call.duration || enriched.duration || 0,
        timestamp: call.startTime || enriched.timestamp,
        recordingUrl: enriched.recordingUrl || null,
        transcript: enriched.transcript || null,
        transcribedAt: enriched.transcribedAt || null,
        analysis: enriched.analysis || null,
        emailSentAt: enriched.emailSentAt || null,
        notes: enriched.notes || '',
        twilioStatus: call.status,
      };
    });
    return merged;
  } catch(e) {
    // Twilio fetch failed — fall back to /tmp store
    console.error('Twilio calls fetch error:', e.message);
    return store.recordings;
  }
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
    ? `Your free lot audit — ${business || contactName || 'your dealership'}`
    : isClaw
    ? `Your 21-agent AI system — ${business || contactName || 'your business'}`
    : isTransBid
    ? `Zero-commission contracting — ${business || contactName}`
    : `Quick follow-up — ${business || contactName || 'your business'}`;

  const vinHunterBody = `
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">
            Good talking with you. Wanted to make sure you had everything in one place so you can take a look when you get a minute.
          </p>
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">
            Here's the short version of what VinHunter does that CARFAX <em>structurally cannot</em>:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;">Active NHTSA federal investigations (CARFAX doesn't show these)</span>
            </td></tr>
            <tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;">Cross-model complaint patterns across similar vehicles</span>
            </td></tr>
            <tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;">AI fraud detection + theft databases CARFAX doesn't access</span>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <span style="color:#14F1C6;font-weight:bold;font-size:14px;">✓</span>
              <span style="font-size:14px;color:#333;margin-left:8px;">Google-indexed Trust Score page for every VIN on your lot — overnight</span>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:#14F1C6;border-radius:3px;">
              <a href="https://vinledgerai.live/pricing" style="display:block;padding:14px 28px;color:#080A0F;font-weight:bold;font-size:15px;text-decoration:none;letter-spacing:1px;">→ See All Plans &amp; Pricing</a>
            </td></tr>
          </table>
          <table width="100%" cellpadding="16" cellspacing="0" style="background:#f9f9f9;border-left:3px solid #14F1C6;margin:0 0 24px;">
            <tr><td>
              <p style="font-size:12px;color:#888;margin:0 0 8px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">All Plans</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong>Free</strong> — NHTSA decodes, recalls, Trust Score</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong>$4.99/mo</strong> — Full title history (what CARFAX charges $45/report for)</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong>$29/mo</strong> Verified Dealer — Badge + 10 branded VIN reports + QR stickers</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong>$49/mo</strong> Dealer Reports — Unlimited branded reports + profit tracking</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;"><strong style="color:#14F1C6;">$99/mo</strong> Dealer Marketing — SEO pages for every VIN, lead capture, custom landing page (built free)</td></tr>
                <tr><td style="padding:4px 0;font-size:13px;color:#333;"><strong>$249/mo</strong> Dealer Pro — Full shop CRM (replaces Tekmetric), repair orders, customer portal, AI diagnostics. $499 setup.</td></tr>
              </table>
              <p style="font-size:12px;color:#14F1C6;margin:10px 0 0;font-weight:bold;">Founding partner rate locks forever — price never increases once you're in.</p>
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
            Reply STOP to opt out. VinHunter · EconoClaw · TransBid Live · Pensacola, FL
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

// ── Deepgram transcription ─────────────────────────────────────────────────────
async function transcribeWithDeepgram(audioUrl, callSid) {
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
  if (!DEEPGRAM_API_KEY) return null;
  try {
    // Fetch audio from Twilio with auth, then send to Deepgram
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const mp3Url = audioUrl.endsWith('.mp3') ? audioUrl : audioUrl + '.mp3';
    const r = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&paragraphs=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: mp3Url, options: { headers: { Authorization: authHeader } } }),
    });
    if (!r.ok) {
      // Fallback: use audio/url passthrough with credentials embedded
      const credUrl = mp3Url.replace('https://', `https://${accountSid}:${authToken}@`);
      const r2 = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
        method: 'POST',
        headers: { 'Authorization': `Token ${DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: credUrl }),
      });
      if (!r2.ok) return null;
      const d2 = await r2.json();
      return d2?.results?.channels?.[0]?.alternatives?.[0]?.transcript || null;
    }
    const data = await r.json();
    return data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || null;
  } catch(e) {
    console.error('Deepgram error:', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── STREAM PROXY: serves Twilio audio without exposing credentials to browser ──
  if (action === 'stream') {
    const { sid } = req.query;
    if (!sid) return res.status(400).end('Missing sid');
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      // Fetch recordings list for this call or direct recording SID
      const client = twilio(accountSid, authToken);
      let recordingUrl;
      if (sid.startsWith('RE')) {
        // It's a recording SID directly
        recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`;
      } else {
        // It's a call SID — get the first recording
        const recs = await client.recordings.list({ callSid: sid, limit: 1 });
        if (!recs.length) return res.status(404).end('No recording found');
        recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recs[0].sid}.mp3`;
      }
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const audioResp = await fetch(recordingUrl, { headers: { Authorization: authHeader } });
      if (!audioResp.ok) return res.status(audioResp.status).end('Audio fetch failed');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      const buffer = await audioResp.arrayBuffer();
      return res.status(200).send(Buffer.from(buffer));
    } catch(e) {
      return res.status(500).end(e.message);
    }
  }

  // ── MANUAL TRANSCRIBE: trigger Deepgram on a specific recording ────────────
  if (action === 'transcribe' && req.method === 'POST') {
    const { callSid, recordingUrl, recordingSid } = req.body || {};
    if (!callSid && !recordingUrl) return res.status(400).json({ error: 'Missing callSid or recordingUrl' });

    let audioUrl = recordingUrl;
    if (!audioUrl && callSid) {
      const store = loadStore();
      const rec = store.recordings.find(r => r.callSid === callSid);
      audioUrl = rec?.recordingUrl;
    }
    if (!audioUrl && recordingSid) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      audioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}`;
    }
    if (!audioUrl) return res.status(400).json({ error: 'No recording URL found' });

    const transcript = await transcribeWithDeepgram(audioUrl, callSid);
    if (!transcript) return res.status(500).json({ error: 'Transcription failed' });

    // Save transcript and kick off AI analysis
    const store = loadStore();
    const existing = store.recordings.find(r => r.callSid === callSid);
    if (existing) {
      existing.transcript = transcript;
      existing.transcribedAt = new Date().toISOString();
      saveStore(store);
      analyzeTranscript(transcript, existing.contactName, existing.outcome).then(analysis => {
        const s2 = loadStore();
        const r = s2.recordings.find(x => x.callSid === callSid);
        if (r) { r.analysis = analysis; saveStore(s2); }
      });
    }
    return res.status(200).json({ ok: true, transcript });
  }

  // ── TRANSCRIPT WEBHOOK (called by Twilio after recording/transcription completes) ─────────
  if (action === 'transcript-webhook') {
    const { RecordingSid, RecordingUrl, TranscriptionText, TranscriptionStatus, CallSid } = req.body || {};
    // Pull contact info from URL params (we now pass these in the callback URL)
    const contactName = req.query.contactName ? decodeURIComponent(req.query.contactName) : '';
    const contactEmail = req.query.contactEmail ? decodeURIComponent(req.query.contactEmail) : '';
    const contactId = req.query.contactId ? decodeURIComponent(req.query.contactId) : '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';

    const store = loadStore();
    const existingIdx = store.recordings.findIndex(r => r.callSid === CallSid);

    // Always update recording URL when we get it
    if (RecordingUrl) {
      if (existingIdx >= 0) {
        store.recordings[existingIdx].recordingUrl = RecordingUrl;
        store.recordings[existingIdx].recordingSid = RecordingSid;
        if (contactName && !store.recordings[existingIdx].contactName) {
          store.recordings[existingIdx].contactName = contactName;
        }
      } else {
        store.recordings.unshift({
          id: Date.now(),
          callSid: CallSid,
          recordingSid: RecordingSid,
          recordingUrl: RecordingUrl,
          transcript: null,
          transcribedAt: null,
          contactName: contactName || 'Unknown',
          contactEmail,
          contactId,
          script,
          outcome: 'unknown',
          analysis: null,
          timestamp: new Date().toISOString(),
        });
      }
      saveStore(store);

      // Auto-trigger Deepgram transcription (better quality than Twilio built-in)
      // Run async — don't block Twilio webhook response
      const callSidForTranscript = CallSid;
      const recUrlForTranscript = RecordingUrl;
      transcribeWithDeepgram(recUrlForTranscript, callSidForTranscript).then(transcript => {
        if (!transcript) return;
        const s2 = loadStore();
        const rec = s2.recordings.find(r => r.callSid === callSidForTranscript);
        if (rec && !rec.transcript) {
          rec.transcript = transcript;
          rec.transcribedAt = new Date().toISOString();
          saveStore(s2);
          analyzeTranscript(transcript, rec.contactName, rec.outcome).then(analysis => {
            const s3 = loadStore();
            const r = s3.recordings.find(x => x.callSid === callSidForTranscript);
            if (r) { r.analysis = analysis; saveStore(s3); }
          });
        }
      });
    }

    // Also handle Twilio's own transcription as fallback if it arrives
    if (TranscriptionStatus === 'completed' && TranscriptionText) {
      const store2 = loadStore();
      const existing = store2.recordings.find(r => r.callSid === CallSid);
      if (existing && !existing.transcript) {
        existing.transcript = TranscriptionText;
        existing.transcribedAt = new Date().toISOString();
        if (contactName && !existing.contactName) existing.contactName = contactName;
        saveStore(store2);
        analyzeTranscript(TranscriptionText, existing.contactName, existing.outcome).then(analysis => {
          const store3 = loadStore();
          const rec = store3.recordings.find(r => r.callSid === CallSid);
          if (rec) { rec.analysis = analysis; saveStore(store3); }
        });
      }
    }

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
    const limit = parseInt(req.query.limit || '50');
    const recordings = await getEnrichedRecordings(limit);
    return res.status(200).json({ recordings, total: recordings.length });
  }

  // ── GET PATTERN ANALYSIS ───────────────────────────────────────────────────
  if (action === 'patterns') {
    const recordings = await getEnrichedRecordings(100);
    const patterns = await analyzePatterns(recordings);
    return res.status(200).json({ patterns, total: recordings.length });
  }


  // ── SEND BREVO EMAIL FOLLOW-UP ─────────────────────────────────────────────
  if (action === 'email' && req.method === 'POST') {
    const { to, contactName, business, product, script } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Missing email' });
    // Accept either product or script name — normalize
    const productName = product || script || 'VinHunter';
    const { subject, html } = buildFollowUpEmail(contactName, business, productName);
    const result = await sendBrevoEmail({ to, toName: contactName, subject, html });
    if (result.ok) {
      const store = loadStore();
      const rec = store.recordings.find(r => r.contactEmail === to || r.contactName === contactName);
      if (rec) {
        rec.emailSentAt = new Date().toISOString();
      } else {
        // Create a stub record so we know email was sent
        store.recordings.unshift({ id: Date.now(), contactEmail: to, contactName, script: productName, emailSentAt: new Date().toISOString(), outcome: 'email-only', timestamp: new Date().toISOString() });
      }
      saveStore(store);
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
