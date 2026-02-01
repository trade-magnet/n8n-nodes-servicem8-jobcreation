/**
 * Job Update Orchestrator
 * Coordinates all operations for updating an existing ServiceM8 job
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ServiceM8Job, JobUpdateResult, CreatedRecordsUpdate } from '../../types';
import { createEmptyCreatedRecordsUpdate } from '../../types';
import { serviceM8Request, parseArrayResponse, escapeOData, extractUuidFromResponse } from '../../helpers/api';
import { assignBadges } from '../shared/badgesAssign';
import { uploadAttachments, type AttachmentMode } from '../shared/attachmentsUpload';

/**
 * Look up a job by its generated job ID (job number)
 */
async function lookupJobByNumber(
	context: IExecuteFunctions,
	jobNumber: string,
): Promise<ServiceM8Job | null> {
	const filter = `active eq 1 and generated_job_id eq '${escapeOData(jobNumber)}'`;
	const response = await serviceM8Request(context, {
		method: 'GET',
		endpoint: '/api_1.0/job.json',
		query: { $filter: filter },
	});

	const jobs = parseArrayResponse<ServiceM8Job>(response);
	return jobs.length > 0 ? jobs[0] : null;
}

/**
 * Get job details by UUID
 */
async function getJobByUuid(
	context: IExecuteFunctions,
	jobUuid: string,
): Promise<ServiceM8Job | null> {
	try {
		const response = await serviceM8Request(context, {
			method: 'GET',
			endpoint: `/api_1.0/job/${jobUuid}.json`,
		});
		return response as ServiceM8Job;
	} catch {
		return null;
	}
}

/**
 * Update job fields
 */
async function updateJobFields(
	context: IExecuteFunctions,
	jobUuid: string,
	fields: Record<string, unknown>,
): Promise<string[]> {
	const updatedFields: string[] = [];

	if (Object.keys(fields).length === 0) {
		return updatedFields;
	}

	await serviceM8Request(context, {
		method: 'POST',
		endpoint: `/api_1.0/job/${jobUuid}.json`,
		body: fields,
	});

	return Object.keys(fields);
}

/**
 * Add a note to a job
 */
async function addNoteToJob(
	context: IExecuteFunctions,
	jobUuid: string,
	noteContent: string,
): Promise<{ added: boolean; uuid: string }> {
	if (!noteContent.trim()) {
		return { added: false, uuid: '' };
	}

	const response = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/note.json',
		body: {
			related_object: 'job',
			related_object_uuid: jobUuid,
			note: noteContent,
			active: 1,
		},
		returnFullResponse: true,
	});

	const uuid = extractUuidFromResponse(response) ?? '';
	return { added: true, uuid };
}

/**
 * Build the system report note for job update
 */
function buildUpdateReportNote(input: {
	jobNumber: string;
	fieldsUpdated: string[];
	badgesAssigned: string[];
	badgesMissing: string[];
	attachmentsUploaded: string[];
	attachmentsFailed: string[];
	noteAdded: boolean;
}): string {
	const reportLines: string[] = [];

	reportLines.push('📝 JOB UPDATE REPORT');
	reportLines.push('─'.repeat(30));
	reportLines.push(`Job #${input.jobNumber}`);
	reportLines.push('');

	// Fields updated
	if (input.fieldsUpdated.length > 0) {
		reportLines.push(`✅ Fields updated: ${input.fieldsUpdated.join(', ')}`);
	}

	// Badges status
	if (input.badgesAssigned.length > 0) {
		reportLines.push(`✅ Badges added: ${input.badgesAssigned.join(', ')}`);
	}
	if (input.badgesMissing.length > 0) {
		reportLines.push(`⚠️ Badges not found: ${input.badgesMissing.join(', ')}`);
	}

	// Attachments status
	if (input.attachmentsUploaded.length > 0) {
		reportLines.push(`✅ Attachments: ${input.attachmentsUploaded.join(', ')}`);
	}
	if (input.attachmentsFailed.length > 0) {
		reportLines.push(`⚠️ Attachments failed: ${input.attachmentsFailed.join(', ')}`);
	}

	// Custom note status
	if (input.noteAdded) {
		reportLines.push('✅ Custom note added');
	}

	// Branding footer
	reportLines.push('');
	reportLines.push('─'.repeat(30));
	reportLines.push('n8n ServiceM8 Smart Job Creator');
	reportLines.push('Updated by Trade Magnet🧲');
	reportLines.push('www.trademagnet.com.au');

	return reportLines.join('\n');
}

/**
 * Execute job update for a single item
 */
