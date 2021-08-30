const { default: Component } = require('./ErrorBoundary.svelte');
const { createBoundary } = require('./createBoundary');

const ErrorBoundary = createBoundary(Component)

// don't ask.
ErrorBoundary.default = ErrorBoundary;
module.exports = ErrorBoundary
