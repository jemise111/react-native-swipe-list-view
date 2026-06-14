// @ts-check
// Docs-only Docusaurus site. The doc pages live in the repo's top-level `docs/`
// folder (single source of truth — same files GitHub renders); this site reads
// them via the `path: '../docs'` setting below. Authored in Phase 7 to be
// Docusaurus-friendly (relative intra-doc links, ATX headings, fenced code).

import { themes as prismThemes } from 'prism-react-renderer';

const organizationName = 'jemise111';
const projectName = 'react-native-swipe-list-view';

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'react-native-swipe-list-view',
    tagline: 'Swipeable-row FlatList / SectionList for React Native',
    favicon: 'img/favicon.png',

    // Served via GitHub Pages on a custom domain (CNAME); `url` must be the
    // canonical host so sitemap/canonical tags are correct. `organizationName`
    // stays the GitHub org for repo/edit links.
    url: 'https://jessesessler.com',
    baseUrl: `/${projectName}/`,

    organizationName,
    projectName,
    trailingSlash: false,

    onBrokenLinks: 'throw',

    // Top-level docs/*.md are CommonMark (HTML tables, &#124; entities, etc.).
    // 'detect' parses .md as CommonMark and only .mdx as MDX, so the existing
    // GitHub-flavored docs render without MDX/JSX parsing surprises.
    markdown: {
        format: 'detect',
        hooks: {
            onBrokenMarkdownLinks: 'warn',
        },
    },

    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    path: '../docs',
                    routeBasePath: '/',
                    sidebarPath: './sidebars.js',
                    editUrl: `https://github.com/${organizationName}/${projectName}/tree/master/docs/`,
                },
                blog: false,
                theme: {
                    customCss: './src/css/custom.css',
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: 'react-native-swipe-list-view',
                items: [
                    {
                        type: 'docSidebar',
                        sidebarId: 'docsSidebar',
                        position: 'left',
                        label: 'Docs',
                    },
                    {
                        href: `https://github.com/${organizationName}/${projectName}`,
                        label: 'GitHub',
                        position: 'right',
                    },
                    {
                        href: 'https://www.npmjs.com/package/react-native-swipe-list-view',
                        label: 'npm',
                        position: 'right',
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Docs',
                        items: [
                            { label: 'Getting started', to: '/' },
                            { label: 'SwipeListView API', to: '/SwipeListView' },
                            { label: 'SwipeRow API', to: '/SwipeRow' },
                            { label: 'Migration v3 → v4', to: '/MIGRATION' },
                        ],
                    },
                    {
                        title: 'More',
                        items: [
                            {
                                label: 'GitHub',
                                href: `https://github.com/${organizationName}/${projectName}`,
                            },
                            {
                                label: 'npm',
                                href: 'https://www.npmjs.com/package/react-native-swipe-list-view',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} ${organizationName}. Built with Docusaurus.`,
            },
            prism: {
                theme: prismThemes.github,
                darkTheme: prismThemes.dracula,
                additionalLanguages: ['bash', 'json', 'jsx', 'tsx'],
            },
        }),
};

export default config;
