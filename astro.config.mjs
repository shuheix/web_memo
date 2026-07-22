// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://shuheix.github.io',
	base: '/web_memo/',
	integrations: [
		starlight({
			title: 'My Docs',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
				{
					label: 'TypeScript',
					items: [
						{ label: 'interfaceとGoとの比較', slug: 'typescript/interface' },
					]
				},
				{
					label: 'Ubuntu',
					items: [
						{ label: 'Auto Install', slug: 'ubuntu/autoinstall' },
						{ label: 'Install Media', slug: 'ubuntu/install-media'},
					]
				},
				{
					label: 'React',
					items: [
						{ label: '即時関数(IIFE)', slug: 'react/iife' },
					]
				},
				{
					label: '関数型',
					items: [
						{ label: 'モナド・ROP・Either・Effect の全体像', slug: 'functional/monad-rop-either-effect' },
					]
				},
				{
					label: 'Git',
					items: [
						{ label: 'OSS 向けの Git 基礎', slug: 'git/git-basics-for-oss' },
					]
				},
				{
					label: 'アプリ要件',
					items: [
						{ label: 'ミニ SNS サンプルアプリの機能一覧', slug: 'app-requirements/rails-tutorial' },
					]
				}
			],
		}),
	],
});
