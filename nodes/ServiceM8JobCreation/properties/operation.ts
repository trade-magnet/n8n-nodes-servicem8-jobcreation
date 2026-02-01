/**
 * Operation Selector Property
 */

import type { INodeProperties } from 'n8n-workflow';

export const operationProperty: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Create Job',
			value: 'create',
			description: 'Create a new job with intelligent client/contact deduplication',
			action: 'Create a new job',
		},
		{
			name: 'Update Job',
			value: 'update',
			description: 'Update an existing job by job number',
			action: 'Update an existing job',
		},
	],
	default: 'create',
};
