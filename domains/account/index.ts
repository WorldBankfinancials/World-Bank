/**
 * Account Domain
 *
 * Public API for the Account domain.
 * This domain has REST route handlers that re-export from the central fix-routes.ts.
 */

export { default as routes } from './interfaces/rest/routes';
export { registerFixedRoutes } from './interfaces/rest/routes';

export const domainName = 'account';
export default { domainName };
