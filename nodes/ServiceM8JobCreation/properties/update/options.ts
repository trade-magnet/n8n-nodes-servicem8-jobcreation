/**
 * Optional Features Properties (Update Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const updateOptionsProperties: INodeProperties[] = [
	// Badges
	{
		displayName: 'Add Badges',
		name: 'updateEnableBadges',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
		description: 'Whether to add badges to the job',
	},
	{
		displayName: 'Badges',
		name: 'updateBadges',
		type: 'multiOptions',
		typeOptions: {
			loadOptionsMethod: 'getBadges',
		},
		default: [],
		displayOptions: {
			show: {
				operation: ['update'],
				updateEnableBadges: [true],
			},
		},
		description: 'Badges to add to the job',
	},

	// Attachments
	{
		displayName: 'Upload Attachments',
		name: 'updateEnableAttachments',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
		description: 'Whether to upload attachments to the job',
	},
	{
		displayName: 'Attachment Mode',
		name: 'updateAttachmentMode',
		type: 'options',
		options: [
			{
				name: 'All Binary Data (Recommended)',
				value: 'allBinary',
				description: 'Automatically upload all binary data from the incoming item',
			},
			{
				name: 'URL List',
				value: 'urlList',
				description: 'Provide a comma-separated list of URLs to download and attach',
			},
		],
		default: 'allBinary',
		displayOptions: {
			show: {
				operation: ['update'],
				updateEnableAttachments: [true],
			},
		},
		description: 'How to specify attachments',
	},
	{
		displayName: 'URL List',
		name: 'updateAttachmentUrlList',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/file1.pdf, https://example.com/file2.jpg',
		displayOptions: {
			show: {
				operation: ['update'],
				updateEnableAttachments: [true],
				updateAttachmentMode: ['urlList'],
			},
		},
		description: 'Comma-separated list of URLs to download and attach',
	},

	// Notes
	{
		displayName: 'Add Note',
		name: 'updateEnableNote',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
		description: 'Whether to add a note to the job',
	},
	{
		displayName: 'Note Content',
		name: 'updateNoteContent',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['update'],
				updateEnableNote: [true],
			},
		},
		description: 'Note content to add to the job',
	},

	// Additional Options
	{
		displayName: 'Additional Options',
		name: 'updateAdditionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Return Headers',
				name: 'returnHeaders',
				type: 'boolean',
				default: false,
				description: 'Whether to include all created record UUIDs in the output (notes, attachments)',
			},
		],
	},
];
