import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { colorInput } from '@sanity/color-input'
import { schemaTypes } from './schemas'
import { deskStructure } from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'Data Science Society Studio',

  projectId: 'dss-cms-portal',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    visionTool(),
    colorInput(),
  ],

  schema: {
    types: schemaTypes,
  },
})
