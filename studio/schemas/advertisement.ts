import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'advertisement',
  title: 'Sponsored Ad & Campaign Banners',
  type: 'document',
  fields: [
    defineField({
      name: 'active',
      title: 'Enable Banner Display On Site',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'headline',
      title: 'Banner Headline',
      type: 'string',
      initialValue: 'Special Sponsor Announcement',
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      initialValue: 'Accelerate your compute workloads with next-gen cloud TPU credits.',
    }),
    defineField({
      name: 'sponsorName',
      title: 'Sponsor / Partner Name',
      type: 'string',
      initialValue: 'Cloud TPU Partner',
    }),
    defineField({
      name: 'buttonText',
      title: 'Action Button Text',
      type: 'string',
      initialValue: 'Learn More',
    }),
    defineField({
      name: 'buttonUrl',
      title: 'Action Button URL',
      type: 'string',
      initialValue: 'https://datasciencesociety.org',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Sponsor Banner Image URL',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      subtitle: 'sponsorName',
      active: 'active',
    },
    prepare({ title, subtitle, active }) {
      return {
        title,
        subtitle: `${active ? '🟢 LIVE' : '⚪ DRAFT'} | Sponsor: ${subtitle || 'None'}`,
      }
    },
  },
})
