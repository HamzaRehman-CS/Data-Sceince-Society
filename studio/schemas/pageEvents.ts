import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageEvents',
  title: 'Events Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Conferences & Hackathons',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Page Subtitle / Tagline',
      type: 'text',
      rows: 2,
      initialValue: 'Join our international community at symposiums, workshops, and competitive hackathons around the globe.',
    }),
    defineField({
      name: 'hostEventHeading',
      title: 'Host an Event Banner Heading',
      type: 'string',
      initialValue: 'Host a Local DSS Workshop',
    }),
    defineField({
      name: 'hostEventText',
      title: 'Host an Event Description',
      type: 'text',
      rows: 2,
      initialValue: 'Interested in hosting a Data Science Society workshop, meetup, or university hackathon on your campus? Connect with our team.',
    }),
    defineField({
      name: 'hostEventBtnText',
      title: 'Host Button Label',
      type: 'string',
      initialValue: 'Partner With Us',
    }),
    defineField({
      name: 'hostEventBtnLink',
      title: 'Host Button Link',
      type: 'string',
      initialValue: 'contact.html',
    }),
  ],
})
