import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'missionVision',
  title: 'Homepage Pillars (Mission, Vision & Values)',
  type: 'document',
  fields: [
    defineField({
      name: 'pillar1Title',
      title: 'Pillar 1 Title',
      type: 'string',
      initialValue: 'Academic Synergy',
    }),
    defineField({
      name: 'pillar1Text',
      title: 'Pillar 1 Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Bridging academia and enterprise, DSS coordinates computing infrastructure to accelerate foundational AI modeling.',
    }),
    defineField({
      name: 'pillar2Title',
      title: 'Pillar 2 Title',
      type: 'string',
      initialValue: 'Decentralized AI',
    }),
    defineField({
      name: 'pillar2Text',
      title: 'Pillar 2 Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Structuring open science research blocks that offer decentralized datasets and high-performance tensor computing pipelines.',
    }),
    defineField({
      name: 'pillar3Title',
      title: 'Pillar 3 Title',
      type: 'string',
      initialValue: 'Open Access',
    }),
    defineField({
      name: 'pillar3Text',
      title: 'Pillar 3 Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Providing royalty-free models, preprints, and open source gym environments to support developers worldwide.',
    }),
  ],
})
