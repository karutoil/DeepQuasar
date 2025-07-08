// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	base: '/DeepQuasar/',
	integrations: [
		starlight({
			title: 'DeepQuasar',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/yourusername/DeepQuasar' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.karutoil.site/' }
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', link: '/getting-started/quick-start' },
						{ label: 'Modules', link: '/getting-started/modules' },
					],
				},
				{
					label: 'Commands',
					items: [
						{
							label: 'AI Commands',
							collapsed: true,
							items: [
								{ label: 'ask', link: '/commands/ask' },
								{ label: 'chatbot', link: '/commands/chatbot' },
							],
						},
						{
							label: 'Information Commands',
							collapsed: true,
							items: [
								{ label: 'globalstats', link: '/commands/globalstats' },
								{ label: 'help', link: '/commands/help' },
								{ label: 'linecount', link: '/commands/linecount' },
								{ label: 'selfrole-help', link: '/commands/selfrole-help' },
								{ label: 'stats', link: '/commands/stats' },
							],
						},
						{
							label: 'Music Commands',
							collapsed: true,
							items: [
								{ label: 'filters', link: '/commands/filters' },
								{ label: 'history', link: '/commands/history' },
								{ label: 'loop', link: '/commands/loop' },
								{ label: 'nowplaying', link: '/commands/nowplaying' },
								{ label: 'pause', link: '/commands/pause' },
								{ label: 'play', link: '/commands/play' },
								{ label: 'queue', link: '/commands/queue' },
								{ label: 'resume', link: '/commands/resume' },
								{ label: 'search', link: '/commands/search' },
								{ label: 'seek', link: '/commands/seek' },
								{ label: 'skip', link: '/commands/skip' },
								{ label: 'stop', link: '/commands/stop' },
								{ label: 'volume', link: '/commands/volume' },
							],
						},
						{
							label: 'Utils Commands',
							collapsed: true,
							items: [
								{ label: 'cleanup', link: '/commands/cleanup' },
								{ label: 'embed', link: '/commands/embed-builder' },
								{ label: 'modlog', link: '/commands/modlog' },
								{ label: 'settings', link: '/commands/settings' },
							],
						},
						{
							label: 'Template Commands',
							collapsed: true,
							items: [
								{ label: 'templates', link: '/commands/templates' },
								{ label: 'tempvc-templates', link: '/commands/tempvc-templates' },
							],
						},
						{
							label: 'Selfrole Commands',
							collapsed: true,
							items: [
								{ label: 'selfrole', link: '/commands/selfrole' },
								{ label: 'selfrole-setup', link: '/commands/selfrole-setup' },
								{ label: 'selfrole-advanced', link: '/commands/selfrole-advanced' },
							],
						},
						{
							label: 'Autorole Command',
							collapsed: true,
							items: [
								{ label: 'autorole', link: '/commands/autorole' },
							],
						},
						{
							label: 'TempVC Commands',
							collapsed: true,
							items: [
								{ label: 'vc', link: '/commands/vc' },
								{ label: 'tempvc', link: '/commands/tempvc' },
								{ label: 'tempvc-list', link: '/commands/tempvc-list' },
							],
						},
						{
							label: 'Ticket Commands',
							collapsed: true,
							items: [
								{ label: 'tickets', link: '/commands/tickets' },
								{ label: 'fix-tickets', link: '/commands/fix-tickets' },
								{ label: 'panel', link: '/commands/panel' },
								{ label: 'ticket', link: '/commands/ticket' },
							],
						},
						{
							label: 'General Commands',
							collapsed: true,
							items: [
								{ label: 'create-guild-data', link: '/commands/create-guild-data' },
								{ label: 'debug-welcome', link: '/commands/debug-welcome' },
								{ label: 'test-welcome', link: '/commands/test-welcome' },
								{ label: 'welcome', link: '/commands/welcome' },
							],
						},
					],
				},
			],
		}),
	],
});
