/**
 * Update Fields Properties (Update Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const fieldsProperties: INodeProperties[] = [
	{
		displayName: 'Update Fields',
		name: 'updateFieldsNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Fields to Update',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Job Description',
				name: 'job_description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Update the job description/notes',
			},
			{
				displayName: 'Job Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Quote', value: 'Quote' },
					{ name: 'Work Order', value: 'Work Order' },
					{ name: 'In Progress', value: 'In Progress' },
					{ name: 'Completed', value: 'Completed' },
				],
				default: 'Quote',
				description: 'Update the job status',
			},
			{
				displayName: 'Job Address',
				name: 'job_address',
				type: 'string',
				default: '',
				description: 'Update the job site address',
			},
			{
				displayName: 'Category',
				name: 'category_uuid',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getCategories',
				},
				default: '',
				description: 'Update the job category',
			},
		],
	},
];
