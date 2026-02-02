/**
 * ServiceM8 API Response Types
 */

export interface ServiceM8Client {
	uuid: string;
	name: string;
	is_individual: string;
	address: string;
	address_street: string;
	address_city: string;
	address_state: string;
	address_postcode: string;
	address_country: string;
	active: number;
}

export interface ServiceM8Contact {
	uuid: string;
	company_uuid: string;
	first: string;
	last: string;
	email: string;
	phone: string;
	mobile: string;
	type: string;
	active: number;
}

export interface ServiceM8Job {
	uuid: string;
	generated_job_id: string;
	status: string;
	company_uuid: string;
	job_address: string;
	billing_address: string;
	job_description: string;
	active: number;
}

export interface ServiceM8Category {
	uuid: string;
	name: string;
	active: number;
}

export interface ServiceM8Badge {
	uuid: string;
	name: string;
	active: number;
}

export interface ServiceM8Queue {
	uuid: string;
	name: string;
	active: number;
}

export interface ServiceM8ApiResponse<T = unknown> {
	statusCode?: number;
	headers?: Record<string, string>;
	body?: T;
}

// Type guards
export function isServiceM8Client(obj: unknown): obj is ServiceM8Client {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'uuid' in obj &&
		'name' in obj &&
		'is_individual' in obj
	);
}

export function isServiceM8Contact(obj: unknown): obj is ServiceM8Contact {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'uuid' in obj &&
		'company_uuid' in obj &&
		'first' in obj
	);
}

export function parseApiResult<T>(result: unknown): T[] {
	if (Array.isArray(result)) {
		return result as T[];
	}
	if (result && typeof result === 'object' && 'uuid' in result) {
		return [result as T];
	}
	return [];
}
