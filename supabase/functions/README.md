# Edge Functions

## Directory Structure

```
functions/
├── _shared/          # Shared utilities (not deployed)
│   ├── cors.ts       # CORS headers helper
│   ├── email.ts      # SMTP email service
│   └── supabase.ts   # Supabase client factory
├── _test-email/      # Example function (not deployed)
└── .env.example      # Environment template
```

Folders prefixed with `_` are ignored by Supabase and won't be deployed.

## Local Development

### JWT Verification Issue

Local edge functions have a known issue with ES256 JWT verification ([supabase/cli#4453](https://github.com/supabase/cli/issues/4453)). To work around this, disable JWT verification for each function in `config.toml`:

```toml
[functions.your-function-name]
verify_jwt = false
```

This only affects local development - production JWT verification works normally.

### Testing Email

1. Ensure Supabase is running (`npm run start`)
2. Temporarily rename `_test-email` to `test-email`
3. Add JWT config (see above)
4. Restart Supabase
5. Test: `curl -X POST http://localhost:54321/functions/v1/test-email`
6. View email at http://127.0.0.1:54324
7. Rename back to `_test-email` when done

## Production Setup

### Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (add DNS records for SPF, DKIM)
3. Add API key to Supabase secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxx
   ```

### Deploying Functions

```bash
supabase functions deploy
```
