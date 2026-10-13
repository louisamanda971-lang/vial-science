import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pg from 'pg';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false } }) : null;
const hits = new Map();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "https://fonts.googleapis.com"], fontSrc: ["'self'", "https://fonts.gstatic.com", 'data:'], imgSrc: ["'self'", 'data:'], scriptSrc: ["'self'"], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"] } } }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now(); const entry = hits.get(ip) || { start: now, count: 0 };
  if (now - entry.start > 10 * 60 * 1000) { entry.start = now; entry.count = 0; }
  entry.count++; hits.set(ip, entry);
  if (entry.count > 12) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
  next();
}
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320; }
function sign(email) { return crypto.createHmac('sha256', process.env.UNSUBSCRIBE_SECRET || 'development-only-change-me').update(email.toLowerCase()).digest('hex'); }
function safeEqual(a,b) { const x=Buffer.from(String(a)); const y=Buffer.from(String(b)); return x.length===y.length && crypto.timingSafeEqual(x,y); }
async function sendGuideEmail(email, firstName) {
  if (process.env.EMAIL_ENABLED !== 'true') return { sent: false, reason: 'email-disabled' };
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.GUIDE_URL) throw new Error('Email configuration incomplete');
  const unsubscribeUrl = `${process.env.SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${sign(email)}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject: 'Your Vial Science beginner guide is ready', html: `<p>Hello ${escapeHtml(firstName)},</p><p>Thank you for requesting <strong>The Complete Guide to Peptides for Beginners</strong>.</p><p><a href="${escapeHtml(process.env.GUIDE_URL)}">Open your free educational guide</a></p><p>This resource is educational only and is not medical advice or a recommendation to use any peptide.</p><hr><p style="font-size:12px;color:#666">If you opted in to educational updates, you can unsubscribe at any time: <a href="${unsubscribeUrl}">unsubscribe</a>.</p>` })
  });
  if (!response.ok) throw new Error('Email provider rejected request');
  return { sent: true };
}
function escapeHtml(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

app.get('/api/health', async (_req,res) => res.json({ ok: true, databaseConfigured: Boolean(pool), emailEnabled: process.env.EMAIL_ENABLED === 'true' }));
app.post('/api/subscribe', rateLimit, async (req, res) => {
  try {
    const firstName = String(req.body.firstName || '').trim().slice(0,100);
    const email = String(req.body.email || '').trim().toLowerCase();
    const country = String(req.body.country || '').trim().slice(0,100);
    const marketingConsent = req.body.marketingConsent === true || req.body.marketingConsent === 'true' || req.body.marketingConsent === 'on';
    if (req.body.website) return res.status(200).json({ ok: true }); // honeypot: quietly ignore bots
    if (!firstName || !country || !validEmail(email)) return res.status(400).json({ error: 'Please enter your first name, a valid email address, and your country.' });
    if (!pool) return res.status(503).json({ error: 'The sign-up service is not configured yet. Please try again later.' });
    const result = await pool.query(
      `INSERT INTO leads (first_name,email,country,marketing_consent,marketing_consent_at)
       VALUES ($1,$2,$3,$4,CASE WHEN $4 THEN NOW() ELSE NULL END)
       ON CONFLICT (email) DO UPDATE SET first_name=EXCLUDED.first_name,country=EXCLUDED.country,
       marketing_consent=(leads.marketing_consent OR EXCLUDED.marketing_consent),
       marketing_consent_at=CASE WHEN EXCLUDED.marketing_consent AND NOT leads.marketing_consent THEN NOW() ELSE leads.marketing_consent_at END,
       unsubscribed_at=CASE WHEN EXCLUDED.marketing_consent THEN NULL ELSE leads.unsubscribed_at END
       RETURNING id`, [firstName,email,country,marketingConsent]);
    let delivery = { sent: false };
    try { delivery = await sendGuideEmail(email, firstName); }
    catch (mailErr) { console.error('Guide email delivery failed:', mailErr.message); return res.status(502).json({ error: 'Your request was saved, but the guide email could not be sent. Please contact the site owner or try again later.' }); }
    return res.status(200).json({ ok: true, delivery: delivery.sent ? 'sent' : 'not-configured' });
  } catch (err) {
    console.error('Subscribe request failed:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
});
app.get('/api/unsubscribe', async (req,res) => {
  const email=String(req.query.email||'').toLowerCase(); const token=String(req.query.token||'');
  if (!validEmail(email) || !safeEqual(sign(email),token)) return res.status(400).send('This unsubscribe link is invalid or expired.');
  if (!pool) return res.status(503).send('Unsubscribe is temporarily unavailable. Please contact the site owner.');
  try { await pool.query('UPDATE leads SET marketing_consent=FALSE,unsubscribed_at=NOW() WHERE email=$1',[email]); res.sendFile(path.join(__dirname,'../public/unsubscribed.html')); }
  catch (err) { console.error('Unsubscribe failed:',err.message); res.status(500).send('We could not process this request right now. Please try again later.'); }
});
app.get('/api/config', (_req,res) => res.json({ communityUrl: process.env.COMMUNITY_URL || 'https://www.skool.com/' }));
app.get('*', (req,res,next) => { if (req.path.startsWith('/api/')) return next(); res.sendFile(path.join(__dirname,'../public/index.html')); });
app.listen(PORT, () => console.log(`Vial Science funnel running at http://localhost:${PORT}`));
