// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	//base: '/DeepQuasar/',
	integrations: [
		starlight({
			title: 'DeepQuasar',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/karutoil/DeepQuasar' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.karutoil.site/' }
			],
			editLink: {
				baseUrl: 'https://github.com/karutoil/DeepQuasar/edit/main/docs/',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', link: '/getting-started/quick_start' },
						{ label: 'Modules', link: '/getting-started/modules' },
						{ label: 'FAQ', link: '/getting-started/faq' },
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
						{
							label: 'Moderation Commands',
							collapsed: true,
							items: [
								{ label: 'setup-moderation', link: '/commands/moderation/setup-moderation' },
								{ label: 'warn', link: '/commands/moderation/warn' },
								{ label: 'kick', link: '/commands/moderation/kick' },
								{ label: 'ban', link: '/commands/moderation/ban' },
								{ label: 'unban', link: '/commands/moderation/unban' },
								{ label: 'mute', link: '/commands/moderation/mute' },
								{ label: 'unmute', link: '/commands/moderation/unmute' },
								{ label: 'lock', link: '/commands/moderation/lock' },
								{ label: 'unlock', link: '/commands/moderation/unlock' },
								{ label: 'slowmode', link: '/commands/moderation/slowmode' },
								{ label: 'strike', link: '/commands/moderation/strike' },
								{ label: 'softban', link: '/commands/moderation/softban' },
								{ label: 'modhistory', link: '/commands/moderation/modhistory' },
								{ label: 'warnlist', link: '/commands/moderation/warnlist' },
								{ label: 'note', link: '/commands/moderation/note' },
								{ label: 'reason', link: '/commands/moderation/reason' },
								{ label: 'appeal', link: '/commands/moderation/appeal' },
								{ label: 'pardon', link: '/commands/moderation/pardon' },
							],
						},
						{
							label: 'LFG Commands',
							collapsed: true,
							items: [
								{ label: 'setup-lfg', link: '/commands/LFG/setup-lfg' },
								{ label: 'lfg-admin', link: '/commands/LFG/lfg-admin' },
								{ label: 'lfg-presets', link: '/commands/LFG/lfg-presets' },
								{ label: 'lfg-channels', link: '/commands/LFG/lfg-channels' },
								{ label: 'lfg-test', link: '/commands/LFG/lfg-test' },
								{ label: 'lfg', link: '/commands/LFG/lfg' },
								{ label: 'my-lfg', link: '/commands/LFG/my-lfg' },
							],
						},
					],
				},
				{
					label: 'DEVELOPER REFERENCE',
					collapsed: true,
					// Autogenerate a group of links for the 'constellations' directory.
					autogenerate: { directory: 'api-reference' },
				},
			],
		}),
	],
});
