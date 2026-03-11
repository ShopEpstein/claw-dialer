import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const BASE = 'https://claw-dialer.vercel.app';
const FROM = '+18559600110';
const PITCH_URL = 'https://claw-dialer.vercel.app/CarFaxKillerf49.mp3';
const CHASE_CELL = '+18503414324';

const SYSTEM_PROMPT = `You are calling auto dealerships on behalf of Chase Epstein to pitch VinHunter.

PITCH: CARFAX charges $45 per report. VinHunter is $49 a month — unlimited reports, plus Google-indexed Trust Score pages for every VIN on their lot overnight, plus things CARFAX cannot check: active federal investigations, AI fraud detection, theft databases CARFAX doesn't access. Every dealer gets a free profile regardless.

GOAL: Get them to claim their free profile or agree to receive a text link. That's it.

RULES:
- 1-2 short sentences max per response. Plain spoken words only.
- If asked if you are human or AI: say "I'm a voice assistant calling on Chase's behalf."
- If asked who Chase is: "Chase runs VinHunter — free dealer profiles, forty-nine a month beats CARFAX."
- If they already have CARFAX: "CARFAX charges per report. We are forty-nine a month unlimited, plus Google pages for every VIN they do not offer."
- If not interested: "Totally fair — can I text you the free profile link? Takes thirty seconds to claim, no commitment."
- If they want a human: respond only with ESCALATE
- If they give their email address: respond only with SAVE_EMAIL:[the email address]
- If they want the link or agree to claim profile: respond only with SEND_LINK
- If they want to end the call: respond only with HANGUP

IVR / PHONE DIRECTORY DETECTION — CRITICAL:
If the speech sounds like an automated phone system, answering service, or IVR menu — examples:
"thank you for calling", "press 1 for", "para español", "please hold", "please listen carefully",
"dial by name", "our menu has changed", "press or say", "if you know your party's extension",
"to reach", "our hours are", "leave a message", "after the tone", "voicemail", "not available right now"
— respond only with: PRESS_DIGIT:1

If it sounds like a live human receptionist or gatekeeper (not a menu, but a person answering),
say: "Hi, can you connect me with whoever handles your used car inventory or marketing? Thanks."

Do NOT escalate for IVR menus or answering services. Only ESCALATE when a live human explicitly
asks to speak with a real person or your supervisor.`;

function escapeXml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function say(text) {
  return '<Say voice="Polly.Matthew-Neural">' + escapeXml(text) + '</Say>';
}

function buildGather(sayText, history, to, contactId) {
  const historyParam = encodeURIComponent(JSON.stringify(history));
  const url = BASE + '/api/twilio?action=ai-respond&to=' + encodeURIComponent(to) + '&contactId=' + encodeURIComponent(contactId||'') + '&history=' + historyParam;
  // input="speech dtmf" so IVR keypresses also trigger the action
  return '<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech dtmf" action="' + escapeXml(url) + '" method="POST" speechTimeout="3" speechModel="phone_call" enhanced="true" timeout="10" numDigits="1">' + say(sayText) + '</Gather>' + say("I didn't catch that. No problem, have a great day.") + '<Hangup/></Response>';
}

function pressDigit(digit, history, to, contactId) {
  // Play the digit then re-enter the gather loop to catch whatever comes next
  const historyParam = encodeURIComponent(JSON.stringify(history));
  const url = BASE + '/api/twilio?action=ai-respond&to=' + encodeURIComponent(to) + '&contactId=' + encodeURIComponent(contactId||'') + '&history=' + historyParam;
  return '<?xml version="1.0" encoding="UTF-8"?><Response><Play digits="' + escapeXml(String(digit)) + '"/><Gather input="speech dtmf" action="' + escapeXml(url) + '" method="POST" speechTimeout="3" speechModel="phone_call" enhanced="true" timeout="10" numDigits="1">' + say('') + '</Gather>' + say("I didn't catch that. No problem, have a great day.") + '<Hangup/></Response>';
}

function hangupXml(text) {
  return '<?xml version="1.0" encoding="UTF-8"?><Response>' + say(text) + '<Hangup/></Response>';
}

async function sendSMS(to, body) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ to, from: FROM, body });
  } catch(e) { console.error('SMS error:', e.message); }
}

