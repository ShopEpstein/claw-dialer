// pages/api/intake.js
// AI-powered lead intake for all Claw landing pages.
// Replaces Formspree. Handles qualification, Chase SMS alert, Brevo confirmation email.

import Anthropic from '@anthropic-ai/sdk';
import twilio from 'twilio';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://claw-dialer.vercel.app';
const CHASE_CELL = '+18503414324';
const FROM = '+18559600110';
const BREVO_FROM_EMAIL = 'campaigns@transbidlive.faith';
const BREVO_FROM_NAME = 'Chase @ VinHunter';

const PRODUCT_CONFIG = {
  econoclaw: {
    name: 'EconoClaw',
    color: '#FF6B2B',
    url: 'https://econoclaw.vercel.app/econoclaw-landing.html',
    tagline: '21 Claude AI agents. Budget price. No nonsense.',
    confirmSubject: (firstName) => `You're checked in, ${firstName} — your agents are loading.`,
    chasePrefix: '🔥 ECONOCLAW LEAD',
  },
  retardclaw: {
    name: 'RetardClaw',
    color: '#FF00AA',
    url: 'https://econoclaw.vercel.app/retardclaw-landing.html',
    tagline: 'The AI is smart. You don\'t have to be. 🦞',
    confirmSubject: (firstName) => `The lobster is warming up, ${firstName}. 🦞`,
    chasePrefix: '🦞 RETARDCLAW LEAD',
  },
  budgetrentaclaw: {
    name: 'Budget Rent-A-Claw',
    color: '#3B8FFF',
    url: 'https://econoclaw.vercel.app/budgetrentaclaw-landing.html',
    tagline: 'Rent Claude AI Agents. No contract. No setup fee.',
    confirmSubject: (firstName) => `Your fleet is reserved, ${firstName}. Keys are ready.`,
    chasePrefix: '🚗 RENT-A-CLAW LEAD',
  },
};

