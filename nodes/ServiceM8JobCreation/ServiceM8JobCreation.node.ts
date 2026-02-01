/**
 * ServiceM8 Smart Job Creation Node
 * Creates or updates ServiceM8 jobs with intelligent client/contact deduplication
 */

import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

import { properties } from './properties';
import { methods } from './methods';
import { execute } from './execute';

export class ServiceM8JobCreation implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ServiceM8 Smart Job Creation',
		name: 'serviceM8SmartJobCreation',
		icon: 'file:servicem8.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create or update ServiceM8 jobs with intelligent client/contact deduplication',
		defaults: {
			name: 'ServiceM8 Smart Job Creation',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'serviceM8Api',
				required: true,
			},
		],
		properties,
	};

	methods = methods;
	execute = execute;
}
