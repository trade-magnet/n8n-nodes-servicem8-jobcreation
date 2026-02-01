/**
 * Create Job Properties Index
 */

import type { INodeProperties } from 'n8n-workflow';

import { contactProperties } from './contact';
import { businessProperties } from './business';
import { addressProperties } from './address';
import { jobProperties } from './job';
import { optionsProperties } from './options';

export const createProperties: INodeProperties[] = [
	...contactProperties,
	...businessProperties,
	...addressProperties,
	...jobProperties,
	...optionsProperties,
];

// Re-export individual property groups
export { contactProperties } from './contact';
export { businessProperties } from './business';
export { addressProperties } from './address';
export { jobProperties } from './job';
export { optionsProperties } from './options';
