# Data Science Society: Supabase setup and website audit
Prepared 2 October 2026 (Asia/Karachi).

This is the requested report before implementation. Application source, authentication settings, live content, and existing accounts have not been changed. Validation generated screenshots in .private/qa-experience using isolated test databases.

## Current project and validation

The active application is a Node.js server with twelve public pages, a shared login, member dashboards, and an administration/editor portal. It currently stores accounts, sessions, content, applications, and activity in .private/database.json. Uploaded files use local storage. Supabase authentication, a remote database, and email delivery are not integrated.

The local database currently contains five accounts and four previous content publications. The database has student, ambassador, and administrator roles; code also supports society members. No private account details or password hashes are included in this report. Legacy Sanity files and previous build output exist; backend.js is the active source of permissions and storage.

Checks run successfully:
- scripts/check.cjs: syntax checks for active server/public/admin JavaScript and template checks.
- tests/integration.cjs: authentication, CMS publication, permissions, protected files, community operations, and persistence across restart.
- tests/page-experience.cjs: all twelve public pages at 320, 390, 768, and 1440 pixels (48 page checks), motion controls, reduced motion, static fallback, CMS changes, and private opportunities.
- Additional Chrome inspection: mobile menu, SVG geometry, account logos, and an in-memory custom-logo preview.

These checks use Chrome on Windows and seeded isolated data. Safari/macOS, Firefox, actual phones, production hosting, and live OAuth/email delivery have not been verified. Passing the existing tests does not establish that every page or security boundary is bug free.

## Findings to address while preserving the design

1. **Default administrator credentials remain active.** The current local owner still uses the bootstrap password. Fresh installations also create this account automatically unless manual setup is selected (backend.js:84). Remove that production bootstrap path and establish the real owner securely. This is a launch blocker.
2. **The SVG has insufficient horizontal padding.** The path bounds are x=1 through x=71 with a 5.5-unit stroke in a 72-unit view box. The stroke extends approximately 1.75 units outside both sides. Inline page SVGs permit visible overflow, while the external image/favicons can crop the stroke. Correct the shared geometry and update every copied mark, including the large About treatment.
3. **Custom branding is inconsistent.** Header and footer accept the configured image, but the menu creates a hard-coded SVG and name. A browser preview confirmed header=true, footer=true, menu=false for the custom logo. The admin shell initializes the default brand; pending dashboards can also fall back to it. Use shared branding with consistent dimensions and a fallback for failed image loads.
4. **The menu already fits the visual theme.** Keep its blue-and-white colours, typography, and rounded panel. Improve small-screen spacing/scrolling, give the dialog an accessible name, expose expanded state on its trigger, and preserve focus/keyboard behaviour. At 390x844 its long navigation list scrolls inside the dialog.
5. **Email ownership is not verified.** Student accounts currently become active immediately; reset links are created by an admin and shared manually. Supabase must add confirmation, resend, recovery, and clear expired-link/error states while preserving member/ambassador review.
6. **Local storage assumes one server process.** Supabase migration must preserve draft/public separation, revision conflicts, approval status, private documents, and backups. Production hosting also needs HTTPS, an exact PUBLIC_ORIGIN, and appropriate abuse controls. Current rate limits use the socket IP, so proxy behaviour must be handled when the host is selected.

## What you need to set up and provide

| Item | What you do | What to provide here |
| --- | --- | --- |
| Supabase project | Create a project in your own account; keep its database password securely | Project URL and publishable key (legacy anon key is also usable), plus project reference if available |
| Schema setup | Run the SQL migrations I supply in Supabase, or arrange authorized access to apply them | Confirm which setup method you prefer; no personal account password is needed |
| Backend administrative key | Put a Supabase secret key / legacy service_role key in local and hosting server secrets when migration or administrative operations require it | Confirm that it is configured; do not paste it into chat |
| Website hosting | Choose a service supporting this Node.js application and HTTPS | Hosting provider, production URL/domain, and any staging URL |
| Google login | Create a Google Cloud Web OAuth client and configure branding/audience; enable Google in Supabase | Confirm the provider is configured; client secrets stay in the Supabase dashboard |
| GitHub login | Create a GitHub OAuth App and enable GitHub in Supabase | Confirm the provider is configured; client secrets stay in the Supabase dashboard |
| Email delivery | Configure a custom SMTP service and verify its sending domain | Sender address/name and provider; SMTP password stays in Supabase |
| Ownership and branding | Choose the real administrator and authoritative society name/logo | Owner email; confirm “Data Science Society” versus “Data Sense Society”; original SVG or transparent high-resolution logo if the existing mark is not authoritative |
| Existing accounts | Choose how to preserve the five existing accounts | Identify test accounts versus real accounts and confirm whether real users may receive migration/reset emails |
| Email login | Choose password login or passwordless email links | Default assumption: email + password with mandatory confirmation |

