import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';
import { saveCall, getPhoneAssignments, setPhoneAssignments, getActiveConf, setActiveConf, delActiveConf } from './kv';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110'; // toll-free — SMS default for everyone

// Default outbound caller IDs per rep — overridden at runtime via Admin > Number Pool
const DEFAULT_PHONE_ASSIGNMENTS = {
  chase:    '+18502033021', // (850) 203-3021 Chase Local
  rep11:    '+18507211779', // (850) 721-1779 Jessica Local
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

const SYSTEM_PROMPT = `You are a professional outreach representative for ScrollPay, a free Bitcoin-rewards browser extension by Stacverse. Friendly, direct, concise. Keep every response to 1-2 sentences MAX. Plain spoken words only, no special characters or markdown. This call may be recorded. You must disclose you are an AI if sincerely asked.

── WHAT SCROLLPAY IS ──
ScrollPay is a free browser extension that rewards users with Bitcoin XP for ads they already scroll past. Weekly BTC prize draws, no cost to install, no purchase required. XP has no guaranteed monetary value.

── FOR ADVERTISERS ──
ScrollPay offers a pay-per-scroll opt-in ad network — brands pay only when a real human scrolls their ad. No bots, no impression fraud, no wasted spend. Founding Partner pricing locked at launch rates. More info at scrollpay.app/partners.

── FOR EXTENSION INSTALLERS ──
Install the free ScrollPay extension and earn XP for scrolling ads you already see. Enter weekly BTC prize draws at no cost. Install at scrollpay.app.

── COMPLIANCE ──
- Never make guaranteed earnings claims — XP has no guaranteed monetary value
- Always offer to text info rather than pressure a verbal commitment
- If asked whether you are an AI or a bot, confirm you are an AI assistant

── OBJECTIONS ──
- "Not interested" → "Can I text you the install link? It's free and takes 30 seconds."
- "What is this?" → "ScrollPay — free Bitcoin-rewards browser extension from Stacverse. Want me to text you the link?"
- "Is this a scam?" → "It's a free extension, no payment info needed. I can text you the scrollpay.app link right now."
- "How do I earn Bitcoin?" → "You earn XP for scrolling ads you already see, and XP enters weekly BTC prize draws. Completely free."
- "Too busy" → "Totally fine — I'll just text you the link."
- "We have an ad platform" → "ScrollPay is pay-per-scroll with zero bot traffic — happy to text you our Founding Partner rates."
- "Who is this?" → "I'm an AI assistant calling on behalf of the ScrollPay team — free Bitcoin-rewards browser extension."

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
    const ct = req.query.contactType || 'adv';
    const opening = "Hi, this call may be recorded. I'm an AI assistant calling on behalf of the ScrollPay team — quick question for you, got a minute?";
    return res.status(200).send(buildGather(opening, [], to, ct));
  }

  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    const speech = req.body?.SpeechResult || '';
    const to = req.query.to || '';
    const ct = req.query.contactType || 'adv';
    let history = [];
    try { history = JSON.parse(decodeURIComponent(req.query.history || '[]')); } catch(e) {}
    if (speech) history.push({ role: 'user', content: speech });
    if (!speech) return res.status(200).send(buildGather("Sorry, I didn't catch that. Are you available for just a quick moment?", history, to, ct));
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: SYSTEM_PROMPT,
        messages: history,
      });
      const reply = response.content[0].text.trim();
      history.push({ role: 'assistant', content: reply });
      if (reply.includes('SEND_LINK')) {
        if (to) {
          try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const smsBody = ct === 'miner'
              ? `ScrollPay: Mine Bitcoin for ads you already scroll past — free browser extension + weekly BTC draw. Install: scrollpay.app  XP has no guaranteed value. Reply STOP to opt out.`
              : `ScrollPay: Free opt-in ad platform for brands — Founding Partner info at scrollpay.app/partners  Reply STOP to opt out.`;
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
  <Say voice="Polly.Matthew-Neural">Hello, this is ScrollPay. Please stay on the line.</Say>
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
    const ct = req.query.contactType || 'adv';
    if (digit === '1' && customerPhone) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const smsBody = ct === 'miner'
          ? `ScrollPay: Mine Bitcoin for ads you already scroll past — free browser extension + weekly BTC draw. Install: scrollpay.app  XP has no guaranteed value. Reply STOP to opt out.`
          : `ScrollPay: Free opt-in ad platform for brands — Founding Partner info at scrollpay.app/partners  Reply STOP to opt out.`;
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
          twiml: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">Hi, this is a message from ScrollPay — the free Bitcoin-rewards browser extension. Earn Bitcoin XP just by scrolling ads you already see. Completely free to install at scrollpay dot app. Have a great day.</Say><Hangup/></Response>`
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
          contactType: req.query.contactType || 'adv',
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
        contactType: contactType || 'adv', script: script || '',
      });
      const callFrom = await getRepPhone(repId);
      const call = await client.calls.create({
        to, from: callFrom,
        url: aiMode
          ? `${BASE}/api/twilio?action=ai-twiml&to=${encodeURIComponent(to)}&contactType=${contactType||'adv'}`
          : `${BASE}/api/twilio?action=twiml`,
        record: true,
        recordingStatusCallback: `${BASE}/api/recordings?action=transcript-webhook`,
        recordingStatusCallbackMethod: 'POST',
        statusCallback: `${BASE}/api/twilio?action=status&${params.toString()}`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed','failed','busy','no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactType=${contactType||'adv'}`,
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

    // ── Regular outbound call — simple direct dial ───────────────────────────
    const callerId = await getRepPhone(repId || '');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${escapeXml(callerId)}" record="record-from-answer" recordingStatusCallback="${BASE}/api/recordings?action=transcript-webhook" recordingStatusCallbackMethod="POST">
    <Number>${escapeXml(To)}</Number>
  </Dial>
</Response>`);
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
            asyncAmdStatusCallback: `${BASE}/api/twilio?action=amd&contactType=${confCt||'adv'}`,
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
        body: `📞 INBOUND CALL: ${caller} just called ScrollPay. Call them back now.`,
      }).catch(() => {});
    } catch {}
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Matthew-Neural">Thanks for calling ScrollPay — the free Bitcoin-rewards browser extension by Stacverse. Someone from our team will call you right back — we're noting your number now.</Say><Hangup/></Response>`);
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
