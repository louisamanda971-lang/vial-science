# Vial Science Lead Magnet Funnel

A responsive educational lead-capture website and beginner-friendly peptide guide. The project includes a landing page, thank-you page, privacy and terms starter pages, a PDF lead magnet, a Node.js/Express API, PostgreSQL schema, optional Resend email delivery, and basic tests.

## Status at a glance

- **Implemented:** responsive pages, visual styling, form UI, client-side validation, country selector, honeypot field, basic in-memory rate limit, parameterized SQL, duplicate email handling, optional marketing consent storage, signed unsubscribe endpoint, PDF guide, health endpoint, sample deployment configuration.
- **Requires configuration:** PostgreSQL database, email provider account and verified sender domain, production guide URL, community URL, site URL, unsubscribe secret, real contact details, privacy/terms review.
- **Not verified against live services:** production email delivery, production database, live hosting, legal compliance, and any product-specific scientific claims beyond the educational sources listed in the PDF.

## 1. Requirements

Install Node.js 20 or later from https://nodejs.org/. Install Git only if you plan to use version control. You can edit the project in Visual Studio Code or another text editor.

## 2. Extract and open on Windows

1. Extract `vial-science-lead-magnet-funnel.zip` to a folder you can find easily.
2. Open that folder in Visual Studio Code, or open PowerShell in the folder.
3. Install packages:

```powershell
npm install
```

4. Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

5. Edit `.env` with your own values. Do not share it or commit it to Git.

## 3. Configure PostgreSQL

Create a PostgreSQL database with a trusted provider, then set `DATABASE_URL` in `.env`. Run the schema in `database/schema.sql` using your provider's SQL editor or PostgreSQL client. Use SSL settings required by your provider. Keep database credentials private.

The API returns a configuration error if no database URL is present; it does not pretend that submissions have been stored.

## 4. Configure email delivery with Resend

1. Create a Resend account at https://resend.com/.
2. Verify a domain and sender address according to Resend's instructions.
3. Put the API key in `RESEND_API_KEY` and your verified sender in `EMAIL_FROM`.
4. Set `EMAIL_ENABLED=true` only after the account and sender are ready.
5. Set `SITE_URL` to the public website URL and `GUIDE_URL` to the public PDF URL, for example `https://your-domain.example/assets/vial-science-peptides-for-beginners.pdf`.

The email contains a guide link. Keep the PDF hosted on the same public site or a trusted file host. Test delivery with an address you control before launching.

**Important:** the app records a guide request before attempting email delivery. If email delivery fails, it reports the failure and logs a generic provider error server-side. Review logs without exposing secrets. Add an operational retry queue before relying on this for a high-volume campaign.

## 5. Community link and contact details

Set `COMMUNITY_URL` to the exact official Vial Science Skool community URL. Until then, the fallback is the generic Skool homepage and must be replaced before launch. Replace `CONTACT_EMAIL_PLACEHOLDER` in `public/index.html` and all `[INSERT ...]` placeholders in the privacy and terms pages. Review the privacy policy and terms with a qualified professional for your actual operating locations.

## 6. Run locally

```powershell
npm start
```

Open http://localhost:3000. Health check: http://localhost:3000/api/health.

To run basic tests:

```powershell
npm test
```

These tests cover a small set of validation rules only; they are not a full end-to-end test suite.

## 7. Deploy (example: Render)

1. Create a PostgreSQL database with a provider that supports your deployment region.
2. Push the project to a private Git repository or use the hosting provider's supported deployment workflow.
3. Create a web service using `deployment/render.yaml` or configure the same build and start commands (`npm install`, `npm start`).
4. Add environment variables from `.env.example` in the host dashboard. Never upload your local `.env` file.
5. Run `database/schema.sql` against the production database.
6. Set `EMAIL_ENABLED=false` until you have verified the sender, guide URL, and email configuration. Then enable it and test.
7. Use HTTPS, set the correct `SITE_URL`, and verify the health endpoint and form end to end.

## 8. Before going live checklist

- [ ] Replace generic Skool URL with the correct community link.
- [ ] Replace contact and business placeholders.
- [ ] Review privacy policy, terms, retention policy, and applicable local law.
- [ ] Review the PDF's scientific references and update them as needed.
- [ ] Configure PostgreSQL and apply schema.
- [ ] Verify email sender domain and test guide delivery.
- [ ] Test marketing consent separately from guide delivery.
- [ ] Test unsubscribe using a marketing-opted-in test address.
- [ ] Confirm mobile layout, keyboard access, contrast, and error states.
- [ ] Configure backups, monitoring, and a durable rate limiter for production.
- [ ] Consider double opt-in if appropriate for your jurisdiction and email strategy.

## 9. Important implementation notes

- The in-memory rate limit resets on restart and is not shared across multiple instances. Use a persistent shared limiter for production.
- The email integration is intentionally disabled by default.
- The marketing checkbox is unchecked by default and optional. Guide requests are stored separately from marketing consent.
- The guide PDF is an educational overview, not medical advice or a recommendation to use peptides.
- This project is a starter implementation, not a certification of legal compliance, security, or scientific accuracy.
