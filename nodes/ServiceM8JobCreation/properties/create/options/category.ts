/**
 * Category Properties (Create Job)
 */

import type { INodeProperties } from 'n8n-workflow';

export const categoryProperties: INodeProperties[] = [
	{
		displayName: 'Assign Category',
		name: 'enableCategory',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'Whether to assign a category to the job',
	},
	{
		displayName: 'Use Dynamic Category Name',
		name: 'categoryDynamic',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
				enableCategory: [true],
			},
		},
		description: 'Use a dynamic category name from expression instead of dropdown',
	},
	{
		displayName: 'Category',
		name: 'category',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getCategories',
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
				enableCategory: [true],
				categoryDynamic: [false],
			},
		},
		description: 'Category to assign to the job',
	},
	{
		displayName: 'Category Name',
		name: 'categoryName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['create'],
				enableCategory: [true],
				categoryDynamic: [true],
			},
		},
		description: 'Category name to look up (case-insensitive)',
	},
];
