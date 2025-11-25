import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { reminderId } = await req.json();

    if (!reminderId) {
      return new Response(
        JSON.stringify({ error: 'Missing reminderId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch reminder with user and target details
    const { data: reminder, error: fetchError } = await supabase
      .from('reminders')
      .select(`
        *,
        user:profiles!inner(
          email
        ),
        event:events!inner(
          title,
          start_at,
          location
        ),
        announcement:announcements!inner(
          title,
          deadline
        )
      `)
      .eq('id', reminderId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !reminder) {
      return new Response(
        JSON.stringify({ error: 'Reminder not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const reminderEmail = {
      id: reminder.id,
      user_email: reminder.user.email || '',
      target_type: reminder.target_type,
      target_title: reminder.event?.title || reminder.announcement?.title || 'Unknown',
      reminder_at: reminder.reminder_at,
      event: reminder.event,
      announcement: reminder.announcement,
    };

    // Send email using Resend (or your preferred email service)
    const emailSent = await sendReminderEmail(reminderEmail);

    // Update reminder status
    const updateData = {
      status: emailSent ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
      error_message: emailSent ? null : 'Failed to send email',
    };

    const { error: updateError } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', reminderId);

    if (updateError) {
      console.error('Failed to update reminder status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: emailSent,
        message: emailSent ? 'Reminder sent successfully' : 'Failed to send reminder'
      }),
      { 
        status: emailSent ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-reminder function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendReminderEmail(reminder: any): Promise<boolean> {
  try {
    const resend = new Resend(resendApiKey);
    
    const emailSubject = `Reminder: ${reminder.target_title}`;
    
    let emailBody = '';
    if (reminder.target_type === 'event' && reminder.event) {
      emailBody = `
Hi there!

This is a friendly reminder about the upcoming event:

📅 ${reminder.target_title}
🗓️ When: ${new Date(reminder.event.start_at).toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
})}
${reminder.event.location ? `📍 Where: ${reminder.event.location}` : ''}

Don't miss out! The event is happening tomorrow.

Best regards,
ISE Alumni Team
      `;
    } else if (reminder.target_type === 'announcement' && reminder.announcement) {
      emailBody = `
Hi there!

This is a reminder about an announcement with an upcoming deadline:

📢 ${reminder.target_title}
⏰ Deadline: ${reminder.announcement.deadline ? new Date(reminder.announcement.deadline).toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
}) : 'No deadline set'}

Make sure to take any necessary action before the deadline.

Best regards,
ISE Alumni Team
      `;
    }

    const { data, error } = await resend.emails.send({
      from: 'ISE Alumni Portal <noreply@ise-alumni.com>',
      to: [reminder.user_email],
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'),
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Email sent successfully:', {
      id: data?.id,
      to: reminder.user_email,
      subject: emailSubject,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}