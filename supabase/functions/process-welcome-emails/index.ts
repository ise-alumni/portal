import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface EmailQueueItem {
  id: string;
  user_id: string;
  profile_id: string;
  email_type: 'day_1' | 'day_3' | 'day_7' | 'day_14';
  scheduled_for: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  cohort: number | null;
  company: string | null;
  city: string | null;
  country: string | null;
}

interface ActivityItem {
  profile_id: string;
  full_name: string | null;
  company: string | null;
  job_title: string | null;
  city: string | null;
  country: string | null;
  updated_at: string;
}

// Template constants (embedded for reliability)
const TEMPLATES: Record<string, string> = {
  'welcome-day-1': `# Welcome to ISE Alumni Portal!

Hi {{user_name}},

Welcome to the ISE Alumni Portal! We're excited to have you join our community.

## Getting Started

Here are some tips to help you get the most out of the platform:

- **Complete your profile**: Add your current role, company, and location to help other alumni find you
- **Explore the directory**: Connect with fellow ISE alumni from your cohort, company, or location
- **Check out events**: See what events are happening in your area or online
- **Read announcements**: Stay up to date with important news from the ISE program

## Platform Overview Video

[Watch this short video](https://example.com/platform-tour) to learn how the platform works and discover some helpful tips.

## Need Help?

If you encounter any bugs or have questions, please report them [here](https://example.com/bug-report).

## Stay Connected

We'll send you updates about what's happening in your network. If you'd like to unsubscribe from these emails, you can do so [here]({{unsubscribe_url}}).

Best regards,  
The ISE Alumni Team`,

  'welcome-day-3': `# What Your Cohort is Up To

Hi {{user_name}},

It's been a few days since you joined! Here's what people in your cohort have been up to:

## Recent Activity

{{cohort_activity}}

## Connect with Your Cohort

Want to reconnect with your cohort? Visit the [alumni directory](https://example.com/directory) and filter by your cohort to see everyone's latest updates.

## Complete Your Profile

Don't forget to keep your profile up to date so others can find you! [Update your profile](https://example.com/profile/edit).

---

If you'd like to unsubscribe from these emails, you can do so [here]({{unsubscribe_url}}).

Best regards,  
The ISE Alumni Team`,

  'welcome-day-7': `# What People at Your Company Are Up To

Hi {{user_name}},

A week in! Here's what other ISE alumni at your company have been up to:

## Recent Activity

{{company_activity}}

## Network Within Your Company

Connect with fellow ISE alumni at your company through the [alumni directory](https://example.com/directory). You can filter by company to see everyone's profiles.

## Share Your Updates

Keep your profile updated so others can see what you're working on! [Update your profile](https://example.com/profile/edit).

---

If you'd like to unsubscribe from these emails, you can do so [here]({{unsubscribe_url}}).

Best regards,  
The ISE Alumni Team`,

  'welcome-day-14': `# What People in Your Area Are Up To

Hi {{user_name}},

Two weeks in! Here's what other ISE alumni in your area have been up to:

## Recent Activity

{{location_activity}}

## Connect Locally

Find ISE alumni near you through the [alumni directory](https://example.com/directory) and the [interactive map](https://example.com/map). You might discover alumni events happening in your area!

## Stay Active

Keep your location updated so others can find you locally. [Update your profile](https://example.com/profile/edit).

---

If you'd like to unsubscribe from these emails, you can do so [here]({{unsubscribe_url}}).

Best regards,  
The ISE Alumni Team`,
};

/**
 * Load email template
 */
