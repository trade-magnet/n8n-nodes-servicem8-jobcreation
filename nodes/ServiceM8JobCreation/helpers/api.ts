/**
 * ServiceM8 API Helper Functions
 */

import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://api.servicem8.com';

export interface ServiceM8RequestOptions {
	method?: IHttpRequestMethods;
	endpoint: string;
	body?: Record<string, unknown>;
	query?: Record<string, string>;
	returnFullResponse?: boolean;
}

/**
 * Make an authenticated request to the ServiceM8 API
 */
export async function serviceM8Request(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	options: ServiceM8RequestOptions,
): Promise<unknown> {
	const { method = 'GET', endpoint, body, query, returnFullResponse = false } = options;

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		json: true,
		returnFullResponse,
	};

	if (body) {
		requestOptions.body = body;
	}

	if (query) {
		requestOptions.qs = query;
	}

	try {
		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'serviceM8Api',
			requestOptions,
		);
		return response;
	} catch (error) {
		// Extract the actual ServiceM8 error message from the response
		const err = error as Error & { cause?: { message?: string }; response?: { body?: { message?: string } } };
		let errorMessage = err.message;

		// Try to get the actual API error message
		if (err.cause?.message) {
			errorMessage = err.cause.message;
		} else if (err.response?.body?.message) {
			errorMessage = err.response.body.message;
		}

		throw new NodeApiError(context.getNode(), { message: errorMessage }, {
			message: `ServiceM8 API error on ${endpoint}: ${errorMessage}`,
		});
	}
}

/**
 * Extract UUID from response headers (for POST requests that return x-record-uuid)
 */
export function extractUuidFromResponse(response: unknown): string | null {
	if (!response || typeof response !== 'object') {
		return null;
	}

	// Full response with headers
	const fullResponse = response as { headers?: Record<string, string>; body?: unknown };
	if (fullResponse.headers?.['x-record-uuid']) {
		return fullResponse.headers['x-record-uuid'];
	}

	// Direct response with uuid field
	const directResponse = response as { uuid?: string };
	if (directResponse.uuid) {
		return directResponse.uuid;
	}

	return null;
}

/**
 * Build OData $filter query parameter
 */
export interface FilterCondition {
	field: string;
	operator: 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le';
	value: string | number;
}

export function buildODataFilter(conditions: FilterCondition[]): string {
	return conditions
		.map((c) => {
			const value = typeof c.value === 'string' ? `'${escapeOData(c.value)}'` : c.value;
			return `${c.field} ${c.operator} ${value}`;
		})
		.join(' and ');
}

/**
 * Escape single quotes for OData filter values
 */
export function escapeOData(value: string): string {
	return value.replace(/'/g, "''");
}

/**
 * Parse API response to ensure it's always an array
 */
export function parseArrayResponse<T>(response: unknown): T[] {
	if (Array.isArray(response)) {
		return response as T[];
	}
	if (response && typeof response === 'object' && 'uuid' in response) {
		return [response as T];
	}
	return [];
}

/**
 * Create a company (client) in ServiceM8
 */
export async function createClient(
	context: IExecuteFunctions,
	data: {
		name: string;
		is_individual: number;
		address?: string;
		address_street?: string;
		address_city?: string;
		address_state?: string;
		address_postcode?: string;
		address_country?: string;
	},
): Promise<string> {
	// Build body with only non-empty values and is_individual as string per API docs
	const body: Record<string, unknown> = {
		name: data.name,
		is_individual: String(data.is_individual),
		active: 1,
	};

	// Only include address fields if they have values
	if (data.address) body.address = data.address;
	if (data.address_street) body.address_street = data.address_street;
	if (data.address_city) body.address_city = data.address_city;
	if (data.address_state) body.address_state = data.address_state;
	if (data.address_postcode) body.address_postcode = data.address_postcode;
	if (data.address_country) body.address_country = data.address_country;

	const response = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/company.json',
		body,
		returnFullResponse: true,
	});

	const uuid = extractUuidFromResponse(response);
	if (!uuid) {
		throw new Error('Failed to get UUID from client creation response');
	}
	return uuid;
}

/**
 * Create a company contact in ServiceM8
 */
export async function createCompanyContact(
	context: IExecuteFunctions,
	data: {
		company_uuid: string;
		first: string;
		last: string;
		email?: string;
		phone?: string;
		mobile?: string;
		type?: string;
	},
): Promise<string> {
	const response = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/companycontact.json',
		body: {
			...data,
			active: 1,
			type: data.type || 'BILLING',
		},
		returnFullResponse: true,
	});

	const uuid = extractUuidFromResponse(response);
	if (!uuid) {
		throw new Error('Failed to get UUID from contact creation response');
	}
	return uuid;
}