export async function executeJobUpdate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<JobUpdateResult> {
	// 1. Get the job UUID
	const jobSelectionMode = context.getNodeParameter('jobSelectionMode', itemIndex, 'dropdown') as string;
	let jobUuid: string;
	let jobNumber: string;

	if (jobSelectionMode === 'dropdown') {
		jobUuid = context.getNodeParameter('jobUuid', itemIndex, '') as string;
		if (!jobUuid) {
			throw new Error('No job selected. Please select a job from the dropdown.');
		}
		// Look up job to get job number
		const job = await getJobByUuid(context, jobUuid);
		if (!job) {
			throw new Error(`Job with UUID ${jobUuid} not found`);
		}
		jobNumber = job.generated_job_id;
	} else {
		jobNumber = context.getNodeParameter('jobNumber', itemIndex, '') as string;
		if (!jobNumber) {
			throw new Error('No job number provided. Please enter a job number.');
		}
		// Look up job by number
		const job = await lookupJobByNumber(context, jobNumber);
		if (!job) {
			throw new Error(`Job with number ${jobNumber} not found`);
		}
		jobUuid = job.uuid;
	}

	// 2. Update job fields if provided
	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as Record<string, unknown>;
	const fieldsUpdated = await updateJobFields(context, jobUuid, updateFields);

	// 3. Add badges if enabled
	let badgesAssigned: string[] = [];
	let badgesMissing: string[] = [];
	const enableBadges = context.getNodeParameter('updateEnableBadges', itemIndex, false) as boolean;
	if (enableBadges) {
		const badgeUuids = context.getNodeParameter('updateBadges', itemIndex, []) as string[];
		if (badgeUuids.length > 0) {
			const badgesResult = await assignBadges(context, {
				jobUuid,
				enableBadges: true,
				badgesDynamic: false,
				badgeUuidsInput: badgeUuids,
				badgeNamesInput: '',
			});
			badgesAssigned = badgesResult.badgesAssigned;
			badgesMissing = badgesResult.badgesMissing;
		}
	}

	// 4. Upload attachments if enabled
	let attachmentsUploaded: string[] = [];
	let attachmentsFailed: string[] = [];
	let attachmentUuids: string[] = [];
	const enableAttachments = context.getNodeParameter('updateEnableAttachments', itemIndex, false) as boolean;
	if (enableAttachments) {
		const attachmentMode = context.getNodeParameter('updateAttachmentMode', itemIndex, 'allBinary') as AttachmentMode;
		const attachmentUrlList = attachmentMode === 'urlList'
			? (context.getNodeParameter('updateAttachmentUrlList', itemIndex, '') as string)
			: '';

		const attachmentsResult = await uploadAttachments(context, itemIndex, jobUuid, {
			enableAttachments: true,
			attachmentMode,
			attachmentUrlList,
			attachmentsInput: {},
		});
		attachmentsUploaded = attachmentsResult.attachmentsUploaded;
		attachmentsFailed = attachmentsResult.attachmentsFailed;
		attachmentUuids = attachmentsResult.attachmentUuids;
	}

	// 5. Add custom note if enabled
	let noteAdded = false;
	let customNoteUuid = '';
	const enableNote = context.getNodeParameter('updateEnableNote', itemIndex, false) as boolean;
	if (enableNote) {
		const noteContent = context.getNodeParameter('updateNoteContent', itemIndex, '') as string;
		const noteResult = await addNoteToJob(context, jobUuid, noteContent);
		noteAdded = noteResult.added;
		customNoteUuid = noteResult.uuid;
	}

	// 6. Create system report note
	const systemReportContent = buildUpdateReportNote({
		jobNumber,
		fieldsUpdated,
		badgesAssigned,
		badgesMissing,
		attachmentsUploaded,
		attachmentsFailed,
		noteAdded,
	});
	const systemNoteResult = await addNoteToJob(context, jobUuid, systemReportContent);
	const systemNoteUuid = systemNoteResult.uuid;

	// 7. Get additional options
	const additionalOptions = context.getNodeParameter('updateAdditionalOptions', itemIndex, {}) as {
		returnHeaders?: boolean;
	};
	const returnHeaders = additionalOptions.returnHeaders ?? false;

	// Build createdRecords (only populated when returnHeaders is true)
	let createdRecords: CreatedRecordsUpdate = createEmptyCreatedRecordsUpdate();
	if (returnHeaders) {
		createdRecords = {
			systemNoteUuid,
			customNoteUuid,
			attachmentUuids,
		};
	}

	return {
		success: true,
		error: '',
		jobUuid,
		jobNumber,
		fieldsUpdated,
		badgesAssigned,
		badgesMissing,
		attachmentsUploaded,
		attachmentsFailed,
		noteAdded,
		createdRecords,
	};
}
