/**
 * Additional Options Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const additionalOptionsProperties: INodeProperties[] = [
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Individual Name Format',
				name: 'nameFormat',
				type: 'options',
				options: [
					{
						name: 'First Last',
						value: 'firstLast',
						description: 'Store as "John Smith"',
					},
					{
						name: 'Last, First',
						value: 'lastFirst',
						description: 'Store as "Smith, John" (ServiceM8 default)',
					},
				],
				default: 'firstLast',
				description: 'How individual client names are formatted. Must match your ServiceM8 settings for deduplication to work correctly.',
			},
			{
				displayName: 'Return Headers',
				name: 'returnHeaders',
				type: 'boolean',
				default: false,
				description: 'Whether to include all created record UUIDs in the output (client, contact, job contact, notes, attachments)',
			},
		],
	},
];
