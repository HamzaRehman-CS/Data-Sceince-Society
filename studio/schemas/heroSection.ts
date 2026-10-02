import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'heroSection',
  title: 'Homepage Hero & Headings',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      title: 'Main Hero Headline',
      type: 'string',
      initialValue: 'Computing The Infinite Future.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheadline',
      title: 'Hero Subtitle / Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Advancing the frontier of deep representation learning, quantum neural structures, and artificial intelligence to resolve complex global challenges.',
    }),
    defineField({
      name: 'primaryCtaText',
      title: 'Primary CTA Button Label',
      type: 'string',
      initialValue: 'Apply For Membership',
    }),
    defineField({
      name: 'primaryCtaLink',
      title: 'Primary CTA Destination URL',
      type: 'string',
      initialValue: 'join.html',
    }),
    defineField({
      name: 'secondaryCtaText',
      title: 'Secondary CTA Button Label',
      type: 'string',
      initialValue: 'Explore About Us',
    }),
    defineField({
      name: 'secondaryCtaLink',
      title: 'Secondary CTA Destination URL',
      type: 'string',
      initialValue: 'about.html',
    }),
  ],
})
