import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';
import { saveCall } from './kv';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';

const SYSTEM_PROMPT_B2B = `You are a professional outreach representative for CareCircle Network, calling senior care facilities and providers in Northwest Florida. Calm, credible, direct. Keep every response to 1-2 sentences MAX. Plain spoken words only, no special characters or markdown.

You are calling to introduce the CareCircle Network Intelligence Scanner — a transparency platform that already indexes their facility using 6+ public data sources.

── WHAT CARECIRCLE NETWORK IS ──
An AI-powered Intelligence Scanner cross-referencing FL AHCA records, CMS Medicare data, Google Reviews, BBB complaints, Indeed/Glassdoor, and ProPublica — generating scored quality reports on every senior care provider in our market. Families use it free. Providers pay to manage their profile.

── PARTNER TIERS ──
- Directory Listing: Free
- Network Partner: $499 setup, $149/month — referral matching, SEO content, managed profile
- Featured Partner: $999 setup, $349/month — priority placement, AI platform access
- Per-referral fee: $150 (A Place for Mom charges $3,500–$7,000 per placement)

── KEY POINTS ──
- A Place for Mom is under Senate investigation — 37.5% of their award winners had active neglect citations
- The March 2026 HHS OIG reports on chemical restraint are driving family urgency right now
- Their facility is already indexed — claim it or leave it unmanaged

── OBJECTIONS ──
- "We use A Place for Mom" → "They're under Senate investigation. We charge $150 per referral, they charge up to $7,000."
- "Not interested" → "Can I text you a link to your current scanner profile?"
- "Too expensive" → "We have a free directory listing — no cost."
- "Who is this?" → "CareCircle Network — the transparency scanner for senior care facilities in Northwest Florida. Your facility is already in our system."

When they agree to receive information respond with only: SEND_LINK
When they firmly want to end the call respond with only: HANGUP`;

const SYSTEM_PROMPT_B2C = `You are a compassionate outreach representative for CareCircle Network, calling families with a loved one in senior care. Warm, credible, never pushy. Keep every response to 1-2 sentences MAX. Plain spoken words only, no special characters or markdown.

── WHAT CARECIRCLE PRESENT IS ──
Family-funded, resident-first monitoring. Trained advocates enter facilities unannounced — overnight, weekends, holidays — executing the Guardian Visit Algorithm. Written report within 24 hours. No competitor nationally offers this.

── SERVICE TIERS ──
- Starter: $599 one-time — 4 visits in 7-10 days, all shift windows, baseline report
- Guardian Essential: from $799/month — 4 visits/month, sustained deterrence
- Guardian: from $1,500/month — 8-10 visits, overnights, weekends
- Guardian Elite: from $2,500/month — near-daily presence

── KEY POINTS ──
- 64% of nursing home staff admitted abuse or neglect in the past year
- 1 in 24 elder abuse cases are ever reported
- March 2026 HHS OIG confirmed facilities sedate residents with antipsychotics to reduce staff workload
- Ombudsman program: 1 paid staff per 50 facilities, 40% get zero quarterly visits
- No competitor offers unannounced overnight algorithmically-sequenced visits nationally

── OBJECTIONS ──
- "Facility seems fine" → "Most families feel that way until something happens on a night shift. Our Starter gives you a baseline in writing."
- "Too expensive" → "The Starter is $599 one-time. If something is wrong, catching it early is worth everything."
- "Don't think we need it" → "Can I text you the information? No commitment at all."
- "They have cameras" → "Cameras don't stop what happens when staff know family isn't coming."
- "Who is this?" → "CareCircle Network — we send trained advocates into facilities for families who want to know what's happening when they can't be there."

When they agree to receive information respond with only: SEND_LINK
When they firmly want to end the call respond with only: HANGUP`;