Public Supabase keys may be supplied here. Secret/service-role keys bypass database protections and belong only in trusted server environments. I can supply SQL for you to run without needing your database password or a personal Supabase access token. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## Provider setup steps

**Google**
1. In Google Cloud / Google Auth Platform, configure the app name, support email, audience, and basic identity scopes: openid, email, and profile.
2. Create a Web application OAuth client. Configure the website origins you will actually use.
3. Copy the callback URL from Supabase → Authentication → Google into Google's authorized redirect URIs.
4. Save the Google client ID and client secret in Supabase and enable the provider.
5. For public sign-in, complete the relevant audience/publishing settings; branding verification may take several business days.

[Official Google provider instructions](https://supabase.com/docs/guides/auth/social-login/auth-google).

**GitHub**
1. Open GitHub Settings → Developer settings → OAuth Apps → New OAuth App.
2. Enter the society name and website homepage.
3. Set the authorization callback URL to the one shown by Supabase for GitHub.
4. Save the client ID and client secret in Supabase and enable GitHub.

The hosted provider callback normally looks like:
`https://<project-ref>.supabase.co/auth/v1/callback`.

That callback goes to Supabase. It is separate from the application's return URL, which I will implement and configure in Supabase's redirect allow list. [Official GitHub instructions](https://supabase.com/docs/guides/auth/social-login/auth-github), [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

**Email login and verification**
1. Enable email/password authentication and require email confirmation.
2. Configure SMTP host, port, username, password, and sender address/name in Supabase.
3. Verify the sender domain through the email provider's required DNS records.
4. Set the production Site URL and exact approved return URLs, including local development while testing.
5. Customize confirmation and recovery templates with the society branding.
6. Test confirmation, resend, password recovery, expired links, and delivery to real inboxes.

Supabase's default mail service is restricted to project-team addresses and currently limited to two messages per hour. Public signup needs custom SMTP. [Official SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp), [email/password authentication](https://supabase.com/docs/guides/auth/passwords).

## Planned implementation

Preserve the existing appearance and Node application. Use Supabase Auth for Google, GitHub, and email/password sign-in, with server-validated sessions and safe callback destinations. Email verification proves email ownership; it does not approve a society or ambassador application. New social users should receive basic student access after required onboarding, with privileged roles assigned only through trusted administration.

Move application data into Postgres with explicit policies. Expected records include profiles, private applications, administrator-controlled role/status assignments, inquiries, registrations, bookmarks, activity reports, contributions, content drafts/publications/history, audit entries, and media metadata. Preserve CMS revision checks and perform publication atomically. Users must not be able to grant themselves approval or administrator access. [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Use public Storage for public branding/media and private Storage for protected documents. Keep application identity fields and CNIC/B-form details available only to the applicant and authorized administrators.

Back up existing local data and file bytes before migration, map existing account IDs to Supabase identities, and reconcile record counts. The current custom scrypt password format needs a migration strategy; do not assume it can simply be copied into Supabase. A verified password-reset/onboarding flow is the proposed low-complexity option for real accounts. Existing sessions should expire at migration. No migration/reset emails will be sent before you identify which accounts are real and authorize that step.

Correct and standardize the logo and navigation across all public pages, login, admin/member dashboards, responsive widths, and custom-logo settings. Keep the existing page layouts and artwork. Check the production build and authentication/permission boundaries, and report actual browser/device coverage.

## Usage target and next input

The account meter began at 0% and showed 8% of the five-hour window at the final check. This is an account-wide meter, not elapsed hours or a task-specific cost counter. Keep subsequent work focused and monitor it against your 20% target; precise future consumption cannot be guaranteed.

Start by supplying the Supabase project URL/public key, intended website domain/host, sender address/provider, owner email, and confirmed name/logo. Then confirm Google/GitHub/SMTP dashboard configuration and how to handle the existing accounts. Application changes and live integration come after that information, as requested.
