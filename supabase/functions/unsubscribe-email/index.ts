import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Decode unsubscribe token
 */
function decodeUnsubscribeToken(token: string): { userId: string; emailType: string } | null {
  try {
    const payload = JSON.parse(atob(token));
    // Check expiration
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return { userId: payload.userId, emailType: payload.emailType };
  } catch {
    return null;
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const emailType = url.searchParams.get('type');

  if (!token) {
    return new Response(
      '<html><body><h1>Invalid Request</h1><p>Missing unsubscribe token.</p></body></html>',
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const decoded = decodeUnsubscribeToken(token);
  if (!decoded) {
    return new Response(
      '<html><body><h1>Invalid Token</h1><p>The unsubscribe link is invalid or has expired.</p></body></html>',
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Use provided type or default to 'all'
  const unsubscribeType = emailType || 'all';

  try {
    // Insert unsubscribe record
    // Note: null email_type means unsubscribe from all emails
    const emailTypeValue = unsubscribeType === 'all' ? null : unsubscribeType;
    
    const { error } = await supabase
      .from('email_unsubscribes')
      .upsert({
        user_id: decoded.userId,
        email_type: emailTypeValue,
      }, {
        onConflict: 'user_id,email_type',
      });

    if (error) {
      console.error('Error unsubscribing:', error);
      return new Response(
        '<html><body><h1>Error</h1><p>Failed to process unsubscribe request. Please try again later.</p></body></html>',
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Cancel any pending emails
    if (unsubscribeType === 'all') {
      await supabase
        .from('welcome_email_queue')
        .update({ status: 'cancelled' })
        .eq('user_id', decoded.userId)
        .eq('status', 'pending');
    } else {
      await supabase
        .from('welcome_email_queue')
        .update({ status: 'cancelled' })
        .eq('user_id', decoded.userId)
        .eq('email_type', unsubscribeType)
        .eq('status', 'pending');
    }

    const message = unsubscribeType === 'all'
      ? 'You have been unsubscribed from all welcome emails.'
      : `You have been unsubscribed from ${unsubscribeType} welcome emails.`;

    return new Response(
      `<html><body><h1>Unsubscribed</h1><p>${message}</p><p>You can resubscribe by contacting support.</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return new Response(
      '<html><body><h1>Error</h1><p>An unexpected error occurred. Please try again later.</p></body></html>',
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
});

