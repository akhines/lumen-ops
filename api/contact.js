export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const { formType, firstName, lastName, email, business } = data;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Log to Vercel function logs (visible in dashboard)
  console.log(`[${formType || 'contact'}] New submission:`, JSON.stringify(data, null, 2));

  // Forward to email via Resend (add RESEND_API_KEY env var when ready)
  if (process.env.RESEND_API_KEY) {
    try {
      const subject = formType === 'elite'
        ? `Elite Application: ${firstName} ${lastName} — ${business || 'N/A'}`
        : `New Contact: ${firstName} ${lastName} — ${business || 'N/A'}`;

      const fields = Object.entries(data)
        .filter(([k]) => k !== 'formType')
        .map(([k, v]) => `<strong>${k}:</strong> ${v || 'N/A'}`)
        .join('<br/>');

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'Lumen Ops <onboarding@resend.dev>',
          to: process.env.NOTIFY_EMAIL || 'hello@lumenops.com',
          subject,
          html: `<h2>${subject}</h2><p>${fields}</p>`,
        }),
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }
  }

  return res.status(200).json({ success: true });
}
