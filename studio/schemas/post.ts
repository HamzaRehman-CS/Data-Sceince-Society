import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Articles',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Article Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug / URL Key',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'tag',
      title: 'Category / Tag',
      type: 'string',
      description: 'e.g., DEEP LEARNING, QUANTUM COMPUTING, ROBOTICS, AI ETHICS',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Display Date',
      type: 'string',
      initialValue: 'JUL 2026',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short Excerpt / Abstract',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imageUrl',
      title: 'Cover Image URL',
      type: 'url',
      description: 'Direct image URL or Unsplash link',
    }),
    defineField({
      name: 'mainImage',
      title: 'Upload Cover Image (Optional)',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'content',
      title: 'Full Article Body',
      type: 'text',
      rows: 8,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author',
      tag: 'tag',
    },
    prepare(selection) {
      const { author, tag } = selection
      return {
        ...selection,
        subtitle: `${tag ? `[${tag}] ` : ''}${author ? `by ${author}` : ''}`,
      }
    },
  },
})
