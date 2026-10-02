import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings & Branding',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      initialValue: 'Data Science Society',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline / Slogan',
      type: 'string',
      initialValue: 'Computing The Infinite Future',
    }),
    defineField({
      name: 'metaDescription',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Data Science Society - Advancing deep learning, quantum neural networks, and open science computing.',
    }),
    defineField({
      name: 'logoText',
      title: 'Logo Text',
      type: 'string',
      initialValue: 'Data Science Society',
    }),
    defineField({
      name: 'logoImage',
      title: 'Brand Logo Image (Optional)',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'bannerActive',
      title: 'Display Top Announcement Banner',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'bannerText',
      title: 'Announcement Banner Message',
      type: 'string',
      initialValue: '🚀 DSS Annual Symposium 2026 Registration Now Open!',
      hidden: ({ parent }) => !parent?.bannerActive,
    }),
    defineField({
      name: 'bannerLink',
      title: 'Banner Target URL',
      type: 'string',
      initialValue: 'events.html',
      hidden: ({ parent }) => !parent?.bannerActive,
    }),
    defineField({
      name: 'headerNavLinks',
      title: 'Header Navigation Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'url', title: 'URL / Path', type: 'string' },
            { name: 'highlight', title: 'Highlight Style (Button)', type: 'boolean', initialValue: false },
          ],
        },
      ],
      initialValue: [
        { label: 'Home', url: 'index.html', highlight: false },
        { label: 'About Us', url: 'about.html', highlight: false },
        { label: 'Research', url: 'research.html', highlight: false },
        { label: 'Projects', url: 'projects.html', highlight: false },
        { label: 'Blog', url: 'blog.html', highlight: false },
        { label: 'Events', url: 'events.html', highlight: false },
        { label: 'Resources', url: 'resources.html', highlight: false },
        { label: 'Opportunities', url: 'join.html', highlight: true },
        { label: 'Contact', url: 'contact.html', highlight: false },
      ],
    }),
    defineField({
      name: 'footerCopyright',
      title: 'Footer Copyright Notice',
      type: 'string',
      initialValue: '© 2026 Data Science Society. All Rights Reserved.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social & Community Links',
      type: 'object',
      fields: [
        { name: 'github', title: 'GitHub URL', type: 'url', initialValue: 'https://github.com' },
        { name: 'twitter', title: 'X (Twitter) URL', type: 'url', initialValue: 'https://twitter.com' },
        { name: 'linkedin', title: 'LinkedIn URL', type: 'url', initialValue: 'https://linkedin.com' },
        { name: 'discord', title: 'Discord Server URL', type: 'url', initialValue: 'https://discord.com' },
        { name: 'youtube', title: 'YouTube Channel URL', type: 'url' },
      ],
    }),
    defineField({
      name: 'contactEmail',
      title: 'Official Contact Email',
      type: 'string',
      initialValue: 'contact@datasciencesociety.org',
    }),
    defineField({
      name: 'headquarters',
      title: 'Headquarters / Location Text',
      type: 'string',
      initialValue: 'Geneva & Global Virtual Network',
    }),
  ],
})
