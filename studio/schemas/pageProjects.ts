import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageProjects',
  title: 'Projects Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Open Source Software & Tools',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Page Subtitle / Tagline',
      type: 'text',
      rows: 2,
      initialValue: 'Explore our open source machine learning repositories, computational gym environments, and deep learning core libraries.',
    }),
    defineField({
      name: 'githubOrgUrl',
      title: 'GitHub Organization URL',
      type: 'url',
      initialValue: 'https://github.com/datasciencesociety',
    }),
  ],
})
