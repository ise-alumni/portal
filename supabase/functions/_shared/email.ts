import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

interface SmtpConfig {
  host: string
  port: number
  username?: string
  password?: string
}

function getSmtpConfig(): SmtpConfig {
  const isProduction = Deno.env.get('SUPABASE_URL')?.startsWith('https://')

  if (isProduction) {
    return {
      host: 'smtp.resend.com',
      port: 587,
      username: 'resend',
      password: Deno.env.get('RESEND_API_KEY')!,
    }
  }

  // Local dev: Inbucket (no auth required)
  // Use host.docker.internal to reach host from inside Docker container
  return {
    host: 'host.docker.internal',
    port: 54325,
  }
}

function getDefaultFrom(): string {
  const name = Deno.env.get('EMAIL_FROM_NAME') || 'ISE Alumni'
  const email = Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@example.com'
  return `${name} <${email}>`
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html, from = getDefaultFrom() } = options
  const config = getSmtpConfig()

  const env = config.host.includes('docker') ? 'LOCAL' : 'PROD'
  console.log(`[${env}] Attempting to send email: ${subject} -> ${to}`)
  console.log(`[${env}] SMTP config: ${config.host}:${config.port}`)

  const client = new SMTPClient({
    connection: {
      hostname: config.host,
      port: config.port,
      tls: config.port === 587,  // TLS for Resend, none for Inbucket
      auth: config.username ? {
        username: config.username,
        password: config.password!,
      } : undefined,
    },
    debug: {
      // Allow unsecure for local dev only (no auth = Inbucket = no TLS needed)
      allowUnsecure: !config.username,
    },
  })

  try {
    await client.send({
      from,
      to,
      subject,
      content: 'auto',
      html,
    })

    console.log(`[${env}] Email sent successfully`)
    return { success: true }
  } catch (error) {
    console.error(`[${env}] Failed to send email:`, error)
    return { success: false, error: String(error) }
  } finally {
    try {
      await client.close()
    } catch {
      // Ignore close errors - connection may not have been established
    }
  }
}
