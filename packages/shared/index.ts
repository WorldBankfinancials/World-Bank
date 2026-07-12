/**
 * shared
 *
 * Shared package for the banking platform.
 * Re-exports everything from schema.ts and types.ts so consumers
 * can `import { ... } from '../shared'` and get the full surface area.
 */

export * from './schema';
export * from './types';

export const packageName = 'shared';
export default { packageName };
