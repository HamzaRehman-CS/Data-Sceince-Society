import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'researchPaper',
  title: 'Research Preprints & Papers',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Paper Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'authors',
      title: 'Authors List',
      type: 'string',
      description: 'e.g. H. Rehman, A. Vance, L. Chen',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'journal',
      title: 'Journal / Conference & Citation Info',
      type: 'string',
      initialValue: 'Journal of Neural Systems, Vol. 14, 2026',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      initialValue: '2026',
    }),
    defineField({
      name: 'excerpt',
      title: 'Abstract / Key Findings',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'Paper URL / DOI Link',
      type: 'string',
      initialValue: '#',
    }),
    defineField({
      name: 'pdfFile',
      title: 'Upload Preprint PDF (Optional)',
      type: 'file',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Paper on Research Page',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      authors: 'authors',
      journal: 'journal',
    },
    prepare({ title, authors, journal }) {
      return {
        title,
        subtitle: `${authors} | ${journal}`,
      }
    },
  },
})
