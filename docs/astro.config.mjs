// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	base: '/DeepQuasar/',
	integrations: [
		starlight({
			title: 'DeepQuasar',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/yourusername/DeepQuasar' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', link: 'DeepQuasar/getting-started/quick-start' },
						{ label: 'Modules', link: 'DeepQuasar/getting-started/modules' },
					],
				},
				{
					label: 'Commands',
					items: [
						{
							label: 'AI Commands',
							collapsed: true,
							items: [
								{ label: 'ask', link: '/DeepQuasar/commands/ask' },
								{ label: 'chatbot', link: '/DeepQuasar/commands/chatbot' },
							],
						},
						{
							label: 'Information Commands',
							collapsed: true,
							items: [
								{ label: 'globalstats', link: '/DeepQuasar/commands/globalstats' },
								{ label: 'help', link: '/DeepQuasar/commands/help' },
								{ label: 'linecount', link: '/DeepQuasar/commands/linecount' },
								{ label: 'selfrole-help', link: '/DeepQuasar/commands/selfrole-help' },
								{ label: 'stats', link: '/DeepQuasar/commands/stats' },
							],
						},
						{
							label: 'Music Commands',
							collapsed: true,
							items: [
								{ label: 'filters', link: '/DeepQuasar/commands/filters' },
								{ label: 'history', link: '/DeepQuasar/commands/history' },
								{ label: 'loop', link: '/DeepQuasar/commands/loop' },
								{ label: 'nowplaying', link: '/DeepQuasar/commands/nowplaying' },
								{ label: 'pause', link: '/DeepQuasar/commands/pause' },
								{ label: 'play', link: '/DeepQuasar/commands/play' },
								{ label: 'queue', link: '/DeepQuasar/commands/queue' },
								{ label: 'resume', link: '/DeepQuasar/commands/resume' },
								{ label: 'search', link: '/DeepQuasar/commands/search' },
								{ label: 'seek', link: '/DeepQuasar/commands/seek' },
								{ label: 'skip', link: '/DeepQuasar/commands/skip' },
								{ label: 'stop', link: '/DeepQuasar/commands/stop' },
								{ label: 'volume', link: '/DeepQuasar/commands/volume' },
							],
						},
						{
							label: 'Settings Commands',
							collapsed: true,
							items: [
								{ label: 'autorole', link: '/DeepQuasar/commands/autorole' },
								{ label: 'cleanup', link: '/DeepQuasar/commands/cleanup' },
								{ label: 'embed', link: '/DeepQuasar/commands/embed-builder' },
								{ label: 'modlog', link: '/DeepQuasar/commands/modlog' },
								{ label: 'selfrole-advanced', link: '/DeepQuasar/commands/selfrole-advanced' },
								{ label: 'selfrole-setup', link: '/DeepQuasar/commands/selfrole-setup' },
								{ label: 'selfrole', link: '/DeepQuasar/commands/selfrole' },
								{ label: 'settings', link: '/DeepQuasar/commands/settings' },
								{ label: 'templates', link: '/DeepQuasar/commands/templates' },
								{ label: 'tempvc-templates', link: '/DeepQuasar/commands/tempvc-templates' },
								{ label: 'tempvc', link: '/DeepQuasar/commands/tempvc' },
							],
						},
						{
							label: 'TempVC Commands',
							collapsed: true,
							items: [
								{ label: 'tempvc-list', link: '/DeepQuasar/commands/tempvc-list' },
								{ label: 'vc', link: '/DeepQuasar/commands/vc' },
							],
						},
						{
							label: 'Ticket Commands',
							collapsed: true,
							items: [
								{ label: 'tickets', link: '/DeepQuasar/commands/tickets' },
								{ label: 'fix-tickets', link: '/DeepQuasar/commands/fix-tickets' },
								{ label: 'panel', link: '/DeepQuasar/commands/panel' },
								{ label: 'ticket', link: '/DeepQuasar/commands/ticket' },
							],
						},
						{
							label: 'General Commands',
							collapsed: true,
							items: [
								{ label: 'create-guild-data', link: '/DeepQuasar/commands/create-guild-data' },
								{ label: 'debug-welcome', link: '/DeepQuasar/commands/debug-welcome' },
								{ label: 'test-welcome', link: '/DeepQuasar/commands/test-welcome' },
								{ label: 'welcome', link: '/DeepQuasar/commands/welcome' },
							],
						},
					],
				},
			],
		}),
	],
});
