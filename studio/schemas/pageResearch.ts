import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageResearch',
  title: 'Research Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Academic Research & Preprints',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Page Subtitle / Tagline',
      type: 'text',
      rows: 2,
      initialValue: 'Peer-reviewed publications, open-access preprints, and algorithmic formalisms authored by DSS fellows.',
    }),
    defineField({
      name: 'calloutHeading',
      title: 'Callout Banner Heading',
      type: 'string',
      initialValue: 'Submit A Preprint',
    }),
    defineField({
      name: 'calloutText',
      title: 'Callout Banner Description',
      type: 'text',
      rows: 2,
      initialValue: 'Are you working on novel transformer architectures, quantum circuits, or robotics? Submit your work for peer review.',
    }),
    defineField({
      name: 'calloutBtnText',
      title: 'Callout Button Label',
      type: 'string',
      initialValue: 'Submit Research',
    }),
    defineField({
      name: 'calloutBtnLink',
      title: 'Callout Button Link',
      type: 'string',
      initialValue: 'contact.html',
    }),
  ],
})