/**
 * Create a job in ServiceM8
 */
export async function createJob(
	context: IExecuteFunctions,
	data: {
		company_uuid: string;
		status: string;
		job_address?: string;
		billing_address?: string;
		job_description?: string;
	},
): Promise<{ uuid: string; jobNumber?: string }> {
	const response = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/job.json',
		body: {
			...data,
			active: 1,
		},
		returnFullResponse: true,
	});

	const uuid = extractUuidFromResponse(response);
	if (!uuid) {
		throw new Error('Failed to get UUID from job creation response');
	}

	return { uuid };
}

/**
 * Create a job contact in ServiceM8
 */
export async function createJobContact(
	context: IExecuteFunctions,
	data: {
		job_uuid: string;
		first: string;
		last: string;
		email?: string;
		phone?: string;
		mobile?: string;
		is_primary_contact?: boolean;
	},
): Promise<string> {
	const response = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/jobcontact.json',
		body: {
			...data,
			active: 1,
			type: 'JOB',
			is_primary_contact: data.is_primary_contact ?? true,
		},
		returnFullResponse: true,
	});

	const uuid = extractUuidFromResponse(response);
	if (!uuid) {
		throw new Error('Failed to get UUID from job contact creation response');
	}
	return uuid;
}

/**
 * Update a job (for category assignment)
 */
export async function updateJob(
	context: IExecuteFunctions,
	jobUuid: string,
	data: Record<string, unknown>,
): Promise<void> {
	await serviceM8Request(context, {
		method: 'POST',
		endpoint: `/api_1.0/job/${jobUuid}.json`,
		body: data,
	});
}

/**
 * Assign badges to a job by updating the job's badges field
 * The badges field is a JSON array string of badge UUIDs
 */
export async function assignBadgesToJob(
	context: IExecuteFunctions,
	jobUuid: string,
	badgeUuids: string[],
): Promise<void> {
	// ServiceM8 stores badges as a JSON array string in the job record
	const badgesJson = JSON.stringify(badgeUuids);
	await serviceM8Request(context, {
		method: 'POST',
		endpoint: `/api_1.0/job/${jobUuid}.json`,
		body: {
			badges: badgesJson,
		},
	});
}

/**
 * Assign a job to a queue by updating the job's queue_uuid field
 */
export async function assignJobToQueue(
	context: IExecuteFunctions,
	jobUuid: string,
	queueUuid: string,
): Promise<void> {
	await serviceM8Request(context, {
		method: 'POST',
		endpoint: `/api_1.0/job/${jobUuid}.json`,
		body: {
			queue_uuid: queueUuid,
		},
	});
}

/**
 * Send SMS notification via ServiceM8
 */
export async function sendSms(
	context: IExecuteFunctions,
	to: string,
	message: string,
	jobUuid?: string,
): Promise<void> {
	const body: Record<string, string> = {
		to,
		message,
	};
	if (jobUuid) {
		body.regardingJobUUID = jobUuid;
	}

	await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/platform_service_sms',
		body,
	});
}

export interface EmailAttachment {
	uuid: string;
	fileName: string;
}

export interface SendEmailOptions {
	to: string;
	subject: string;
	htmlBody?: string;
	textBody?: string;
	jobUuid?: string;
	attachmentUuids?: string[];
}

/**
 * Send email notification via ServiceM8
 * Supports both HTML and plain text format, plus attachments
 */
export async function sendEmail(
	context: IExecuteFunctions,
	options: SendEmailOptions,
): Promise<void> {
	const body: Record<string, unknown> = {
		to: options.to,
		subject: options.subject,
	};

	// Use either HTML or text body
	if (options.htmlBody) {
		body.htmlBody = options.htmlBody;
	} else if (options.textBody) {
		body.textBody = options.textBody;
	}

	if (options.jobUuid) {
		body.regardingJobUUID = options.jobUuid;
	}

	// Add attachments if provided (API expects 'attachments' field)
	if (options.attachmentUuids && options.attachmentUuids.length > 0) {
		body.attachments = options.attachmentUuids;
	}

	await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/platform_service_email',
		body,
	});
}

/**
 * Legacy sendEmail function for backward compatibility
 * @deprecated Use sendEmail with options object instead
 */
export async function sendEmailLegacy(
	context: IExecuteFunctions,
	to: string,
	subject: string,
	htmlBody: string,
	jobUuid?: string,
): Promise<void> {
	await sendEmail(context, {
		to,
		subject,
		htmlBody,
		jobUuid,
	});
}

/**
 * Upload binary data as a job attachment and return the UUID
 * This can be used to attach files to emails
 */
