/**
 * Reports Module Router
 * 
 * This file assembles the modularized reports sub-routers into a single cohesive interface.
 * Logic is separated into:
 * - Queries: Data fetching and dashboards
 * - Mutations: Data modification and validation
 * - Files: PDF, XML, and Bulk exports
 */

export * from "./reports.queries.js";
export * from "./reports.mutations.js";
export * from "./reports.files.js";
export * from "./reports.mapper.js";
