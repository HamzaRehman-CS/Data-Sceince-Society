import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'themeSettings',
  title: 'Theme & Color Palette',
  type: 'document',
  fields: [
    defineField({
      name: 'themeModeDefault',
      title: 'Default Theme Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Dark Mode (Default)', value: 'dark' },
          { title: 'Light Mode', value: 'light' },
          { title: 'System Preference', value: 'system' },
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
    }),
    defineField({
      name: 'accentColor',
      title: 'Primary Accent Color (Hex / Color Picker)',
      type: 'color',
      description: 'Used for primary buttons, highlighted badges, links, and glow effects',
    }),
    defineField({
      name: 'accentColorHex',
      title: 'Primary Accent Hex Fallback',
      type: 'string',
      initialValue: '#0284c7',
      description: 'Default: #0284c7 (Sky Blue)',
    }),
    defineField({
      name: 'accentColorLightHex',
      title: 'Light Accent Hex (Hover states & Highlights)',
      type: 'string',
      initialValue: '#38bdf8',
    }),
    defineField({
      name: 'darkBackgroundHex',
      title: 'Obsidian Dark Background Color',
      type: 'string',
      initialValue: '#030712',
      description: 'Deep background color for dark mode (Default: #030712)',
    }),
    defineField({
      name: 'navySurfaceHex',
      title: 'Midnight Navy Surface Color',
      type: 'string',
      initialValue: '#0f172a',
      description: 'Card & modal container surface color (Default: #0f172a)',
    }),
    defineField({
      name: 'successAccentHex',
      title: 'Success / Login Accent Color',
      type: 'string',
      initialValue: '#10b981',
      description: 'Emerald green color for login badges, status indicators (Default: #10b981)',
    }),
    defineField({
      name: 'headingFontFamily',
      title: 'Headings Font Family',
      type: 'string',
      options: {
        list: [
          { title: 'Outfit (Modern Display)', value: 'Outfit, sans-serif' },
          { title: 'Space Grotesk (Tech / Brutalist)', value: 'Space Grotesk, sans-serif' },
          { title: 'Inter (Clean Swiss)', value: 'Inter, sans-serif' },
          { title: 'Plus Jakarta Sans (Geometric)', value: 'Plus Jakarta Sans, sans-serif' },
        ],
      },
      initialValue: 'Outfit, sans-serif',
    }),
    defineField({
      name: 'bodyFontFamily',
      title: 'Body Font Family',
      type: 'string',
      options: {
        list: [
          { title: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans, sans-serif' },
          { title: 'Inter', value: 'Inter, sans-serif' },
          { title: 'Roboto', value: 'Roboto, sans-serif' },
        ],
      },
      initialValue: 'Plus Jakarta Sans, sans-serif',
    }),
    defineField({
      name: 'glassmorphismIntensity',
      title: 'Glassmorphism Intensity',
      type: 'string',
      options: {
        list: [
          { title: 'Subtle Blur (8px)', value: 'blur(8px)' },
          { title: 'Medium Frosted Glass (16px) - Recommended', value: 'blur(16px)' },
          { title: 'Ultra Frosted (24px)', value: 'blur(24px)' },
        ],
      },
      initialValue: 'blur(16px)',
    }),
    defineField({
      name: 'enable3dCanvas',
      title: 'Enable 3D WebGL Infinity Canvas in Background',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'canvasOpacity',
      title: '3D Background Canvas Opacity (0.0 to 1.0)',
      type: 'number',
      initialValue: 0.75,
      validation: (Rule) => Rule.min(0).max(1),
    }),
    defineField({
      name: 'customCss',
      title: 'Custom CSS Overrides (Advanced)',
      type: 'text',
      rows: 4,
      description: 'Inject direct CSS rules to customize any visual element across all pages.',
    }),
  ],
})
