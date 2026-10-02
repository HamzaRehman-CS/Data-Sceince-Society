# Data Science Society

A connected Node.js website with a public site, administrator workspace, and student, society member, and ambassador accounts. No runtime npm dependencies are needed by the server. Node.js 22 or newer is required.

## Start locally

```sh
npm ci
npm start
```

Open `http://localhost:3000`. Use the shared `/login.html` page. The requested initial owner credentials are username **admin**, password **pass** (lowercase). Authentication runs on the server and stores a salted password hash. The public login page has no owner hints. Change the password in **Account & security**; changes survive restarts. Set `DSS_MANUAL_SETUP=1` on an empty installation to use the optional one-time setup flow instead.

Sign in through `/login.html`. Administrators go to `/admin` (society administration) or `/build` (opens the website editor); students, society members, and ambassadors go to `/member-dashboard.html`. These routes share one server and content source. A separate admin domain can be configured when hosting is chosen.

## Source layout

```text
website/pages/       Twelve public templates, including ambassadors and membership
website/scripts/     Public content, animation, banners and editor bridge
website/styles/      Public styling
admin/               Administration shell, page editor and banner manager
accounts/            Sign-in and member dashboard shells
backend.js           Shared API, permissions, storage and route mapping
server.js            Server entry point
tests/               Isolated integration and browser checks
```

Stable browser URLs such as `/app.js` and `/about.html` map to these source folders. The old duplicated root page files are archived in `.private/before-design-refresh`.

## Admin workflow

- **Page editor:** all twelve public pages have stable editable element IDs. Click text, images, links, or sections in the preview; double-click text to type directly. Use “Edit containing link” when you select text inside a link. Hidden elements can be selected from the element list. Add/reorder/remove custom sections, edit page headings and search metadata, and preview at mobile width. The preview connects without waiting for images or icons to load.
- **Publish on apply:** enabled by default. Applying page, banner or content-library changes saves and publishes them immediately. Turn it off to prepare a draft. Brand/settings inputs remain in the draft until you explicitly publish.
- **Banners:** create, edit, hide/show and delete small announcements. Choose a top strip or floating card, color, message, link, target pages and optional start/end time. Schedules use the administrator browser’s local timezone. Visitors can dismiss a banner for their session; changing its content makes it visible again.
- **Content library:** create, edit, reorder and delete research, projects, events, resources, blog entries, team profiles and statistics. Navigation entries control the menu. Announcements appear in member dashboards; set their audience to `all`, `student`, or `ambassador`.
- **Brand & settings:** edit the home page, branding, logo, social URLs, contact details, colors, background animation, custom CSS, and portal introductory copy. Page-level element edits override the corresponding general settings; reset an element to return to its general setting.
- **Media library:** upload images and documents (up to 10 MB). Image and document fields also include direct upload and existing-media pickers. Upload a replacement PDF directly in an article or resource record, or a replacement image in the page editor. Brand settings include an optional home hero image. For private documents, turn off public access and attach them to a record with “Requires auth” enabled. Any published private reference keeps the file protected even if another reference is public.
- **Members & approvals:** inspect application details; approve, reject, suspend or change a student/member/ambassador role. The review note is visible to the member. Generate an expiring, single-use password reset link when requested by a member and share it privately yourself. The application does not send that link by email.
- **Ambassador reports:** review campus activities and return feedback. Approved activity counts and attendee totals are computed from actual reports.
- **Contact inbox:** read complete messages and mark them resolved. Event registrations, including registrant names/emails, appear on Overview.
- **Save draft** persists work without changing the public website. **Publish changes** updates visitors through a server event stream. Concurrent draft changes return a conflict instead of silently overwriting another editor.
- **History & backup:** export/import content and restore any of the last 20 previous publications into a draft. Review and publish a restored draft to make it live.

Page editing changes content and visibility. Application logic, authentication, and arbitrary new page templates remain code changes.

