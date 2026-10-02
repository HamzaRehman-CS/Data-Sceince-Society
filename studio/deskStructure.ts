import type { StructureResolver } from 'sanity/structure'

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Data Science Society Admin Control Center')
    .items([
      S.listItem()
        .title('🎨 Theme & Typography')
        .child(
          S.document()
            .schemaType('themeSettings')
            .documentId('themeSettings')
            .title('Theme Colors, Fonts & Visuals')
        ),

      S.listItem()
        .title('⚙️ Global Branding & Header/Footer')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Branding, Navigation & Social Links')
        ),

      S.listItem()
        .title('📢 Announcement Banners & Alerts')
        .child(
          S.document()
            .schemaType('bannerSettings')
            .documentId('bannerSettings')
            .title('Floating & Flowing Announcement Banners')
        ),

      S.divider(),

      S.listItem()
        .title('🏠 Homepage Sections')
        .child(
          S.list()
            .title('Homepage Controls')
            .items([
              S.listItem()
                .title('Hero Headline, Subtitle & CTAs')
                .child(
                  S.document()
                    .schemaType('heroSection')
                    .documentId('heroSection')
                    .title('Hero Section')
                ),
              S.listItem()
                .title('Mission, Vision & Value Pillars')
                .child(
                  S.document()
                    .schemaType('missionVision')
                    .documentId('missionVision')
                    .title('Core Pillars')
                ),
              S.listItem()
                .title('Key Statistics & Numbers')
                .child(S.documentTypeList('stat').title('Statistics Metrics')),
              S.listItem()
                .title('Sponsored Ad & Campaign Banner')
                .child(
                  S.document()
                    .schemaType('advertisement')
                    .documentId('advertisement')
                    .title('Advertisement Banner')
                ),
            ])
        ),

      S.listItem()
        .title('📄 Page Content & Headings')
        .child(
          S.list()
            .title('All Page Content Editors')
            .items([
              S.listItem()
                .title('About Us Page')
                .child(
                  S.document()
                    .schemaType('pageAbout')
                    .documentId('pageAbout')
                    .title('About Us Content & Story')
                ),
              S.listItem()
                .title('Research Page')
                .child(
                  S.document()
                    .schemaType('pageResearch')
                    .documentId('pageResearch')
                    .title('Research Page Headings & Preprints CTA')
                ),
              S.listItem()
                .title('Projects Page')
                .child(
                  S.document()
                    .schemaType('pageProjects')
                    .documentId('pageProjects')
                    .title('Projects Page Headings & Repos')
                ),
              S.listItem()
                .title('Blog Page')
                .child(
                  S.document()
                    .schemaType('pageBlog')
                    .documentId('pageBlog')
                    .title('Blog Page Headings & Newsletter')
                ),
              S.listItem()
                .title('Events Page')
                .child(
                  S.document()
                    .schemaType('pageEvents')
                    .documentId('pageEvents')
                    .title('Events Page Headings & Host CTA')
                ),
              S.listItem()
                .title('Resources Page')
                .child(
                  S.document()
                    .schemaType('pageResources')
                    .documentId('pageResources')
                    .title('Resources Page Headings & Guides')
                ),
              S.listItem()
                .title('Opportunities / Join Page')
                .child(
                  S.document()
                    .schemaType('pageJoin')
                    .documentId('pageJoin')
                    .title('Opportunities Content & Fellowship')
                ),
              S.listItem()
                .title('Contact Page')
                .child(
                  S.document()
                    .schemaType('pageContact')
                    .documentId('pageContact')
                    .title('Contact Information & Headings')
                ),
              S.listItem()
                .title('Community Protocols & Governance')
                .child(
                  S.document()
                    .schemaType('pageCommunity')
                    .documentId('pageCommunity')
                    .title('Community Protocols')
                ),
            ])
        ),

      S.divider(),

      S.listItem()
        .title('📰 Articles & Publications')
        .child(
          S.list()
            .title('Articles & Preprints')
            .items([
              S.listItem()
                .title('Blog Articles & Dispatches')
                .child(S.documentTypeList('post').title('All Blog Posts')),
              S.listItem()
                .title('Research Preprints & Papers')
                .child(S.documentTypeList('researchPaper').title('All Research Papers')),
            ])
        ),

      S.listItem()
        .title('👥 People & Events')
        .child(
          S.list()
            .title('People & Activities')
            .items([
              S.listItem()
                .title('Team & Leadership Directory')
                .child(S.documentTypeList('teamMember').title('Team Members')),
              S.listItem()
                .title('Events & Hackathons')
                .child(S.documentTypeList('event').title('All Events')),
            ])
        ),

      S.listItem()
        .title('💻 Projects & Resources')
        .child(
          S.list()
            .title('Projects & Knowledgebase')
            .items([
              S.listItem()
                .title('Open Science Projects')
                .child(S.documentTypeList('project').title('All Projects')),
              S.listItem()
                .title('Learning Resources & Codebooks')
                .child(S.documentTypeList('resource').title('All Resources')),
            ])
        ),

      S.divider(),

      S.listItem()
        .title('📥 Inquiries & Submissions')
        .child(S.documentTypeList('inquiry').title('Submissions & Contact Messages')),
    ])
