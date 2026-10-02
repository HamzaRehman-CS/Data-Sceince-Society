# Website activation

The local build and tests pass. Supabase database tables and initial website content are provisioned. Database write/read/rollback and browser-key denial checks pass against the real project. The website's database connection, production deployment, real login and email delivery still need verification.

Project: https://vercel.com/hamza--rehman/data-sceince-society

Database: https://supabase.com/dashboard/project/nmfgksbjzlnlgrlljiji

Access checks on 2 October 2026:

- Supabase public authentication settings responded successfully. Email signup is enabled; email confirmation is required. Google and GitHub are disabled.
- Both the Vercel connector and saved CLI credentials returned 403 for the requested project/team. Reconnect with access to hamza--rehman.
- Supabase administrative access is connected. Migration dss_private_application_storage created dss_state and dss_files with RLS enabled and browser grants revoked. Both tables reject the public anon key (HTTP 401); SQL checks also confirm no authenticated browser grants.
- Initial published website content is loaded. The live database starts with zero accounts, applications, sessions or uploads; local test accounts and private records were not copied. Transaction checks changed state and uploaded a temporary file, then verified both changes rolled back.
- Security advisors returned two informational RLS-without-policy notices, expected for these server-only tables with browser grants revoked. There were no security warnings/errors or performance notices. Explanation: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- No WorkOS credentials or authorized WorkOS connection are available.

The schema and initial state have been applied. In Supabase's Connect dialog, copy the Transaction pooler connection string, enter the database password, and add verified TLS (sslmode=verify-full). Save it as DATABASE_URL in Vercel's server environment; do not paste it into chat. The Supabase integration does not reveal your database password. No pooler host has been guessed.

The existing login implementation uses WorkOS. Fill .env.workos.example privately or set the corresponding Vercel environment variables. Set the real HTTPS production origin and register its /callback, /auth/login and / URLs in WorkOS. Authorize Google and GitHub in that provider and enable email verification. If Supabase login is chosen instead, implement and verify that provider before deployment; the supplied anon key has not been wired into a login implementation.

Deployment files exclude .private, local credentials, backups and test records. GitHub repository access is authorized; tested changes are being uploaded on a review branch. Vercel project authorization is still denied. No production deployment has been performed.
