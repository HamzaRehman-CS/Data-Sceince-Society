import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageAbout',
  title: 'About Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Pioneering The Frontiers of Machine Intelligence',
    }),
    defineField({
      name: 'introText',
      title: 'Introduction Paragraph',
      type: 'text',
      rows: 4,
      initialValue:
        'Founded in 2024, the Data Science Society brings together researchers, engineers, and curious minds to build decentralized, open-source AI infrastructure.',
    }),
    defineField({
      name: 'storyHeadline',
      title: 'Our Story Headline',
      type: 'string',
      initialValue: 'From Campus Roots to Global Neural Synergy',
    }),
    defineField({
      name: 'storyBody',
      title: 'Our Story Body',
      type: 'text',
      rows: 6,
      initialValue:
        'What started as an ambitious reading group dissecting the original Transformer papers quickly expanded into a worldwide open compute consortium.',
    }),
    defineField({
      name: 'valuesHeadline',
      title: 'Values Headline',
      type: 'string',
      initialValue: 'Principled Innovation & Open Scientific Truth',
    }),
  ],
})