function escapeXml(str) {
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function buildGather(sayText, history, to, contactType) {
  const historyParam = encodeURIComponent(JSON.stringify(history));
  const url = `${BASE}/api/twilio?action=ai-respond&to=${encodeURIComponent(to)}&history=${historyParam}&contactType=${contactType}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${url}" method="POST" speechTimeout="2" speechModel="phone_call" enhanced="true" timeout="8">
    <Say voice="Polly.Matthew-Neural">${escapeXml(sayText)}</Say>
  </Gather>
  <Say voice="Polly.Matthew-Neural">I didn't catch that. No problem, have a great day.</Say>
  <Hangup/>
</Response>`;
}

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'ai-twiml') {
    res.setHeader('Content-Type', 'text/xml');
    const to = req.query.to || '';
    const ct = req.query.contactType || 'b2b';
    const opening = ct === 'b2c'
      ? "Hi — this call may be recorded. I'm reaching out from CareCircle Network. We work with families who have a loved one in a senior care facility. Is this a good moment?"
      : "Hi, is this the owner or administrator? This call may be recorded. I'm reaching out from CareCircle Network — we run the transparency scanner that indexes senior care facilities in Northwest Florida. Quick question for you.";
    return res.status(200).send(buildGather(opening, [], to, ct));
  }

  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const to = req.query.to || '';
    const ct = req.query.contactType || 'b2b';
    let history = [];
    try { history = JSON.parse(decodeURIComponent(req.query.history || '[]')); } catch(e) {}
    if (speech) history.push({ role: 'user', content: speech });
    if (!speech) return res.status(200).send(buildGather("Sorry, I didn't catch that. Are you available for just a quick moment?", history, to, ct));
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: ct === 'b2c' ? SYSTEM_PROMPT_B2C : SYSTEM_PROMPT_B2B,
        messages: history,
      });
      const reply = response.content[0].text.trim();
      history.push({ role: 'assistant', content: reply });
      if (reply.includes('SEND_LINK')) {
        if (to) {
          try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const smsBody = ct === 'b2c'
              ? `CareCircle Network: Thank you for your time. Learn about our family advocacy service at carecircle.fit — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`
              : `CareCircle Network: Your facility scanner profile and partner options — carecircle.fit/research — Questions? Care@CareCircle.Fit or 850-341-4324. Reply STOP to opt out.`;
            await client.messages.create({ to, from: FROM, body: smsBody });
          } catch(e) { console.error('SMS error:', e.message); }
        }
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">Perfect, sending that over now. Feel free to reach out anytime. Have a great day.</Say><Hangup/></Response>`);
      }
      if (reply.includes('HANGUP')) {
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">No problem at all. Have a wonderful day.</Say><Hangup/></Response>`);
      }
      return res.status(200).send(buildGather(reply, history, to, ct));
    } catch(err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">I apologize for the interruption. Have a great day.</Say><Hangup/></Response>`);
    }
  }

  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">Hello, this is CareCircle Network. Please stay on the line.</Say>
  <Gather numDigits="1" action="${BASE}/api/twilio?action=gather" method="POST" timeout="8">
    <Say voice="Polly.Matthew-Neural">Press 1 to receive more information by text, or hang up if this is not a good time.</Say>
  </Gather>
  <Say voice="Polly.Matthew-Neural">No problem. Have a great day.</Say>
  <Hangup/>
