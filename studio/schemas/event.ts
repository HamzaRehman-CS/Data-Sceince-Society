import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'event',
  title: 'Events & Workshops',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Event Date / Schedule Text',
      type: 'string',
      initialValue: 'July 24, 2026',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          { title: 'Workshop', value: 'Workshop' },
          { title: 'Hackathon', value: 'Hackathon' },
          { title: 'Conference / Symposium', value: 'Conference' },
          { title: 'Webinar', value: 'Webinar' },
          { title: 'Meetup', value: 'Meetup' },
        ],
      },
      initialValue: 'Workshop',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'loc',
      title: 'Location / Venue',
      type: 'string',
      initialValue: 'Virtual / Gather.town',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'desc',
      title: 'Event Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'registrationLink',
      title: 'Registration / RSVP Link',
      type: 'string',
      initialValue: 'join.html',
    }),
    defineField({
      name: 'status',
      title: 'Event Status',
      type: 'string',
      options: {
        list: [
          { title: 'Upcoming (Registration Open)', value: 'upcoming' },
          { title: 'Ongoing / In-Progress', value: 'ongoing' },
          { title: 'Completed / Past Archive', value: 'completed' },
        ],
      },
      initialValue: 'upcoming',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      type: 'type',
      loc: 'loc',
    },
    prepare({ title, date, type, loc }) {
      return {
        title,
        subtitle: `${type} • ${date} • ${loc}`,
      }
    },
  },
})
