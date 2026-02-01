/**
 * Attachments Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const attachmentsProperties: INodeProperties[] = [
	{
		displayName: 'Upload Attachments',
		name: 'enableAttachments',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Whether to upload attachments to the job',
	},
	{
		displayName: 'Attachment Mode',
		name: 'attachmentMode',
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
			{
				name: 'Manual',
				value: 'manual',
				description: 'Manually define each attachment individually',
			},
		],
		default: 'allBinary',
		displayOptions: {
			show: {
				operation: ['create'],
				enableAttachments: [true],
			},
		},
		description: 'How to specify attachments',
	},
	{
		displayName: 'URL List',
		name: 'attachmentUrlList',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/file1.pdf, https://example.com/file2.jpg',
		displayOptions: {
			show: {
				operation: ['create'],
				enableAttachments: [true],
				attachmentMode: ['urlList'],
			},
		},
		description:
			'Comma-separated list of URLs to download and attach. Can also use an expression returning an array.',
	},
	{
		displayName: 'Attachments',
		name: 'attachments',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Attachment',
		default: {},
		displayOptions: {
			show: {
				operation: ['create'],
				enableAttachments: [true],
				attachmentMode: ['manual'],
			},
		},
		options: [
			{
				displayName: 'Attachment',
				name: 'attachment',
				values: [
					{
						displayName: 'Source Type',
						name: 'sourceType',
						type: 'options',
						options: [
							{
								name: 'Binary (from Previous Node)',
								value: 'binary',
								description:
									'Use binary data from a previous node (e.g., HTTP Request, Read File)',
							},
							{
								name: 'URL (Download from Web)',
								value: 'url',
								description: 'Download file from a URL',
							},
						],
						default: 'binary',
						description: 'Where to get the file from',
					},
					{
						displayName: 'Binary Property',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						displayOptions: {
							show: {
								sourceType: ['binary'],
							},
						},
						description: 'Name of the binary property containing the file (usually "data")',
					},
					{
						displayName: 'File URL',
						name: 'fileUrl',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/document.pdf',
						displayOptions: {
							show: {
								sourceType: ['url'],
							},
						},
						description: 'URL to download the file from',
					},
					{
						displayName: 'File Name',
						name: 'fileName',
						type: 'string',
						default: '',
						placeholder: 'document.pdf',
						description: 'Custom filename (optional - auto-detected if not provided)',
					},
					{
						displayName: 'File Type',
						name: 'fileType',
						type: 'string',
						default: '',
						placeholder: '.pdf',
						description: 'File extension override (optional - auto-detected if not provided)',
					},
				],
			},
		],
	},
];
