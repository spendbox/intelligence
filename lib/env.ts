function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  resendApiKey: () => required("RESEND_API_KEY"),
  resendFrom: () => required("RESEND_FROM_EMAIL"),
  sessionSecret: () => required("SESSION_SECRET"),
  adminEmail: () => required("ADMIN_EMAIL"),
  adminPasswordHash: () => required("ADMIN_PASSWORD_HASH"),
  cronSecret: () => required("CRON_SECRET"),
  appUrl: () => optional("APP_URL", "http://localhost:3000"),
  trialDays: () => parseInt(optional("TRIAL_DAYS", "30"), 10),
};
