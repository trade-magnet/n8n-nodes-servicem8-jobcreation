/**
 * Contact Information Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const contactProperties: INodeProperties[] = [
	{
		displayName: 'Contact Information',
		name: 'contactNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		placeholder: 'John',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Contact first name',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		placeholder: 'Smith',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Contact last name',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'john.smith@example.com',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Contact email address (primary lookup identifier)',
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		placeholder: '02 9876 5432',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Landline phone number',
	},
	{
		displayName: 'Mobile',
		name: 'mobile',
		type: 'string',
		default: '',
		placeholder: '0412 345 678',
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Mobile phone number',
	},
];
