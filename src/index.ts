/**
 * Entry point for the Pythagoras AI Agent GitHub Action
 *
 * This file serves two purposes:
 * 1. Runs the GitHub Action when executed
 * 2. Exports all components for testing and programmatic use
 */

import { run } from './main.js';

// Run the GitHub Action
run();

// Export the run function for testing
export { run } from './main.js';
export * from './exports.js'
