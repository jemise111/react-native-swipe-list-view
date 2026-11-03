const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the library source so edits trigger reloads in the example.
config.watchFolders = [workspaceRoot];

// NOTE: app.json sets `experiments.tsconfigPaths: false` — Metro would
// otherwise apply this example's types-only tsconfig `paths` mappings
// (@types/react etc.) at runtime and fail to resolve `react`.

// Never resolve packages from the repo root's node_modules (the library's
// devDependencies include a second copy of react/react-native). Imports from
// the library source fall through to the example's node_modules instead.
const escapedRoot = workspaceRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = new RegExp(`${escapedRoot}/node_modules/.*`);
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Resolve the library import to its TypeScript source so Metro/Babel compile it
// from source (worklets plugin included) instead of pulling the built `lib/`.
// RNSLV_ENTRY switches this for testing what consumers get:
//   lib      the built CommonJS entry — what Metro picks via `main`
//            (run `npm run build` first)
//   package  no override: resolve normally from example/node_modules, e.g. an
//            `npm pack` tarball installed with `npm install --no-save`
const entry = process.env.RNSLV_ENTRY;
const libraryEntry =
    entry === 'lib'
        ? path.join(workspaceRoot, 'lib', 'commonjs', 'index.js')
        : path.join(workspaceRoot, 'src', 'index.ts');
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'react-native-swipe-list-view' && entry !== 'package') {
        return {
            type: 'sourceFile',
            filePath: libraryEntry,
        };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