## Member experience

Students can create an immediately active account on Join, or choose a society membership application that waits for review. The dedicated `/ambassador.html` programme page accepts new applicants and existing students. Existing students keep their student access while their ambassador application is reviewed. Ambassador applications collect university, student ID, programme, Pakistani phone number, city, province, semester, CNIC/B-form, time commitment, campus plan, and review consent. Identity data is available only to the applicant and authenticated administrators. Pending/rejected/suspended accounts see their status, feedback, profile controls and a link to contact the team. They cannot use protected downloads or register for events.

Approved students can register/cancel event attendance, save/remove resources, search the resource library, and update their profile/password. Approved ambassadors also submit activity reports with a date, description, attendance and optional evidence URL. Their dashboard shows review status and administrator feedback.

Use the event `startDate` field (`YYYY-MM-DD`) to close registrations for past events. The existing display dates are retained as supplied; replace sample dates with real schedules before launch.

## Data and deployment

Runtime data lives in `.private/database.json`, and uploaded files in `.private/uploads`. Writes are serialized and saved atomically. Passwords use salted scrypt hashes; sessions use HttpOnly, SameSite cookies and are checked by the server on protected operations. Back up the **whole `.private` directory** while the server is stopped. The content JSON export does not include accounts or uploaded file bytes.

The previous `sanity-data.json` is an initial content seed. After the first persisted operation, edit content through the admin workspace. Design migrations replace only untouched sample copy, preserving custom content and accounts. The old Sanity project had a placeholder project ID; its schemas remain in `studio` for reference. `studio/server.js` now redirects to the main admin portal and cannot write content independently. Original root files were preserved under `.private/original-source` during this upgrade. Supabase and external authentication integration are deferred as requested; the current local server keeps the website and admin connected.

```sh
npm run build
node dist/server.js
```

The `dist` output is also a **Node server application**, not a static-only deployment. Choose either the root server or the dist server, and point it at one persistent `DSS_DATA_DIR`; do not run both against the same database. This storage implementation is intended for a single server process, not multiple replicas.

Production environment:

| Variable | Purpose |
| --- | --- |
| `PORT` | Listening port (default 3000) |
| `HOST` | Listening interface (default 127.0.0.1; use 0.0.0.0 when required by the host) |
| `DSS_DATA_DIR` | Absolute path on a persistent disk for accounts/content/uploads |
| `PUBLIC_ORIGIN` | Exact public origin, e.g. `https://society.example`, used for request-origin checks |
| `NODE_ENV=production` | Enables Secure session cookies; serve behind HTTPS |

Public deployment and email delivery have not been configured. A hosting account/domain and any desired email provider must be supplied for that work. Contact forms and applications are stored in the admin portal; they do not claim that an email was sent.

The supplied PDFs and ZIPs are placeholder assets, and the sample statistics, people, event schedules and external URLs are not verified society records. Replace them before public launch. The original uploads were preserved.

## Verification

```sh
npm test
npm run test:browser
npm run test:design
npm run test:identity
npm run test:members
npm run test:experience
npm run check:studio
```

The integration suite uses an isolated temporary database. It verifies authentication, role boundaries, origin checks, draft/public separation, conflicts, publishing, rollback, file access, contact storage, registrations, bookmarks, ambassador reviews, password changes and persistence across restart. Browser checks use installed Google Chrome and exercise real forms, page editing/publishing, all public pages and mobile layouts. Screenshots are written to `.private/qa`.

Performance changes: precompiled local Tailwind CSS, local pinned icons, native scrolling, reduced backdrop effects, batched card rendering, lazy images, gzip/ETag static responses, and event-driven content updates in place of one-second polling. The homepage data surface is a bounded 2D canvas with Waves, Clusters, and Signals modes. It runs at at most 30 frames per second, caps device pixel ratio at 1.5, and stops offscreen, in hidden tabs, when paused, and under reduced-motion preferences. It uses no animation library. The member resource library is searchable and rendered in small batches.