</Response>`);
  }

  if (action === 'gather') {
    const digit = req.body?.Digits;
    const customerPhone = req.body?.To || req.body?.Called || req.body?.From;
    const ct = req.query.contactType || 'b2b';
    if (digit === '1' && customerPhone) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const smsBody = ct === 'b2c'
          ? `CareCircle Network: Family advocacy service info — carecircle.fit — 850-341-4324. Reply STOP to opt out.`
          : `CareCircle Network: Facility scanner profile and partner options — carecircle.fit/research — 850-341-4324. Reply STOP to opt out.`;
        await client.messages.create({ to: customerPhone, from: FROM, body: smsBody });
      } catch(err) { console.error('SMS error:', err.message); }
    }
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">${digit === '1' ? 'Perfect. Check your messages shortly. Have a great day.' : 'No problem. Have a wonderful day.'}</Say><Hangup/></Response>`);
  }

  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    const ct = req.query.contactType || 'b2b';
    if (['machine_end_beep','machine_end_silence','machine_end_other'].includes(AnsweredBy)) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const vmText = ct === 'b2c'
          ? "Hi, this is CareCircle Network. We work with families who have a loved one in a senior care facility. Please visit carecircle dot fit or call 850-341-4324. Have a great day."
          : "Hi, this is CareCircle Network. We run the transparency scanner for senior care facilities in Northwest Florida. Please visit carecircle dot fit or call 850-341-4324. Thank you.";
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">${escapeXml(vmText)}</Say><Hangup/></Response>`
        });
      } catch(err) { console.error('VM drop error:', err.message); }
    }
    return res.status(200).end();
  }

  if (action === 'status') {
    const { CallSid, CallStatus, CallDuration, To } = req.body || {};
    if (['completed','failed','busy','no-answer'].includes(CallStatus)) {
      const dur = parseInt(CallDuration || 0);
      try {
        await saveCall({
          callSid: CallSid,
          repId: req.query.repId ? decodeURIComponent(req.query.repId) : '',
          repName: req.query.repName ? decodeURIComponent(req.query.repName) : '',
          contactName: req.query.contactName ? decodeURIComponent(req.query.contactName) : '',
          contactBusiness: req.query.contactBusiness ? decodeURIComponent(req.query.contactBusiness) : '',
          contactPhone: To,
          contactType: req.query.contactType || 'b2b',
          script: req.query.script ? decodeURIComponent(req.query.script) : '',
          outcome: CallStatus === 'completed' && dur >= 15 ? 'answered' : 'voicemail',
          duration: dur,
          timestamp: new Date().toISOString(),
        });
      } catch(e) { console.error('KV save error:', e.message); }
    }
    return res.status(200).end();
  }

  if (action === 'callstatus') {
    const { sid } = req.query;
    if (!sid) return res.status(400).json({ error: 'Missing sid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls(sid).fetch();
      return res.status(200).json({ status: call.status, duration: call.duration });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  if (action === 'inbox') {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const messages = await client.messages.list({ to: FROM, limit: 50 });
      return res.status(200).json({ messages: messages.map(m => ({ sid: m.sid, from: m.from, body: m.body, dateSent: m.dateSent })) });
    } catch(err) { return res.status(500).json({ error: err.message, messages: [] }); }
  }

  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  if (action === 'call') {
    const { to, contactName, contactBusiness, contactType, repId, repName, aiMode, script } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const params = new URLSearchParams({
        repId: repId || '', repName: repName || '',
        contactName: contactName || '', contactBusiness: contactBusiness || '',
        contactType: contactType || 'b2b', script: script || '',
      });
      const call = await client.calls.create({
        to, from: FROM,
        url: aiMode
          ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(to)}&contactType=${contactType||'b2b'}`
          : `${BASE}/api/twilio?action=twiml`,
        record: true,
        recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook`,
        recordingStatusCallbackMethod: 'POST',
        statusCallback: `${BASE}/api/twilio?action=status&${params.toString()}`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed','failed','busy','no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactType=${contactType||'b2b'}`,
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  if (action === 'sms') {
    const { to, body: smsBody } = body;
    if (!to || !smsBody) return res.status(400).json({ error: 'Missing to or body' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({ to, from: FROM, body: smsBody });
      return res.status(200).json({ success: true, messageSid: message.sid });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  if (action === 'browser-call') {
    const { To } = body;
    res.setHeader('Content-Type', 'text/xml');
    if (!To) return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+18559600110" record="record-from-answer" recordingStatusCallback="${BASE}/api/recordings?action=transcript-webhook" recordingStatusCallbackMethod="POST">
    <Number>${escapeXml(To)}</Number>
  </Dial>
</Response>`);
  }

  return res.status(400).json({ error: 'Unknown action' });
}
