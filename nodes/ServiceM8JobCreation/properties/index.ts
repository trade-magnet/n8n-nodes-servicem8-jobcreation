/**
 * Properties Index
 * Combines all node properties into a single array
 */

import type { INodeProperties } from 'n8n-workflow';

import { operationProperty } from './operation';
import { updateProperties } from './update';
import { createProperties } from './create';

export const properties: INodeProperties[] = [
	operationProperty,
	...updateProperties,
	...createProperties,
];

// Re-export modules for granular access
export { operationProperty } from './operation';
export { updateProperties } from './update';
export { createProperties } from './create';