export async function uploadBinaryAsAttachment(
	context: IExecuteFunctions,
	itemIndex: number,
	jobUuid: string,
	binaryPropertyName: string,
): Promise<EmailAttachment | null> {
	try {
		const binaryData = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const buffer = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		const fileName = binaryData.fileName || 'attachment';
		const mimeType = binaryData.mimeType || 'application/octet-stream';

		// Determine file extension
		const extension = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';

		// Step 1: Create attachment metadata
		const metadataResponse = await serviceM8Request(context, {
			method: 'POST',
			endpoint: '/api_1.0/Attachment.json',
			body: {
				related_object: 'job',
				related_object_uuid: jobUuid,
				attachment_name: fileName,
				file_type: extension,
				active: 1,
			},
			returnFullResponse: true,
		});

		const attachmentUuid = extractUuidFromResponse(metadataResponse);
		if (!attachmentUuid) {
			return null;
		}

		// Step 2: Upload binary content
		await uploadAttachmentBinary(context, attachmentUuid, buffer, fileName, mimeType);

		return { uuid: attachmentUuid, fileName };
	} catch {
		return null;
	}
}

/**
 * Delete a job contact
 */
export async function deleteJobContact(
	context: IExecuteFunctions,
	contactUuid: string,
): Promise<void> {
	await serviceM8Request(context, {
		method: 'DELETE',
		endpoint: `/api_1.0/jobcontact/${contactUuid}.json`,
	});
}

/**
 * Get job details
 */
export async function getJob(
	context: IExecuteFunctions,
	jobUuid: string,
): Promise<Record<string, unknown>> {
	const response = await serviceM8Request(context, {
		method: 'GET',
		endpoint: `/api_1.0/job/${jobUuid}.json`,
	});
	return response as Record<string, unknown>;
}

/**
 * Create a job note
 * Uses /api_1.0/note.json with related_object and related_object_uuid
 */
export async function createJobNote(
	context: IExecuteFunctions,
	jobUuid: string,
	note: string,
): Promise<string> {
	const response = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/note.json',
		body: {
			related_object: 'job',
			related_object_uuid: jobUuid,
			note,
		},
		returnFullResponse: true,
	});

	const uuid = extractUuidFromResponse(response);
	if (!uuid) {
		throw new Error('Failed to get UUID from job note creation response');
	}
	return uuid;
}

/**
 * Find badge UUID by name (case-insensitive)
 */
export function findBadgeByName(
	badges: Array<{ uuid: string; name: string }>,
	searchName: string,
): { uuid: string; name: string } | null {
	const normalized = searchName.trim().toLowerCase();
	return badges.find((b) => b.name.trim().toLowerCase() === normalized) || null;
}

/**
 * Find category UUID by name (case-insensitive)
 */
export function findCategoryByName(
	categories: Array<{ uuid: string; name: string }>,
	searchName: string,
): { uuid: string; name: string } | null {
	const normalized = searchName.trim().toLowerCase();
	return categories.find((c) => c.name.trim().toLowerCase() === normalized) || null;
}

/**
 * Find queue UUID by name (case-insensitive)
 */
export function findQueueByName(
	queues: Array<{ uuid: string; name: string }>,
	searchName: string,
): { uuid: string; name: string } | null {
	const normalized = searchName.trim().toLowerCase();
	return queues.find((q) => q.name.trim().toLowerCase() === normalized) || null;
}

/**
 * Upload binary content to an attachment
 * Uses multipart/form-data format
 */
export async function uploadAttachmentBinary(
	context: IExecuteFunctions,
	attachmentUuid: string,
	buffer: Buffer,
	fileName: string,
	mimeType: string,
): Promise<void> {
	// Create form data boundary
	const boundary = '----n8nFormBoundary' + Date.now().toString(16);

	// Build multipart form data manually
	const formParts: Buffer[] = [];

	// File field
	formParts.push(Buffer.from(`--${boundary}\r\n`));
	formParts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`));
	formParts.push(Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`));
	formParts.push(buffer);
	formParts.push(Buffer.from('\r\n'));

	// End boundary
	formParts.push(Buffer.from(`--${boundary}--\r\n`));

	const formBody = Buffer.concat(formParts);

	try {
		await context.helpers.httpRequestWithAuthentication.call(
			context,
			'serviceM8Api',
			{
				method: 'POST',
				url: `${BASE_URL}/api_1.0/Attachment/${attachmentUuid}.file`,
				headers: {
					'Content-Type': `multipart/form-data; boundary=${boundary}`,
				},
				body: formBody,
			},
		);
	} catch (error) {
		const err = error as Error;
		throw new NodeApiError(context.getNode(), { message: err.message }, {
			message: `Failed to upload attachment binary: ${fileName}`,
		});
	}
}
