import Component from "./ErrorBoundary.svelte";
import { createBoundary } from "./createBoundary";

const ErrorBoundary = createBoundary(Component);

export default ErrorBoundary;
