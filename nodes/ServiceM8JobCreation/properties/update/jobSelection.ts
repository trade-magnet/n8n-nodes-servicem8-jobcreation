/**
 * Job Selection Properties (Update Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const jobSelectionProperties: INodeProperties[] = [
	{
		displayName: 'Job Selection Mode',
		name: 'jobSelectionMode',
		type: 'options',
		options: [
			{
				name: 'Dropdown (Select from List)',
				value: 'dropdown',
				description: 'Select a job from a searchable dropdown',
			},
			{
				name: 'Dynamic (Expression)',
				value: 'dynamic',
				description: 'Enter job number directly or use an expression',
			},
		],
		default: 'dropdown',
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
		description: 'How to specify the job to update',
	},
	{
		displayName: 'Job',
		name: 'jobUuid',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getJobs',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['update'],
				jobSelectionMode: ['dropdown'],
			},
		},
		description: 'Select the job to update',
	},
	{
		displayName: 'Job Number',
		name: 'jobNumber',
		type: 'string',
		default: '',
		placeholder: 'J00123',
		displayOptions: {
			show: {
				operation: ['update'],
				jobSelectionMode: ['dynamic'],
			},
		},
		description: 'The job number (e.g., J00123) to update',
	},
];
