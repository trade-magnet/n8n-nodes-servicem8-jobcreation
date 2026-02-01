/**
 * Notifications Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const notificationsProperties: INodeProperties[] = [
	{
		displayName: 'Send Notifications',
		name: 'enableNotifications',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Whether to send SMS/email notifications for the new job',
	},
	{
		displayName: 'Notification Recipients',
		name: 'notificationRecipients',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Recipient',
		default: {},
		displayOptions: {
			show: {
				operation: ['create'],
				enableNotifications: [true],
			},
		},
		options: [
			{
				displayName: 'Recipient',
				name: 'recipient',
				values: [
					{
						displayName: 'Notification Type',
						name: 'notificationType',
						type: 'options',
						options: [
							{
								name: 'Email',
								value: 'email',
								description: 'Send an email notification',
							},
							{
								name: 'SMS',
								value: 'sms',
								description: 'Send an SMS notification',
							},
						],
						default: 'email',
						description: 'Type of notification to send',
					},
					{
						displayName: 'Email Address',
						name: 'email',
						type: 'string',
						default: '',
						placeholder: 'name@email.com',
						displayOptions: {
							show: {
								notificationType: ['email'],
							},
						},
						description: 'Recipient email address',
					},
					{
						displayName: 'Phone Number',
						name: 'phone',
						type: 'string',
						default: '',
						placeholder: '04xx xxx xxx',
						displayOptions: {
							show: {
								notificationType: ['sms'],
							},
						},
						description: 'Recipient phone number for SMS',
					},
					{
						displayName: 'Recipient Name',
						name: 'name',
						type: 'string',
						default: '',
						placeholder: 'John',
						description: 'Recipient name (used in greeting)',
					},
					{
						displayName: 'Email Format',
						name: 'emailFormat',
						type: 'options',
						options: [
							{
								name: 'HTML',
								value: 'html',
								description: 'Send HTML formatted email',
							},
							{
								name: 'Plain Text',
								value: 'text',
								description: 'Send plain text email',
							},
						],
						default: 'html',
						displayOptions: {
							show: {
								notificationType: ['email'],
							},
						},
						description: 'Format for email content',
					},
					{
						displayName: 'Subject',
						name: 'subject',
						type: 'string',
						default: '[SM8 NEW JOB] #{{jobNumber}} - {{clientName}}',
						placeholder: 'New job notification',
						displayOptions: {
							show: {
								notificationType: ['email'],
							},
						},
						description: 'Email subject line. Available placeholders: {{name}}, {{jobNumber}}, {{clientName}}, {{jobAddress}}, {{jobDetails}}',
					},
					{
						displayName: 'Message (HTML)',
						name: 'htmlMessage',
						type: 'string',
						typeOptions: {
							rows: 5,
						},
						default: '<p>Hi {{name}},</p><p>A new job has been created.</p><ul><li><strong>Customer:</strong> {{clientName}}</li><li><strong>Job Address:</strong> {{jobAddress}}</li><li><strong>Job #:</strong> #{{jobNumber}}</li><li><strong>Description:</strong> {{jobDetails}}</li></ul><p>Thanks</p>',
						placeholder: '<p>Hi {{name}},</p><p>A new job has been created...</p>',
						displayOptions: {
							show: {
								notificationType: ['email'],
								emailFormat: ['html'],
							},
						},
						description: 'HTML email body. Available placeholders: {{name}}, {{jobNumber}}, {{clientName}}, {{jobAddress}}, {{jobDetails}}',
					},
					{
						displayName: 'Message (Text)',
						name: 'textMessage',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: 'Hi {{name}},\n\nA new job has been created.\n\nCustomer: {{clientName}}\nJob Address: {{jobAddress}}\nJob #: #{{jobNumber}}\nDescription: {{jobDetails}}\n\nThanks',
						placeholder: 'Hi {{name}}, a new job #{{jobNumber}} has been created...',
						displayOptions: {
							show: {
								notificationType: ['email'],
								emailFormat: ['text'],
							},
						},
						description: 'Plain text email body. Available placeholders: {{name}}, {{jobNumber}}, {{clientName}}, {{jobAddress}}, {{jobDetails}}',
					},
					{
						displayName: 'SMS Message',
						name: 'smsMessage',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '[NEW JOB] #{{jobNumber}} - {{clientName}}. Check ServiceM8 for details.',
						placeholder: '[NEW JOB] #{{jobNumber}} - {{clientName}}',
						displayOptions: {
							show: {
								notificationType: ['sms'],
							},
						},
						description: 'SMS message (max 160 characters recommended). Available placeholders: {{name}}, {{jobNumber}}, {{clientName}}, {{jobAddress}}, {{jobDetails}}',
					},
					{
						displayName: 'Include Attachments',
						name: 'includeAttachments',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								notificationType: ['email'],
							},
						},
						description: 'Whether to include attachments from incoming binary data in the email. If enabled, all binary data from the incoming item will be attached.',
					},
				],
			},
		],
	},
];