async function saveCallRecord(data) {
  try {
    await fetch(BASE + '/api/recordings?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch(e) { console.error('Save record error:', e.message); }
}

export default async function handler(req, res) {
  const { action } = req.query;

  // AI TWIML: opening pitch
  if (action === 'ai-twiml') {
    res.setHeader('Content-Type', 'text/xml');
    const to = req.query.to || '';
    const contactId = req.query.contactId || '';
    return res.status(200).send(buildGather(
      "Hey, is this the owner or manager? Quick question about your inventory — CARFAX charges you forty-five dollars every single report. We do unlimited for forty-nine a month. Got thirty seconds?",
      [], to, contactId
    ));
  }

  // AI RESPOND: Claude handles conversation
  if (action === 'ai-respond') {
    res.setHeader('Content-Type', 'text/xml');
    // Check for DTMF input (someone pressed a key on their end)
    const dtmf = (req.body?.Digits || '').trim();
    const speech = (req.body?.SpeechResult || '').trim();
    const to = req.query.to || '';
    const contactId = req.query.contactId || '';
    let history = [];
    try { history = JSON.parse(decodeURIComponent(req.query.history || '[]')); } catch(e) {}

    // If they pressed a digit on their keypad (not us), treat as "yes I'm here" and pitch
    if (dtmf && !speech) {
      history.push({ role: 'user', content: `[pressed ${dtmf}]` });
      return res.status(200).send(buildGather(
        "Hey — is this the owner or manager? CARFAX charges forty-five dollars per report. We do unlimited for forty-nine a month. Got thirty seconds?",
        history, to, contactId
      ));
    }

    if (!speech && !dtmf) {
      return res.status(200).send(buildGather("Sorry, I didn't catch that. Are you the owner or manager?", history, to, contactId));
    }

    history.push({ role: 'user', content: speech || `[pressed ${dtmf}]` });

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: history,
      });

      const reply = response.content[0].text.trim();
      history.push({ role: 'assistant', content: reply });

      // IVR: press a digit to navigate the menu
      if (reply.startsWith('PRESS_DIGIT:')) {
        const digit = reply.replace('PRESS_DIGIT:', '').trim().charAt(0) || '1';
        return res.status(200).send(pressDigit(digit, history, to, contactId));
      }

      if (reply.includes('SEND_LINK')) {
        await sendSMS(to, 'Chase @ VinHunter: Claim your free dealer profile + $49/mo beats CARFAX: https://vinledgerai.live/pricing — Reply STOP to opt out.');
        return res.status(200).send(buildGather(
          "Perfect, just texted you the link. What is the best email to send you the full breakdown?",
          history, to, contactId
        ));
      }

      if (reply.includes('SAVE_EMAIL:')) {
        const email = reply.replace('SAVE_EMAIL:', '').trim();
        if (email) {
          try {
            await fetch(BASE + '/api/recordings?action=email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: email, contactName: '', business: '', product: 'VINHUNTER', contactId }),
            });
          } catch(e) {}
        }
        return res.status(200).send(hangupXml("Perfect. Sending that over now. Have a great day."));
      }

      if (reply.includes('ESCALATE')) {
        await sendSMS(CHASE_CELL, '🔥 ESCALATE: ' + to + ' wants to speak with you now — VinHunter call.');
        return res.status(200).send(hangupXml("Absolutely. I will have Chase call you right back. Have a great day."));
      }

      if (reply.includes('HANGUP')) {
        return res.status(200).send(hangupXml("No problem at all. Have a great day."));
      }

      return res.status(200).send(buildGather(reply, history, to, contactId));

    } catch(err) {
      console.error('Claude error:', err.message);
      return res.status(200).send(hangupXml("Sorry about that. Have a great day."));
    }
  }

  // TWIML: MP3 robocall — play once, hang up, wait for them to text back
  if (action === 'twiml') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response><Play>' + PITCH_URL + '</Play><Hangup/></Response>');
  }

  // AMD: voicemail detected — drop MP3
  if (action === 'amd') {
    const { CallSid, AnsweredBy } = req.body || {};
    const isVM = ['machine_end_beep','machine_end_silence','machine_end_other'].includes(AnsweredBy);
    if (isVM && CallSid) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.calls(CallSid).update({
          twiml: '<?xml version="1.0" encoding="UTF-8"?><Response><Play>' + PITCH_URL + '</Play><Hangup/></Response>'
        });
      } catch(err) { console.error('AMD error:', err.message); }
    }
    return res.status(200).end();
  }

  // STATUS: call completed — log outcome once
  if (action === 'status') {
    const { CallSid, CallStatus, CallDuration, To } = req.body || {};
    const contactName = req.query.contactName ? decodeURIComponent(req.query.contactName) : '';
    const contactEmail = req.query.contactEmail ? decodeURIComponent(req.query.contactEmail) : '';
    const contactId = req.query.contactId ? decodeURIComponent(req.query.contactId) : '';
    const script = req.query.script ? decodeURIComponent(req.query.script) : '';
    const terminal = ['completed','failed','busy','no-answer'];
    if (terminal.includes(CallStatus)) {
      const dur = parseInt(CallDuration || 0);
      const outcome = CallStatus === 'completed' && dur >= 8 ? 'answered' : 'voicemail';
      await saveCallRecord({ callSid: CallSid, contactName, contactPhone: To, contactEmail, contactId, script, outcome, duration: CallDuration, notes: '' });
    }
    return res.status(200).end();
  }

  // CALLSTATUS: browser polls this to detect call end
  if (action === 'callstatus') {
    const { sid } = req.query;
    if (!sid) return res.status(400).json({ error: 'Missing sid' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const call = await client.calls(sid).fetch();
      return res.status(200).json({ status: call.status, duration: call.duration });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // INBOUND SMS
  if (action === 'inbound-sms') {
    const { From, Body } = req.body || {};
    const upper = (Body || '').trim().toUpperCase();
    console.log('Inbound SMS from ' + From + ': ' + Body);
    if (['STOP','STOPALL','UNSUBSCRIBE','CANCEL','END','QUIT'].includes(upper)) {
      console.log('DNC: ' + From);
    }
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }

  // INBOX
  if (action === 'inbox') {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const messages = await client.messages.list({ to: FROM, limit: 50 });
      return res.status(200).json({
        messages: messages.map(m => ({ sid: m.sid, from: m.from, body: m.body, dateSent: m.dateSent, status: m.status }))
      });
    } catch(err) { return res.status(500).json({ error: err.message, messages: [] }); }
  }

  if (req.method !== 'POST') return res.status(405).end();
  const body = req.body || {};

  // CALL: initiate outbound
  if (action === 'call') {
    const { to, contactName, contactEmail, contactId, aiMode, script } = body;
    if (!to) return res.status(400).json({ error: 'Missing to number' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const nameParam = encodeURIComponent(contactName || '');
      const emailParam = encodeURIComponent(contactEmail || '');
      const idParam = encodeURIComponent(contactId || '');
      const scriptParam = encodeURIComponent(script || '');
      const call = await client.calls.create({
        to,
        from: FROM,
        url: aiMode
          ? BASE + '/api/twilio?action=ai-twiml&to=' + encodeURIComponent(to) + '&contactId=' + idParam
          : BASE + '/api/twilio?action=twiml',
        record: true,
        recordingStatusCallback: BASE + '/api/recordings?action=transcript-webhook',
        recordingStatusCallbackMethod: 'POST',
        recordingChannels: 'mono',
        statusCallback: BASE + '/api/twilio?action=status&contactName=' + nameParam + '&contactEmail=' + emailParam + '&contactId=' + idParam + '&script=' + scriptParam,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['completed','failed','busy','no-answer'],
        machineDetection: 'DetectMessageEnd',
        asyncAmdStatusCallback: BASE + '/api/twilio?action=amd',
        asyncAmdStatusCallbackMethod: 'POST',
      });
      return res.status(200).json({ success: true, callSid: call.sid });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  // SMS: send outbound
  if (action === 'sms') {
    const { to, body: smsBody } = body;
    if (!to || !smsBody) return res.status(400).json({ error: 'Missing to or body' });
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({ to, from: FROM, body: smsBody });
      return res.status(200).json({ success: true, messageSid: message.sid, status: message.status });
    } catch(err) { return res.status(500).json({ error: err.message }); }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
