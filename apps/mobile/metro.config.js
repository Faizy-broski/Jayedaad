const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm workspaces store packages in a symlinked .pnpm store — Metro needs
// symlink support and to watch the monorepo root to resolve
// @jayedaad/core / @jayedaad/ui-native, otherwise module resolution fails
// (e.g. "Unable to resolve module ./node_modules/expo/AppEntry").
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
