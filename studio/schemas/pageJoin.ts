import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pageJoin',
  title: 'Opportunities / Join Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Join The Global Neural Network',
    }),
    defineField({
      name: 'introText',
      title: 'Introductory Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Whether you are an undergraduate AI researcher, senior systems engineer, or data visualization artisan, DSS offers a home for your ambitions.',
    }),
    defineField({
      name: 'openTracks',
      title: 'Open Opportunity Tracks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'roleTitle', title: 'Track / Role Title', type: 'string' },
            { name: 'badge', title: 'Badge / Tag', type: 'string' },
            { name: 'description', title: 'Track Description', type: 'text', rows: 2 },
            { name: 'requirements', title: 'Key Qualifications', type: 'string' },
          ],
        },
      ],
      initialValue: [
        {
          roleTitle: 'Core ML Research Fellow',
          badge: 'FELLOWSHIP',
          description: 'Design and train novel state space models and attention kernels on cloud GPU clusters.',
          requirements: 'PyTorch / JAX / Linear Algebra proficiency',
        },
        {
          roleTitle: 'Open Science Web Architect',
          badge: 'ENGINEERING',
          description: 'Build high-performance client dashboards, real-time visualizers, and interactive documentation.',
          requirements: 'TypeScript / Tailwind / WebGL / Three.js',
        },
        {
          roleTitle: 'Executive Operations & Events',
          badge: 'LEADERSHIP',
          description: 'Coordinate global symposiums, partner sponsorships, and hackathon infrastructure.',
          requirements: 'Event planning / Organization / Communication',
        },
      ],
    }),
    defineField({
      name: 'applicationDeadline',
      title: 'Application Deadline Notice',
      type: 'string',
      initialValue: 'Applications reviewed on a rolling basis for Cohort 2026.',
    }),
  ],
})
