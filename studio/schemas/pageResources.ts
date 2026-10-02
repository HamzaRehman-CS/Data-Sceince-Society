import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageResources',
  title: 'Resources Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Developer Resources & Handbooks',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Page Subtitle / Tagline',
      type: 'text',
      rows: 2,
      initialValue: 'Curated deep learning curricula, interactive simulation notebooks, mathematical cheatsheets, and framework guides.',
    }),
  ],
})
