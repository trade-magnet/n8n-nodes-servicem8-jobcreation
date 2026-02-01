/**
 * Address Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const addressProperties: INodeProperties[] = [
	// Client Address
	{
		displayName: 'Client Address',
		name: 'clientAddress',
		type: 'fixedCollection',
		placeholder: 'Add Address',
		default: {},
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Address',
				name: 'address',
				values: [
					{
						displayName: 'Street',
						name: 'street',
						type: 'string',
						default: '',
						placeholder: '123 Main Street',
						description: 'Street address including unit/suite number',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						placeholder: 'Sydney',
						description: 'City or suburb',
					},
					{
						displayName: 'State/Province',
						name: 'state',
						type: 'string',
						default: '',
						placeholder: 'NSW',
						description: 'State, province, or region',
					},
					{
						displayName: 'Postcode',
						name: 'postcode',
						type: 'string',
						default: '',
						placeholder: '2000',
						description: 'Postal or ZIP code',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'Australia',
						description: 'Country name',
					},
				],
			},
		],
	},

	// Job Address Same as Client
	{
		displayName: 'Job Address Same as Client',
		name: 'jobAddressSameAsClient',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Whether to use the client address for the job site',
	},

	// Job Address
	{
		displayName: 'Job Address',
		name: 'jobAddress',
		type: 'fixedCollection',
		placeholder: 'Add Address',
		default: {},
		displayOptions: {
			show: {
				operation: ['create'],
				jobAddressSameAsClient: [false],
			},
		},
		options: [
			{
				displayName: 'Address',
				name: 'address',
				values: [
					{
						displayName: 'Street',
						name: 'street',
						type: 'string',
						default: '',
						placeholder: '456 Job Site Road',
						description: 'Street address including unit/suite number',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						placeholder: 'Melbourne',
						description: 'City or suburb',
					},
					{
						displayName: 'State/Province',
						name: 'state',
						type: 'string',
						default: '',
						placeholder: 'VIC',
						description: 'State, province, or region',
					},
					{
						displayName: 'Postcode',
						name: 'postcode',
						type: 'string',
						default: '',
						placeholder: '3000',
						description: 'Postal or ZIP code',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						placeholder: 'Australia',
						description: 'Country name',
					},
				],
			},
		],
	},
];
