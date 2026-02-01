/**
 * Optional Features Index (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

import { categoryProperties } from './category';
import { badgesProperties } from './badges';
import { queueProperties } from './queue';
import { notificationsProperties } from './notifications';
import { attachmentsProperties } from './attachments';
import { notesProperties } from './notes';
import { additionalOptionsProperties } from './additionalOptions';

export const optionsProperties: INodeProperties[] = [
	...categoryProperties,
	...badgesProperties,
	...queueProperties,
	...notificationsProperties,
	...attachmentsProperties,
	...notesProperties,
	...additionalOptionsProperties,
];

// Re-export individual option groups
export { categoryProperties } from './category';
export { badgesProperties } from './badges';
export { queueProperties } from './queue';
export { notificationsProperties } from './notifications';
export { attachmentsProperties } from './attachments';
export { notesProperties } from './notes';
export { additionalOptionsProperties } from './additionalOptions';
