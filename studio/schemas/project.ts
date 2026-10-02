import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Open Science Projects',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title / Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Project Type / Category',
      type: 'string',
      initialValue: 'Core Library',
      description: 'e.g. Core Library, Simulation, Research Utility, Distributed Inference',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'desc',
      title: 'Project Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lang',
      title: 'Primary Programming Language / Framework',
      type: 'string',
      initialValue: 'Python',
    }),
    defineField({
      name: 'stars',
      title: 'Star Count Metric',
      type: 'string',
      initialValue: '1.4k',
    }),
    defineField({
      name: 'forks',
      title: 'Fork Count Metric',
      type: 'string',
      initialValue: '280',
    }),
    defineField({
      name: 'repoUrl',
      title: 'GitHub Repository URL',
      type: 'string',
      initialValue: '#',
    }),
    defineField({
      name: 'demoUrl',
      title: 'Live Demo URL',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      lang: 'lang',
      stars: 'stars',
    },
    prepare({ title, type, lang, stars }) {
      return {
        title,
        subtitle: `${type} • ${lang} • ⭐ ${stars}`,
      }
    },
  },
})
