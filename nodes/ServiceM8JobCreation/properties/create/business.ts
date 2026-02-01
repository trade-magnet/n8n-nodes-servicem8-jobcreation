/**
 * Business Name Property (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const businessProperties: INodeProperties[] = [
	{
		displayName: 'Business Name',
		name: 'businessName',
		type: 'string',
		default: '',
		placeholder: 'Acme Plumbing Pty Ltd',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'If provided, client will be created as a business; otherwise as individual',
	},
];
