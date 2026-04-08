import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';
import { saveCall, getPhoneAssignments, setPhoneAssignments, getActiveConf, setActiveConf, delActiveConf } from './kv';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110'; // toll-free — SMS default for everyone

// Default outbound caller IDs per rep — overridden at runtime via Admin > Number Pool
const DEFAULT_PHONE_ASSIGNMENTS = {
  chase:    '+18502033021', // (850) 203-3021 Chase Local
  brittany: '+18507211779', // (850) 721-1779 Jessica Local
  erica:    '+18502043347', // (850) 204-3347 Erica Local
};

async function getRepPhone(repId) {
  try {
    const stored = await getPhoneAssignments();
    const map = stored || DEFAULT_PHONE_ASSIGNMENTS;
    return map[repId] || FROM;
  } catch {
    return DEFAULT_PHONE_ASSIGNMENTS[repId] || FROM;
  }
}

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
    if (['machine_end_beep','machine_end_silence','machine_end_other'].includes(AnsweredBy)) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.calls(CallSid).update({
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Play>https://carecirclenetwork-9181.twil.io/carecirclevoicedrop.mp3</Play><Hangup/></Response>`
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
      const callFrom = await getRepPhone(repId);
      const call = await client.calls.create({
        to, from: callFrom,
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
    const { To, repId, contactType: ct } = body;
    res.setHeader('Content-Type', 'text/xml');
    if (!To) return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);

    // ── Admin monitoring an active rep call ──────────────────────────────────
    if (To === 'monitor') {
      const { targetRepId, mode } = body;
      try {
        const confData = await getActiveConf(targetRepId);
        if (!confData) return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">No active call for that rep.</Say><Hangup/></Response>`);
        const { confName, repCallSid } = confData;
        const adminCallSid = body.CallSid;
        // Whisper: join muted, status callback will enable coaching + unmute
        // Listen:  join muted permanently
        const cbParam = mode === 'whisper'
          ? ` statusCallback="${BASE}/api/twilio?action=coach-activate&adminCallSid=${adminCallSid}&repCallSid=${encodeURIComponent(repCallSid)}" statusCallbackEvent="join" statusCallbackMethod="POST"`
          : '';
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Conference name="${escapeXml(confName)}" startConferenceOnEnter="false" endConferenceOnExit="false" beep="false" muted="true"${cbParam}/></Dial></Response>`);
      } catch(e) {
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">Error joining call.</Say><Hangup/></Response>`);
      }
    }

    // ── Regular outbound call via conference ─────────────────────────────────
    // Save conf info immediately so monitoring can find it, then return TwiML
    // right away. The customer call is placed by the conf-event callback once
    // the conference starts — this avoids blocking the TwiML response on the
    // Twilio REST API call and prevents Vercel function timeouts.
    const callerId = await getRepPhone(repId || '');
    const repCallSid = body.CallSid;
    const confName = `cc_${repId}_${Date.now()}`;

    try {
      await setActiveConf(repId, { confName, repCallSid, to: To, callerId, ct: ct || 'b2b', startTime: Date.now() });
    } catch(e) { console.error('setActiveConf error:', e.message); }

    const cbUrl = `${BASE}/api/twilio?action=conf-event&repId=${encodeURIComponent(repId||'')}`;
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Conference name="${escapeXml(confName)}" startConferenceOnEnter="true" endConferenceOnExit="true" beep="false" maxParticipants="10" statusCallback="${cbUrl}" statusCallbackEvent="start end" statusCallbackMethod="POST"/></Dial></Response>`);
  }

  // ── Conference event callback (start → dial customer; end → clean KV) ──────
  if (action === 'conf-event') {
    const event = req.body?.StatusCallbackEvent;
    const cbRepId = req.query.repId || '';

    if (event === 'conference-start') {
      try {
        const confData = await getActiveConf(cbRepId);
        if (confData) {
          const { to, callerId: cid, ct: confCt, confName: cName } = confData;
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.calls.create({
            to, from: cid,
            url: `${BASE}/api/twilio?action=conf-customer&confName=${encodeURIComponent(cName)}`,
            record: true,
            recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook`,
            recordingStatusCallbackMethod: 'POST',
            machineDetection: 'DetectMessageEnd',
            asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactType=${confCt||'b2b'}`,
            asyncAmdStatusCallbackMethod: 'POST',
          });
        }
      } catch(e) { console.error('conf-start customer dial error:', e.message); }
    } else if (event === 'conference-end') {
      try { await delActiveConf(cbRepId); } catch {}
    }

    return res.status(200).end();
  }

  // ── Customer joins conference ──────────────────────────────────────────────
  if (action === 'conf-customer') {
    const confName = req.query.confName || '';
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Conference name="${escapeXml(confName)}" startConferenceOnEnter="true" endConferenceOnExit="true" beep="false" maxParticipants="10"/></Dial></Response>`);
  }

  // ── Conference ended — clean up KV (legacy, also handled by conf-event) ────
  if (action === 'conf-end') {
    try { await delActiveConf(req.query.repId || ''); } catch {}
    return res.status(200).end();
  }

  // ── Coaching activation via conference participant status callback ─────────
  // Fires when admin participant joins; enables coaching so only rep hears admin
  if (action === 'coach-activate') {
    const { adminCallSid, repCallSid } = req.query;
    const { ConferenceSid } = req.body || {};
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.conferences(ConferenceSid).participants(adminCallSid).update({
        coaching: true, callSidToCoach: repCallSid, muted: false,
      });
    } catch(e) { console.error('coach-activate error:', e.message); }
    return res.status(200).end();
  }

  if (action === 'inbound') {
    const caller = req.body?.From || req.body?.Caller || 'unknown';
    res.setHeader('Content-Type', 'text/xml');
    // Fire SMS notification async — don't await so TwiML responds immediately
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      client.messages.create({
        to: '+18503414324',
        from: FROM,
        body: `📞 INBOUND CALL: ${caller} just called CareCircle. Call them back now.`,
      }).catch(() => {});
    } catch {}
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">Thanks for calling CareCircle Network. We connect families with independent care advocates across Florida. Someone from our team will call you right back — we're noting your number now.</Say><Hangup/></Response>`);
  }

  if (action === 'phone-assignments') {
    if (req.method === 'GET') {
      try {
        const stored = await getPhoneAssignments();
        return res.status(200).json({ assignments: stored || DEFAULT_PHONE_ASSIGNMENTS });
      } catch(err) { return res.status(500).json({ error: err.message }); }
    }
    if (req.method === 'POST') {
      try {
        await setPhoneAssignments(req.body.assignments || {});
        return res.status(200).json({ ok: true });
      } catch(err) { return res.status(500).json({ error: err.message }); }
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
