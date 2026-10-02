import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'resource',
  title: 'Learning & Computational Resources',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Resource Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Resource Type',
      type: 'string',
      initialValue: 'Core Documentation',
      description: 'e.g. Core Documentation, Research Codebook, Framework Repository, Dataset',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'desc',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'length',
      title: 'Length / Size Format',
      type: 'string',
      initialValue: '120 pages',
      description: 'e.g. 120 pages, 8 notebooks, 4.2k lines, 5.4 GB',
    }),
    defineField({
      name: 'downloadUrl',
      title: 'Download / Access URL',
      type: 'string',
      initialValue: '#',
    }),
    defineField({
      name: 'fileAttachment',
      title: 'Upload File Asset (Optional)',
      type: 'file',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      length: 'length',
    },
    prepare({ title, type, length }) {
      return {
        title,
        subtitle: `${type} • ${length || ''}`,
      }
    },
  },
})
