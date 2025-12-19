import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailRequest {
  to: string;
  subject: string;
  markdown: string;
  from?: string;
}

/**
 * Converts markdown to HTML
 * Simple implementation - can be enhanced with a markdown library if needed
 */
function markdownToHtml(markdown: string): string {
  // Split into paragraphs (double newlines)
  const paragraphs = markdown.split(/\n\s*\n/);
  
  const htmlParagraphs = paragraphs.map(para => {
    if (!para.trim()) return '';
    
    // Process headers first
    let html = para
      // Headers (must be at start of line)
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      // Line breaks within paragraph
      .replace(/\n/gim, '<br/>');
    
    // Wrap in paragraph if not a header
    if (!html.match(/^<h[1-6]>/)) {
      html = `<p>${html}</p>`;
    }
    
    return html;
  }).filter(Boolean).join('\n');

  return html;
}

serve(async (req) => {
  try {
    const { to, subject, markdown, from = 'ISE Alumni Portal <noreply@ise-alumni.com>' }: SendEmailRequest = await req.json();

    if (!to || !subject || !markdown) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, markdown' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const html = markdownToHtml(markdown);

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

