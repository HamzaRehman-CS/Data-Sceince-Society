import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'stat',
  title: 'Key Metrics & Statistics',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Metric Label / Name',
      type: 'string',
      initialValue: 'Global Members',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Metric Value (e.g. 12k+, 45+, 120+)',
      type: 'string',
      initialValue: '12k+',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 1,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'value',
    },
  },
})
