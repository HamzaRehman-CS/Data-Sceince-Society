import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'dss-cms-portal',
    dataset: 'production'
  }
})
