/**
 * Load Options Methods
 * Dynamic dropdown data fetching for the node
 */

import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import type {
	ServiceM8Category,
	ServiceM8Badge,
	ServiceM8Queue,
	ServiceM8Job,
} from '../types';
import { serviceM8Request, parseArrayResponse } from '../helpers/api';

export async function getCategories(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = await serviceM8Request(this, {
		method: 'GET',
		endpoint: '/api_1.0/category.json',
		query: { $filter: 'active eq 1' },
	});

	const categories = parseArrayResponse<ServiceM8Category>(response);
	return categories.map((cat) => ({
		name: cat.name,
		value: cat.uuid,
	}));
}

export async function getBadges(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = await serviceM8Request(this, {
		method: 'GET',
		endpoint: '/api_1.0/badge.json',
		query: { $filter: 'active eq 1' },
	});

	const badges = parseArrayResponse<ServiceM8Badge>(response);
	return badges.map((badge) => ({
		name: badge.name,
		value: badge.uuid,
	}));
}

export async function getQueues(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = await serviceM8Request(this, {
		method: 'GET',
		endpoint: '/api_1.0/queue.json',
		query: { $filter: 'active eq 1' },
	});

	const queues = parseArrayResponse<ServiceM8Queue>(response);
	return queues.map((queue) => ({
		name: queue.name,
		value: queue.uuid,
	}));
}

export async function getJobs(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = await serviceM8Request(this, {
		method: 'GET',
		endpoint: '/api_1.0/job.json',
		query: { $filter: 'active eq 1', $orderby: 'edit_date desc' },
	});

	const jobs = parseArrayResponse<ServiceM8Job>(response);
	return jobs.map((job) => ({
		name: `${job.generated_job_id} - ${job.status}${job.job_description ? ` - ${job.job_description.substring(0, 50)}` : ''}`,
		value: job.uuid,
	}));
}
