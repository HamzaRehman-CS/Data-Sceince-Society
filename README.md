# Data Science Society — version 2

Node.js 22+ website with the existing admin editor and community dashboards. Run npm install, then npm start.

Copy .env.workos.example to .env or .env.local and fill it privately. Enable WorkOS email verification, Google and GitHub. Generate a random WORKOS_COOKIE_PASSWORD of at least 32 characters.

Version 2 uses /admin as the private administrator entry point. The public website has no administration link. Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH on the server; the hash format is a 16-byte hex salt, a colon, and a 64-byte scrypt hash. Admin sessions expire after one hour, are revoked on credential rotation, and use a separate secure cookie. Failed sign-in limits persist in the database. Member OAuth accounts and cabinet positions cannot grant access to the administration APIs.

WorkOS URLs: /callback (redirect), /auth/login (initiate login), / (sign-out return); /auth/signup starts registration. CORS uses the website origin. Set PUBLIC_ORIGIN and WORKOS_REDIRECT_URI to HTTPS URLs in production.

Verified users get basic student accounts. Membership, cabinet and ambassador applications require review. Cabinet appointments do not grant website administration access.

Vercel requires a PostgreSQL DATABASE_URL for durable accounts, applications, CMS content and uploads. For Supabase, copy the Transaction pooler URL from the project's Connect dialog, enter the database password and enable verified TLS (sslmode=verify-full). Put the resulting URL in Vercel's server environment variables. The public anon key cannot replace this connection string.

The adapter applies lib/schema.sql atomically and creates dss_state and dss_files. These store the existing application state and file bytes; row-level security and revoked browser grants keep them behind the website's authorized API. Accounts, applications, CMS drafts, history and uploads commit together. Successful responses wait for COMMIT. This preserves the existing data format and serializes database requests; a busy production site should later move records to individual tables.

Local development uses .private/database.json without DATABASE_URL. Back up .private before migration; local data is not automatically copied to Vercel. After deployment, npm run check:database checks Supabase table protection and stored state without printing private records. .vercelignore excludes local accounts, backups, credentials and test files from deployment.

Source: website, accounts, admin, lib. Sanity is removed. dist and public are generated. Checks: npm test; npm run test:experience. Tests must use an isolated local database and test credentials rather than a production .env.local. WorkOS live login and PostgreSQL require configured credentials and verification.
