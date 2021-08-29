const { default: Component } = require('./ErrorBoundary.svelte');
const { createBoundary } = require('./createBoundary');

module.exports = createBoundary(Component);
