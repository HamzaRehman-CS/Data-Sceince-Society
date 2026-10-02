# Data Science Society — version 2.1

Node.js 22+ website with the existing admin editor and community dashboards. Run npm install, then npm start.

Copy .env.workos.example to .env or .env.local and fill it privately. Enable WorkOS email verification, Google and GitHub. Generate a random WORKOS_COOKIE_PASSWORD of at least 32 characters.

Only /admin opens administrator sign-in; older admin/build URLs return 404. Saved public navigation and public links exclude administration. Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH on the server; the hash format is a 16-byte hex salt, a colon, and a 64-byte scrypt hash. Admin sessions expire after one hour, are revoked on credential rotation, and use a separate secure cookie. Failed sign-in limits persist in the database. Member OAuth accounts and cabinet positions cannot grant access to the administration APIs.

Register /callback as the WorkOS redirect URI. /auth/login initiates sign-in and /auth/signup starts registration. Set PUBLIC_ORIGIN and WORKOS_REDIRECT_URI to HTTPS URLs in production. Sign-out now revokes the WorkOS session server-side, blocks session-cookie replay in the database and clears cookies before returning directly to /?signedOut=1. It does not depend on a hosted logout redirect setting.

Verified users get basic student accounts. Membership, cabinet and ambassador applications require review. Cabinet appointments do not grant website administration access.

Anonymous application pages show one account-entry card with synchronized Create account and Login actions. Student, member, cabinet and ambassador dashboards have separate headings, descriptions and appropriate actions. Admin → Role workspaces controls their headings, welcome messages and visible sections; Members & approvals controls account roles, status and cabinet positions. Published public edits and role updates are checked against database revisions every five seconds while a page is visible, with faster same-browser notifications and refresh when returning to the page. Draft changes remain private until published. Read requests do not acquire the state row's write lock.

Security checks cover account ownership, announcement audiences, forged sessions and callbacks, cross-site writes, unsafe links, private-file access, upload types, restart persistence, and contact quotas. JSON bodies are bounded; contact duplicate detection and quotas persist across server instances. Content Security Policy and browser permission restrictions are served on every response. These checks reduce identified risks; they cannot guarantee the absence of every possible vulnerability.

Vercel requires a PostgreSQL DATABASE_URL for durable accounts, applications, CMS content and uploads. For Supabase, copy the Transaction pooler URL from the project's Connect dialog, enter the database password and enable verified TLS (sslmode=verify-full). Put the resulting URL in Vercel's server environment variables. The public anon key cannot replace this connection string.

The adapter applies lib/schema.sql atomically and creates dss_state and dss_files. These store the existing application state and file bytes; row-level security and revoked browser grants keep them behind the website's authorized API. Accounts, applications, CMS drafts, history and uploads commit together. Successful responses wait for COMMIT. This preserves the existing data format and serializes database requests; a busy production site should later move records to individual tables.

Local development uses .private/database.json without DATABASE_URL. Back up .private before migration; local data is not automatically copied to Vercel. After deployment, npm run check:database checks Supabase table protection and stored state without printing private records. .vercelignore excludes local accounts, backups, credentials and test files from deployment.

Source: website, accounts, admin, lib. Sanity is removed. dist and public are generated. Checks: npm test; npm run test:workspaces. Tests must use an isolated local database and test credentials rather than a production .env.local. The workspace browser test isolates its own servers and credentials. WorkOS live login and PostgreSQL require configured credentials and verification.
