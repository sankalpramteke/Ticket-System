import nodemailer from 'nodemailer'

let transporter = null
function getTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return transporter
}

export async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter()
  if (!tx) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[mail] SMTP not configured, skipping email to:', to)
    }
    return { skipped: true }
  }
  const from = process.env.SMTP_FROM || `Ticket System <${process.env.SMTP_USER}>`
  return tx.sendMail({ from, to, subject, text, html })
}
