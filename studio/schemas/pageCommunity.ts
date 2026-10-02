import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageCommunity',
  title: 'Community Protocols & Governance',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Community Protocols & Standards',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'protocol1',
      title: 'Protocol 1 (Open Source Licensing)',
      type: 'text',
      rows: 2,
      initialValue: 'DSS forums and repositories welcome open source code contributions under strict Apache 2.0 or MIT licensing terms.',
    }),
    defineField({
      name: 'protocol2',
      title: 'Protocol 2 (Compute Allocation)',
      type: 'text',
      rows: 2,
      initialValue: 'Fellowship requests and compute resource allocation applications are peer-reviewed quarterly by our leadership board.',
    }),
    defineField({
      name: 'protocol3',
      title: 'Protocol 3 (Academic Summits)',
      type: 'text',
      rows: 2,
      initialValue: 'All local university chapters coordinate summits following standard academic safety and validation guidelines.',
    }),
  ],
})
