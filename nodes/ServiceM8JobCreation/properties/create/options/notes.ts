/**
 * Notes Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const notesProperties: INodeProperties[] = [
	{
		displayName: 'Add Custom Note',
		name: 'enableCustomNote',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Whether to add a custom note to the job',
	},
	{
		displayName: 'Note Content',
		name: 'customNoteContent',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
				enableCustomNote: [true],
			},
		},
		description: 'Custom note content to add to the job',
	},
	{
		displayName: 'System Report Note',
		name: 'systemNoteNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description:
			'A system report note is automatically added to every job with creation details and any issues encountered',
	},
];
