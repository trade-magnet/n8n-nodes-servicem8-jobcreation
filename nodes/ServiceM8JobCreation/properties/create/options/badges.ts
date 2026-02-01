/**
 * Badges Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const badgesProperties: INodeProperties[] = [
	{
		displayName: 'Assign Badges',
		name: 'enableBadges',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Whether to assign badges to the job',
	},
	{
		displayName: 'Use Dynamic Badge Names',
		name: 'badgesDynamic',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
				enableBadges: [true],
			},
		},
		description: 'Use dynamic badge names from expression instead of dropdown',
	},
	{
		displayName: 'Badges',
		name: 'badges',
		type: 'multiOptions',
		typeOptions: {
			loadOptionsMethod: 'getBadges',
		},
		default: [],
		displayOptions: {
			show: {
				operation: ['create'],
				enableBadges: [true],
				badgesDynamic: [false],
			},
		},
		description: 'Badges to apply to the job',
	},
	{
		displayName: 'Badge Names',
		name: 'badgeNames',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
				enableBadges: [true],
				badgesDynamic: [true],
			},
		},
		description: 'Comma-separated badge names to look up (case-insensitive)',
	},
];
