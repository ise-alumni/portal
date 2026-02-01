import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { sendEmail } from '../_shared/email.ts'

serve(async (req) => {
  const result = await sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<h1>Hello!</h1><p>Email infrastructure is working.</p>',
  })
  return new Response(JSON.stringify(result))
})