/**
 * Job Creation Operations
 * Create job and job contact, clean up empty contacts
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ServiceM8Contact } from '../../types';
import {
	createJob,
	createJobContact,
	deleteJobContact,
	serviceM8Request,
	parseArrayResponse,
} from '../../helpers/api';

export interface JobCreateInput {
	clientUuid: string;
	jobStatus: string;
	jobAddress: string;
	clientAddress: string;
	jobDetails: string;
}

export interface JobContactInput {
	jobUuid: string;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string | null;
	mobile?: string | null;
}

export interface JobCreateResult {
	jobUuid: string;
}

/**
 * Create a new job
 */
export async function createNewJob(
	context: IExecuteFunctions,
	input: JobCreateInput,
): Promise<JobCreateResult> {
	const jobResult = await createJob(context, {
		company_uuid: input.clientUuid,
		status: input.jobStatus,
		job_address: input.jobAddress,
		billing_address: input.clientAddress,
		job_description: input.jobDetails,
	});

	return {
		jobUuid: jobResult.uuid,
	};
}

/**
 * Create a job contact
 */
export async function createNewJobContact(
	context: IExecuteFunctions,
	input: JobContactInput,
): Promise<string> {
	const contactUuid = await createJobContact(context, {
		job_uuid: input.jobUuid,
		first: input.firstName,
		last: input.lastName,
		email: input.email || undefined,
		phone: input.phone || undefined,
		mobile: input.mobile || undefined,
		is_primary_contact: true,
	});

	return contactUuid;
}

/**
 * Clean up empty auto-created job contacts
 * ServiceM8 sometimes auto-creates empty contacts when creating a job
 */
export async function cleanupEmptyJobContacts(
	context: IExecuteFunctions,
	jobUuid: string,
): Promise<number> {
	const jobContactsResponse = await serviceM8Request(context, {
		method: 'GET',
		endpoint: '/api_1.0/jobcontact.json',
		query: { $filter: `job_uuid eq '${jobUuid}'` },
	});

	const jobContacts = parseArrayResponse<ServiceM8Contact>(jobContactsResponse);
	let deletedCount = 0;

	for (const contact of jobContacts) {
		// Delete contacts that have no useful data
		if (!contact.email && !contact.phone && !contact.mobile && !contact.first && !contact.last) {
			await deleteJobContact(context, contact.uuid);
			deletedCount++;
		}
	}

	return deletedCount;
}

/**
 * Create a complete job with contact and cleanup
 */
export async function createJobWithContact(
	context: IExecuteFunctions,
	jobInput: JobCreateInput,
	contactInput: Omit<JobContactInput, 'jobUuid'>,
): Promise<{ jobUuid: string; jobContactUuid: string }> {
	// Create the job
	const { jobUuid } = await createNewJob(context, jobInput);

	// Create the job contact
	const jobContactUuid = await createNewJobContact(context, {
		...contactInput,
		jobUuid,
	});

	// Clean up any empty auto-created contacts
	await cleanupEmptyJobContacts(context, jobUuid);

	return {
		jobUuid,
		jobContactUuid,
	};
}
