import Component from "./ErrorBoundary.svelte";
//const { default: Component } = require("./ErrorBoundary.svelte");
import { createBoundary } from "./createBoundary";
//const { createBoundary } = require("./createBoundary");

const ErrorBoundary = createBoundary(Component);

// don't ask.
//ErrorBoundary.default = ErrorBoundary;
//module.exports = ErrorBoundary;
export default ErrorBoundary;
