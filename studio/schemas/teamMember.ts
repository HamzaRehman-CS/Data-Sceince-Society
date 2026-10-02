import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'teamMember',
  title: 'Team & Leadership Members',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Member Tier / Category',
      type: 'string',
      options: {
        list: [
          { title: 'Executive Board', value: 'executive' },
          { title: 'Functional Director', value: 'director' },
          { title: 'Subteam Crew', value: 'subteam' },
          { title: 'Student Ambassador', value: 'ambassador' },
        ],
        layout: 'radio',
      },
      initialValue: 'executive',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Official Role / Title',
      type: 'string',
      initialValue: 'PRESIDENT',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'funnyRole',
      title: 'Funny Role / Humorous Tag',
      type: 'string',
      initialValue: 'The Big Boss & Chai Lover',
      description: 'Humorous subtitle displayed on hover card',
    }),
    defineField({
      name: 'badge',
      title: 'Badge Tagline',
      type: 'string',
      initialValue: 'ALWAYS DRINKING CHAI',
      description: 'Uppercase badge tag',
    }),
    defineField({
      name: 'bio',
      title: 'Bio Description',
      type: 'text',
      rows: 3,
      initialValue:
        'The Big Boss. Spends 90% of his time drinking chai and 10% telling others to do his work.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imageUrl',
      title: 'Avatar Image URL (Unsplash or Direct Link)',
      type: 'url',
      initialValue: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    }),
    defineField({
      name: 'image',
      title: 'Upload Avatar Photo (Optional)',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order Priority (Lower = First)',
      type: 'number',
      initialValue: 1,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      role: 'role',
      category: 'category',
    },
    prepare({ title, role, category }) {
      return {
        title,
        subtitle: `[${category?.toUpperCase()}] ${role}`,
      }
    },
  },
})
