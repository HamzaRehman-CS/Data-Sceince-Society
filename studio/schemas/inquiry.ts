import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'inquiry',
  title: 'Inquiries & Submissions',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      readOnly: false,
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
    }),
    defineField({
      name: 'type',
      title: 'Submission Category',
      type: 'string',
      options: {
        list: [
          { title: 'Contact Inquiry', value: 'contact' },
          { title: 'Membership Application', value: 'membership' },
          { title: 'Research Collaboration', value: 'research' },
          { title: 'Event RSVP', value: 'event' },
        ],
      },
      initialValue: 'contact',
    }),
    defineField({
      name: 'subject',
      title: 'Subject / Role Applied For',
      type: 'string',
    }),
    defineField({
      name: 'message',
      title: 'Message / Cover Note',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Date Submitted',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'status',
      title: 'Review Status',
      type: 'string',
      options: {
        list: [
          { title: 'New / Unread', value: 'new' },
          { title: 'Under Review', value: 'reviewing' },
          { title: 'Approved / Contacted', value: 'approved' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      initialValue: 'new',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'subject',
      status: 'status',
    },
    prepare({ title, subtitle, status }) {
      return {
        title: title || 'Anonymous Submission',
        subtitle: `[${status?.toUpperCase() || 'NEW'}] ${subtitle || 'No Subject'}`,
      }
    },
  },
})
