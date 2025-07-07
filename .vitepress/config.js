
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "DeepQuasar Docs",
  description: "Documentation for DeepQuasar Discord Bot",
  base: '/DeepQuasar/', // Base path for GitHub Pages
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Features', link: '/features/CHATBOT_MODULE' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Setup Guide', link: '/getting-started/SETUP_GUIDE' },
          { text: 'Features Overview', link: '/getting-started/FEATURES' },
          { text: 'FAQ', link: '/getting-started/FAQ' }
        ]
      },
      {
        text: 'Features',
        items: [
          { text: 'AI Chatbot Module', link: '/features/CHATBOT_MODULE' },
          { text: 'Cleanup System', link: '/features/content-creation/CLEANUP_SYSTEM' },
          { text: 'Embed Builder', link: '/features/content-creation/EMBED_BUILDER' },
          { text: 'ModLog System', link: '/features/moderation/MODLOG_DOCUMENTATION' },
          { text: 'AutoRole System', link: '/features/server-management/AUTOROLE_SYSTEM' },
          { text: 'Self-Role System', link: '/features/server-management/SELFROLE_DOCUMENTATION' },
          { text: 'TempVC System', link: '/features/server-management/TEMPVC_SYSTEM' },
          { text: 'Ticket System', link: '/features/server-management/TICKET_SYSTEM_DOCUMENTATION' },
          { text: 'Welcome System', link: '/features/server-management/WELCOME_SYSTEM' }
        ]
      },
      {
        text: 'Commands',
        items: [
          { text: 'Command Reference', link: '/COMMANDS' }
        ]
      },
      {
        text: 'Other',
        items: [
          { text: 'Premium Features', link: '/other/PREMIUM' },
          { text: 'Ticket Quick Start', link: '/TICKET_QUICK_START' },
          { text: 'Utils Documentation', link: '/UTILS_DOCUMENTATION' },
          { text: 'Welcome Custom Embeds Guide', link: '/WELCOME_CUSTOM_EMBEDS_GUIDE' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-github-org/DeepQuasar' }
    ]
  }
})