The design regression suite checks the editor with a deliberately stalled icon script, headings with line breaks, link labels/URLs, inline editing, cross-page drafts, live publication to another browser, banner CRUD, reduced motion, team filtering, and phone/tablet layouts.

## September 2026 blue-and-white redesign

All 11 public pages have distinct layouts using white, vivid blue, a crisp vector mark, and locally hosted Inter variable type (48 KB). The homepage includes an interactive data surface; resources use a book composition; research has expandable abstracts; events use calendar rows; the journal uses a magazine layout. The About page combines a large society mark, a concise values section, Urdu copy, and filterable team profiles. Repetitive stars, coordinates, decorative index labels, and link arrows were removed.

The shared login routes accounts to separate student, society member, ambassador, and administrator experiences. Student accounts are active immediately. New member and ambassador accounts await review. Existing students can apply for membership or an ambassador role while retaining access. Members receive an opportunity board and can submit contributions. Ambassadors receive campus reporting tools. Admins publish opportunities from Content library and review work in Contributions. Role decisions, content publication, and report feedback reach open dashboards over the server event stream. Open forms are preserved while updates wait.

Brand settings control primary/highlight colours, background, cards, text, feature panels, borders, fonts, logo, hero image, copy, and links. The page editor supports text, links, images, visibility, custom sections, and search metadata; the content library manages the associated collections. Application logic and new templates remain code changes. The v4 migration applies the requested blue theme once and preserves accounts and customised copy. Further brand changes remain persistent.

The member test verifies student-to-member applications, live approval, distinct navigation, private opportunities, contribution review, mobile layout, and motion controls. Other suites cover admin page editing and live publication, PDF uploads and download permissions, shared login, ambassador workflows, data privacy, and all 11 public pages at 320, 390, and 768 pixels.

Design references consulted for composition and motion principles: [Awwwards blue websites](https://www.awwwards.com/websites/blue/), [Dribbble Eduluxe school branding](https://dribbble.com/shots/24454441-Eduluxe-school-Branding-CONCEPT), and [Motion scroll guidance](https://motion.dev/docs/scroll). Implementation and artwork are original code; no third-party template is used.

## October 2026 page experiences

Every public page has its own native CSS/SVG artwork: the About ribbon, project build flow, research lens, event invitations, resource books, journal sheet, community circles, joining steps, ambassador campus network, membership building blocks, contact envelope, and the existing homepage data surface. Visitors can pause motion; that preference follows them between pages and includes the homepage canvas. Artwork pauses offscreen, in hidden tabs, and in editor previews. Device reduced-motion preferences and the administrator's decorative-motion setting apply throughout. Section and card reveals run once as they enter view, while content remains visible without JavaScript.

About now includes society details, separately grouped leadership and team profiles, and a dedicated student ambassador section. Public ambassador profiles are added through **Content library → Team → Profile group → Ambassador**. They are separate from private account/application data; no applicant details are published automatically. Community includes distinct student, member, and ambassador pathways plus editable community guidelines. The ambassador page explains responsibilities before its application form.

`/opportunities.html` is now a working membership overview and application page. Its opportunity board reads the same published records as the member dashboard. Only approved members, ambassadors, and administrators receive those records; other visitors see an access prompt and can apply for membership.

The shared motion CSS and JavaScript are about 7 KB compressed. `scripts/build-icons.cjs` selects the Lucide icons referenced by the public source, keeping the local icon bundle under 8 KB before compression. The build regenerates it automatically. `npm run test:experience` checks all twelve pages at four viewport widths, motion preferences, static content, CMS profile/section publication, opportunity privacy, icon rendering, and the shared motion size budget. Visual QA screenshots and local timing measurements are saved in `.private/qa-experience`; these timings are local observations rather than production speed guarantees.