async function loadTemplate(templateName: string): Promise<string> {
  const template = TEMPLATES[templateName];
  if (!template) {
    console.error(`Template ${templateName} not found`);
    throw new Error(`Template ${templateName} not found`);
  }
  return template;
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Format activity items as HTML list
 */
function formatActivity(activity: ActivityItem[]): string {
  if (activity.length === 0) {
    return '<p>No recent activity to share.</p>';
  }

  const items = activity.map(item => {
    const parts = [
      item.full_name || 'Anonymous',
      item.company ? `at ${item.company}` : '',
      item.job_title ? `as ${item.job_title}` : '',
      item.city && item.country ? `in ${item.city}, ${item.country}` : '',
    ].filter(Boolean);

    return `<li>${parts.join(' ')}</li>`;
  }).join('\n');

  return `<ul>${items}</ul>`;
}

/**
 * Check if user has unsubscribed
 */
async function isUnsubscribed(userId: string, emailType: string): Promise<boolean> {
  const { data } = await supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('user_id', userId)
    .or(`email_type.is.null,email_type.eq.all,email_type.eq.${emailType}`)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Get user profile
 */
async function getUserProfile(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, email, cohort, company, city, country')
    .eq('id', profileId)
    .single();

  if (error || !data) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Get cohort activity
 */
async function getCohortActivity(cohort: number | null, limit: number = 5): Promise<ActivityItem[]> {
  if (!cohort) return [];

  const { data, error } = await supabase.rpc('get_cohort_activity', {
    p_cohort: cohort,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching cohort activity:', error);
    return [];
  }

  return data || [];
}

/**
 * Get company activity
 */
async function getCompanyActivity(company: string | null, limit: number = 5): Promise<ActivityItem[]> {
  if (!company) return [];

  const { data, error } = await supabase.rpc('get_company_activity', {
    p_company: company,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching company activity:', error);
    return [];
  }

  return data || [];
}

/**
 * Get location activity
 */
async function getLocationActivity(
  city: string | null,
  country: string | null,
  limit: number = 5
): Promise<ActivityItem[]> {
  if (!city && !country) return [];

  const { data, error } = await supabase.rpc('get_location_activity', {
    p_city: city,
    p_country: country,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching location activity:', error);
    return [];
  }

  return data || [];
}

/**
 * Send email via send-email function
 */
async function sendEmail(to: string, subject: string, markdown: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ to, subject, markdown }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a single welcome email
 */
async function processEmail(queueItem: EmailQueueItem): Promise<void> {
  console.log(`Processing email ${queueItem.id} for user ${queueItem.user_id}, type ${queueItem.email_type}`);

  // Check unsubscribe status
  if (await isUnsubscribed(queueItem.user_id, queueItem.email_type)) {
    console.log(`User ${queueItem.user_id} has unsubscribed, skipping`);
    await supabase
      .from('welcome_email_queue')
      .update({ status: 'cancelled' })
      .eq('id', queueItem.id);
    return;
  }

  // Get user profile
  const profile = await getUserProfile(queueItem.profile_id);
  if (!profile || !profile.email) {
    console.error(`Profile or email not found for ${queueItem.profile_id}`);
    await supabase
      .from('welcome_email_queue')
      .update({
        status: 'failed',
        error_message: 'Profile or email not found',
      })
      .eq('id', queueItem.id);
    return;
  }

  // Get email config
  const { data: config } = await supabase
    .from('welcome_email_config')
    .select('templates')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!config) {
    console.error('Welcome email config not found');
    await supabase
      .from('welcome_email_queue')
      .update({
        status: 'failed',
        error_message: 'Config not found',
      })
      .eq('id', queueItem.id);
    return;
  }

  const templateConfig = config.templates[queueItem.email_type];
  if (!templateConfig) {
    console.error(`Template config not found for ${queueItem.email_type}`);
    await supabase
      .from('welcome_email_queue')
      .update({
        status: 'failed',
        error_message: `Template config not found for ${queueItem.email_type}`,
      })
      .eq('id', queueItem.id);
    return;
  }

  // Load template
  let template: string;
  try {
    template = await loadTemplate(templateConfig.template);
  } catch (error) {
    console.error(`Error loading template:`, error);
    await supabase
      .from('welcome_email_queue')
      .update({
        status: 'failed',
        error_message: `Template ${templateConfig.template} not found`,
      })
      .eq('id', queueItem.id);
    return;
  }

  // Gather activity data based on email type
  let cohortActivity: ActivityItem[] = [];
  let companyActivity: ActivityItem[] = [];
  let locationActivity: ActivityItem[] = [];

  if (queueItem.email_type === 'day_3') {
    cohortActivity = await getCohortActivity(profile.cohort);
  } else if (queueItem.email_type === 'day_7') {
    companyActivity = await getCompanyActivity(profile.company);
  } else if (queueItem.email_type === 'day_14') {
    locationActivity = await getLocationActivity(profile.city, profile.country);
  }

  // Generate unsubscribe URL
  const unsubscribeToken = await generateUnsubscribeToken(queueItem.user_id, queueItem.email_type);
  const unsubscribeUrl = `${SUPABASE_URL.replace('/rest/v1', '')}/functions/v1/unsubscribe-email?token=${unsubscribeToken}&type=${queueItem.email_type}`;

  // Replace template variables
  const variables: Record<string, string> = {
    user_name: profile.full_name || 'there',
    cohort_activity: formatActivity(cohortActivity),
    company_activity: formatActivity(companyActivity),
    location_activity: formatActivity(locationActivity),
    unsubscribe_url: unsubscribeUrl,
  };

  const emailContent = replaceTemplateVariables(template, variables);

  // Send email
  const sendResult = await sendEmail(profile.email, templateConfig.subject, emailContent);

  if (!sendResult.success) {
    console.error(`Failed to send email:`, sendResult.error);
    await supabase
      .from('welcome_email_queue')
      .update({
        status: 'failed',
        error_message: sendResult.error || 'Unknown error',
      })
      .eq('id', queueItem.id);
    return;
  }

  // Mark as sent and log
  const now = new Date().toISOString();
  await supabase
    .from('welcome_email_queue')
    .update({
      status: 'sent',
      sent_at: now,
    })
    .eq('id', queueItem.id);

  await supabase
    .from('welcome_email_log')
    .insert({
      user_id: queueItem.user_id,
      email_type: queueItem.email_type,
      subject: templateConfig.subject,
      template_used: templateConfig.template,
    });

  console.log(`Successfully sent email ${queueItem.id}`);
}

/**
 * Generate unsubscribe token (simple implementation)
 * In production, use proper JWT signing
 */
async function generateUnsubscribeToken(userId: string, emailType: string): Promise<string> {
  // Simple base64 encoding - in production use proper JWT
  const payload = { userId, emailType, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }; // 30 days
  return btoa(JSON.stringify(payload));
}

serve(async (req) => {
  try {
    // Get pending emails that are due
    const { data: queueItems, error } = await supabase
      .from('welcome_email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50); // Process up to 50 emails per run

    if (error) {
      console.error('Error fetching queue:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch queue', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No emails to process' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${queueItems.length} emails`);

    // Process each email
    const results = await Promise.allSettled(
      queueItems.map(item => processEmail(item))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: queueItems.length,
        successful,
        failed,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing welcome emails:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

