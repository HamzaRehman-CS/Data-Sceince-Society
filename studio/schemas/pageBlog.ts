import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageBlog',
  title: 'Blog Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Society Insights & Articles',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Page Subtitle / Tagline',
      type: 'text',
      rows: 2,
      initialValue: 'Read regular technical dispatches, system reviews, and algorithmic breakdowns authored by our research fellows.',
    }),
    defineField({
      name: 'newsletterHeading',
      title: 'Newsletter Heading',
      type: 'string',
      initialValue: 'Subscribe to our Research Dispatch',
    }),
    defineField({
      name: 'newsletterText',
      title: 'Newsletter Description',
      type: 'text',
      rows: 2,
      initialValue: 'Get quarterly deep-dive research summaries, code repository releases, and conference invites directly to your inbox.',
    }),
  ],
})