// ── AI QUALIFICATION ──────────────────────────────────────────────────────────
async function qualifyLead({ firstName, lastName, businessName, email, phone, selectedPlan, needs, product }) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are Chase's AI sales assistant qualifying inbound leads for Solana Solar Solutions / Claw AI products. Return JSON only, no markdown, no preamble.
Format: {
  "heat": "hot|warm|cold",
  "heat_reason": "one sentence why",
  "best_product": "product name most relevant to them",
  "cross_sell": "one other product to mention",
  "opening_line": "personalized first sentence Chase should say when he calls them back — use their name and business if available, reference what they said they need",
  "flag": "anything unusual or worth noting — empty string if nothing"
}`,
      messages: [{
        role: 'user',
        content: `Product they came from: ${product}\nName: ${firstName} ${lastName}\nBusiness: ${businessName || 'not provided'}\nPlan selected: ${selectedPlan || 'not sure yet'}\nWhat they need: ${needs || 'not provided'}\nPhone: ${phone || 'not provided'}\nEmail: ${email}`,
      }],
    });
    const text = response.content[0].text.trim().replace(/```json|```/g, '');
    return JSON.parse(text);
  } catch (e) {
    return {
      heat: 'warm',
      heat_reason: 'Filled out form — intent present.',
      best_product: product,
      cross_sell: 'EconoClaw',
      opening_line: `Hey ${firstName}, saw your form come in — wanted to reach out personally.`,
      flag: '',
    };
  }
}

// ── CONFIRMATION EMAIL ────────────────────────────────────────────────────────
async function sendConfirmationEmail({ email, firstName, product, qual, config }) {
  if (!process.env.BREVO_API_KEY || !email) return;

  const heatColor = qual.heat === 'hot' ? '#FF3B3B' : qual.heat === 'warm' ? '#FF6B2B' : '#6B7A8D';
  const heatEmoji = qual.heat === 'hot' ? '🔥' : qual.heat === 'warm' ? '⚡' : '👋';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#080A0F;padding:22px 28px;border-bottom:3px solid ${config.color};">
          <span style="font-size:20px;font-weight:bold;color:${config.color};letter-spacing:2px;font-family:'Courier New',monospace;">${config.name.toUpperCase()}</span>
          <span style="font-size:11px;color:#6B7A8D;margin-left:10px;font-family:Arial,sans-serif;">${config.tagline}</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="font-size:17px;color:#1a1a1a;font-weight:bold;margin:0 0 6px;">Hey ${firstName},</p>
          <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">
            We got your request. Chase will reach out within 24 hours to get you set up. 
            Usually way faster — he's been known to call back in 10 minutes on a hot one.
          </p>
          <table width="100%" cellpadding="14" cellspacing="0" style="background:#f9f9f9;border-left:3px solid ${config.color};border-radius:2px;margin:0 0 22px;">
            <tr><td>
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">What happens next</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:5px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;">
                  <span style="color:${config.color};font-weight:bold;margin-right:8px;">1.</span>Chase reviews your request personally
                </td></tr>
                <tr><td style="padding:5px 0;font-size:13px;color:#333;border-bottom:1px solid #eee;">
                  <span style="color:${config.color};font-weight:bold;margin-right:8px;">2.</span>30-minute setup call — he configures everything, you don't touch anything technical
                </td></tr>
                <tr><td style="padding:5px 0;font-size:13px;color:#333;">
                  <span style="color:${config.color};font-weight:bold;margin-right:8px;">3.</span>Agents go live within 24 hours of that call
                </td></tr>
              </table>
            </td></tr>
          </table>
          <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
            In the meantime, have a look at what you're getting:<br>
            <a href="${config.url}" style="color:${config.color};font-weight:bold;">${config.url}</a>
          </p>
          <p style="font-size:14px;color:#333;margin:0;">
            — Chase<br>
            <span style="font-size:12px;color:#888;">Solana Solar Solutions · (850) 341-4324 · chase@solanasolarsolutions.com</span>
          </p>
        </td></tr>
        <tr><td style="background:#f5f5f5;padding:14px 28px;border-top:1px solid #eee;">
          <p style="font-size:11px;color:#aaa;margin:0;">
            You submitted this form at ${config.url}. Reply to opt out of future messages.
            Solana Solar Solutions · 11000 Tanton Lane, Pensacola FL 32506
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
        to: [{ email, name: firstName }],
        subject: config.confirmSubject(firstName),
        htmlContent: html,
      }),
    });
  } catch (e) {
    console.error('Brevo confirmation error:', e.message);
  }
}

// ── CHASE SMS ALERT ───────────────────────────────────────────────────────────
async function alertChase({ firstName, lastName, businessName, phone, email, selectedPlan, needs, qual, config }) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const heatTag = qual.heat === 'hot' ? '🔥🔥🔥' : qual.heat === 'warm' ? '⚡' : '👋';
    const body = [
      `${config.chasePrefix} ${heatTag}`,
      `${firstName} ${lastName}${businessName ? ' @ ' + businessName : ''}`,
      phone ? `📞 ${phone}` : '',
      email ? `📧 ${email}` : '',
      selectedPlan ? `Plan: ${selectedPlan}` : '',
      needs ? `Needs: ${needs.slice(0, 80)}` : '',
      `Heat: ${qual.heat_reason}`,
      `Opening: "${qual.opening_line}"`,
      qual.flag ? `⚠️ ${qual.flag}` : '',
    ].filter(Boolean).join('\n');

    await client.messages.create({ to: CHASE_CELL, from: FROM, body: body.slice(0, 1600) });
  } catch (e) {
    console.error('Chase alert SMS error:', e.message);
  }
}

// ── SAVE TO RECORDINGS STORE ──────────────────────────────────────────────────
async function saveToStore({ firstName, lastName, businessName, phone, email, product, selectedPlan, needs, qual }) {
  try {
    await fetch(`${BASE}/api/recordings?action=save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callSid: `intake_${Date.now()}`,
        contactName: `${firstName} ${lastName}`.trim(),
        contactPhone: phone || '',
        contactEmail: email || '',
        business: businessName || '',
        outcome: 'inbound-lead',
        duration: 0,
        script: product,
        notes: `Plan: ${selectedPlan || '—'} | Needs: ${needs || '—'} | Heat: ${qual.heat} — ${qual.heat_reason}`,
      }),
    });
  } catch (e) {
    console.error('Save to store error:', e.message);
  }
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS — landing pages are on a different subdomain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    firstName, lastName, businessName, email, phone,
    product, selectedPlan, needs,
  } = req.body || {};

  if (!email && !phone) return res.status(400).json({ error: 'Need at least email or phone.' });
  if (!firstName) return res.status(400).json({ error: 'First name required.' });

  const productKey = (product || 'econoclaw').toLowerCase().replace(/[\s-]/g, '');
  const config = PRODUCT_CONFIG[productKey] || PRODUCT_CONFIG.econoclaw;

  // Run qualification and side-effects in parallel
  const qual = await qualifyLead({ firstName, lastName, businessName, email, phone, selectedPlan, needs, product: config.name });

  await Promise.allSettled([
    alertChase({ firstName, lastName, businessName, phone, email, selectedPlan, needs, qual, config }),
    email ? sendConfirmationEmail({ email, firstName, product: productKey, qual, config }) : Promise.resolve(),
    saveToStore({ firstName, lastName, businessName, phone, email, product: config.name, selectedPlan, needs, qual }),
  ]);

  return res.status(200).json({
    ok: true,
    heat: qual.heat,
    message: `Got it, ${firstName}. Chase will reach out within 24 hours.`,
  });
}
