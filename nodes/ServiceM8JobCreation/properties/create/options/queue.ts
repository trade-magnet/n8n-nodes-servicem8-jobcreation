/**
 * Queue Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const queueProperties: INodeProperties[] = [
	{
		displayName: 'Assign to Queue',
		name: 'enableQueue',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Whether to assign the job to a queue',
	},
	{
		displayName: 'Use Dynamic Queue Name',
		name: 'queueDynamic',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
				enableQueue: [true],
			},
		},
		description: 'Use a dynamic queue name from expression instead of dropdown',
	},
	{
		displayName: 'Queue',
		name: 'queue',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getQueues',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
				enableQueue: [true],
				queueDynamic: [false],
			},
		},
		description: 'Queue to assign the job to',
	},
	{
		displayName: 'Queue Name',
		name: 'queueName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
				enableQueue: [true],
				queueDynamic: [true],
			},
		},
		description: 'Queue name to look up (case-insensitive)',
	},
];
