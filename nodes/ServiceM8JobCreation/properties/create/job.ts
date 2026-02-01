/**
 * Job Information Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const jobProperties: INodeProperties[] = [
	{
		displayName: 'Job Details',
		name: 'jobDetails',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		placeholder: 'Describe the work to be done...',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Job description/notes',
	},
	{
		displayName: 'Job Status',
		name: 'jobStatus',
		type: 'options',
		options: [
			{ name: 'Quote', value: 'Quote' },
			{ name: 'Work Order', value: 'Work Order' },
			{ name: 'Completed', value: 'Completed' },
			{ name: 'Unsuccessful', value: 'Unsuccessful' },
		],
		default: 'Quote',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Initial status for the job',
	},
];
