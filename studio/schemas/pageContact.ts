import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageContact',
  title: 'Contact Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Contact Page Title',
      type: 'string',
      initialValue: 'Connect With Our Global Team',
    }),
    defineField({
      name: 'introText',
      title: 'Introductory Message',
      type: 'text',
      rows: 3,
      initialValue:
        'Have a research proposal, sponsorship inquiry, or want to invite DSS for a keynote? Drop us a dispatch below.',
    }),
    defineField({
      name: 'email',
      title: 'Contact Email Address',
      type: 'string',
      initialValue: 'contact@datasciencesociety.org',
    }),
    defineField({
      name: 'officeHours',
      title: 'Virtual Office Hours / Response Time',
      type: 'string',
      initialValue: 'Mon - Fri, 09:00 - 18:00 UTC (Average response time < 24 hours)',
    }),
    defineField({
      name: 'address',
      title: 'Postal Address / Research Center',
      type: 'string',
      initialValue: 'DSS Open Science Foundation, Geneva Innovation Hub, Switzerland',
    }),
  ],
})
