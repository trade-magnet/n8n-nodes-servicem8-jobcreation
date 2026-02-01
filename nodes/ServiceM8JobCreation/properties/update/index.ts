/**
 * Update Job Properties Index
 */

import type { INodeProperties } from 'n8n-workflow';

import { jobSelectionProperties } from './jobSelection';
import { fieldsProperties } from './fields';
import { updateOptionsProperties } from './options';

export const updateProperties: INodeProperties[] = [
	...jobSelectionProperties,
	...fieldsProperties,
	...updateOptionsProperties,
];

// Re-export individual property groups
export { jobSelectionProperties } from './jobSelection';
export { fieldsProperties } from './fields';
export { updateOptionsProperties } from './options';
