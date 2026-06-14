// @ts-check

// Manual sidebar so the shared top-level docs/*.md need no Docusaurus frontmatter
// (keeps them clean when rendered on GitHub). Doc ids are the file names.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    docsSidebar: [
        'intro',
        {
            type: 'category',
            label: 'API',
            collapsed: false,
            items: ['SwipeListView', 'SwipeRow'],
        },
        {
            type: 'category',
            label: 'Guides',
            collapsed: false,
            items: ['actions', 'per-row-behavior', 'manually-closing-rows'],
        },
        'examples',
        'MIGRATION',
    ],
};

export default sidebars;
