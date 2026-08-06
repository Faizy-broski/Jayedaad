const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm workspaces store packages in a symlinked .pnpm store — Metro needs
// symlink support and to watch the monorepo root to resolve
// @jayedaad/core / @jayedaad/ui-native, otherwise module resolution fails
// (e.g. "Unable to resolve module ./node_modules/expo/AppEntry").
//
// resolver.nodeModulesPaths is ADDITIVE, not a replacement — Metro still
// does its normal hierarchical walk up every ancestor directory's
// node_modules first (see metro-resolver's resolve.js), these two are
// just appended as extra fallback directories. They matter for packages
// like packages/ui-native, whose own node_modules doesn't carry every
// transitive dep (e.g. @babel/runtime) — that dep is only symlinked
// under apps/mobile/node_modules, which isn't one of ui-native's own
// ancestor directories, so without this fallback the hierarchical walk
// alone can't reach it.
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
