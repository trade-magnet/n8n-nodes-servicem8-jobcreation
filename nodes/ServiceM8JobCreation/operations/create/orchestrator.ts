/**
 * Job Creation Orchestrator
 * Coordinates all operations for creating a ServiceM8 job
 * This is the main execution flow extracted from the node execute method
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ExecutionResult, ExecutionSummary, CreatedRecords } from '../../types';
import { createEmptyCreatedRecords } from '../../types';
import { getJob } from '../../helpers/api';

import { processInput } from './inputProcessor';
import { lookupContact } from './contactLookup';
import { lookupClients, findMatchingClientAndDetermineAction } from './clientLookup';
import { createClientIfNeeded, createCompanyContactIfNeeded } from './clientCreate';
import { createJobWithContact } from './jobCreate';
import { assignCategory } from './categoryAssign';
import { assignQueue } from './queueAssign';
import { sendNotifications } from './notifications';
import { assignBadges } from '../shared/badgesAssign';
import { uploadAttachments } from '../shared/attachmentsUpload';
import { createNotes } from '../shared/notesCreate';

/**
 * Execute job creation for a single item
 * This orchestrates all the operations in sequence
 */
export async function executeJobCreation(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<ExecutionResult> {
	const startTime = Date.now();

	// 1. Process input parameters
	const input = processInput(context, itemIndex);

	// 2. Look up existing contacts (all matching, not just first)
	const { existingContact, allMatchingContacts } = await lookupContact(
		context,
		{
			email: input.email || null,
			mobile: input.mobile,
			phone: input.phone,
		},
	);

	// 3. Look up clients and determine action (name-based matching only)
	const allClients = await lookupClients(context);
	const actionResult = findMatchingClientAndDetermineAction(
		input.clientName,
		allClients,
		input.isBusiness,
		input.kind,
		existingContact,
		allMatchingContacts,
	);

	// 4. Create client if needed (with name suffix for conflicts)
	const clientResult = await createClientIfNeeded(
		context,
		actionResult.needsClient,
		actionResult.clientUuid,
		{
			clientName: input.clientName,
			isIndividual: input.isIndividual,
			clientAddress: input.clientAddress,
			clientAddressParts: input.clientAddressParts,
		},
		actionResult.needsNameSuffix,
		allClients,
		input.kind === 'person' ? allMatchingContacts : [],
	);

	if (!clientResult.clientUuid) {
		throw new Error('Failed to determine or create client UUID');
	}

	// 5. Create company contact if needed
	const contactResult = await createCompanyContactIfNeeded(
		context,
		actionResult.needsContact,
		clientResult.clientUuid,
		input.contactLookupField,
		{
			companyUuid: clientResult.clientUuid,
			firstName: input.firstName,
			lastName: input.lastName,
			email: input.email || undefined,
			phone: input.phone,
			mobile: input.mobile,
		},
	);

	// 6. Create job with contact
	const { jobUuid, jobContactUuid } = await createJobWithContact(
		context,
		{
			clientUuid: clientResult.clientUuid,
			jobStatus: input.jobStatus,
			jobAddress: input.jobAddress,
			clientAddress: input.clientAddress,
			jobDetails: input.jobDetails,
		},
		{
			firstName: input.firstName,
			lastName: input.lastName,
			email: input.email || undefined,
			phone: input.phone,
			mobile: input.mobile,
		},
	);

	// 6b. Fetch job to get generated job number
	// Once the job exists in ServiceM8, never throw — n8n's Retry on Fail would
	// duplicate the job. Collect post-creation errors into partialFailures instead.
	const partialFailures: string[] = [];
	const runStep = async <T>(label: string, fallback: T, fn: () => Promise<T>): Promise<T> => {
		try {
			return await fn();
		} catch (err) {
			partialFailures.push(`${label}: ${(err as Error).message}`);
			return fallback;
		}
	};

	const jobData = await runStep('fetchJob', {} as Record<string, unknown>, () => getJob(context, jobUuid));
	const jobNumber = (jobData.generated_job_id as string) || '';

	// 7. Assign category
	const categoryResult = await runStep(
		'assignCategory',
		{ categoryAssigned: false, categoryName: '', categoryMissing: '' },
		() => assignCategory(context, {
			jobUuid,
			enableCategory: input.enableCategory,
			categoryDynamic: input.categoryDynamic,
			categoryUuidInput: input.categoryUuidInput,
			categoryNameInput: input.categoryNameInput,
		}),
	);

	// 8. Assign badges
	const badgesResult = await runStep(
		'assignBadges',
		{ badgesAssigned: [] as string[], badgesMissing: [] as string[] },
		() => assignBadges(context, {
			jobUuid,
			enableBadges: input.enableBadges,
			badgesDynamic: input.badgesDynamic,
			badgeUuidsInput: input.badgeUuidsInput,
			badgeNamesInput: input.badgeNamesInput,
		}),
	);

	// 9. Assign queue
	const queueResult = await runStep(
		'assignQueue',
		{ queueAssigned: false, queueName: '', queueMissing: '' },
		() => assignQueue(context, {
			jobUuid,
			enableQueue: input.enableQueue,
			queueDynamic: input.queueDynamic,
			queueUuidInput: input.queueUuidInput,
			queueNameInput: input.queueNameInput,
		}),
	);

	// 10. Upload attachments (before notifications so UUIDs can be included in emails)
	const attachmentsResult = await runStep(
		'uploadAttachments',
		{ attachmentUuids: [] as string[], attachmentsUploaded: [] as string[], attachmentsFailed: [] as string[] },
		() => uploadAttachments(
			context,
			itemIndex,
			jobUuid,
			{
				enableAttachments: input.enableAttachments,
				attachmentMode: input.attachmentMode,
				attachmentUrlList: input.attachmentUrlList,
				attachmentsInput: input.attachmentsInput,
			},
		),
	);

	// 11. Send notifications (with attachment UUIDs for email inclusion)
	const notificationsResult = await runStep(
		'sendNotifications',
		{ emailsSent: 0, smsSent: 0 },
		() => sendNotifications(context, {
			jobUuid,
			enableNotifications: input.enableNotifications,
			notificationRecipientsInput: input.notificationRecipientsInput,
			clientName: input.clientName,
			jobAddress: input.jobAddress,
			jobDetails: input.jobDetails,
			attachmentUuids: attachmentsResult.attachmentUuids,
		}),
	);

	// 12. Create notes
	const notesResult = await runStep(
		'createNotes',
		{ systemNoteAdded: false, customNoteAdded: false, systemNoteUuid: '', customNoteUuid: '' },
		() => createNotes(
			context,
			jobUuid,
			{
				jobUuid,
				clientCreated: clientResult.clientCreated,
				contactCreated: contactResult.contactCreated,
				matchReason: actionResult.matchReason,
				enableCategory: input.enableCategory,
				categoryAssigned: categoryResult.categoryAssigned,
				categoryName: categoryResult.categoryName,
				categoryMissing: categoryResult.categoryMissing,
				enableBadges: input.enableBadges,
				badgesAssigned: badgesResult.badgesAssigned,
				badgesMissing: badgesResult.badgesMissing,
				enableQueue: input.enableQueue,
				queueAssigned: queueResult.queueAssigned,
				queueName: queueResult.queueName,
				queueMissing: queueResult.queueMissing,
				enableNotifications: input.enableNotifications,
				emailsSent: notificationsResult.emailsSent,
				smsSent: notificationsResult.smsSent,
				enableAttachments: input.enableAttachments,
				attachmentsUploaded: attachmentsResult.attachmentsUploaded,
				attachmentsFailed: attachmentsResult.attachmentsFailed,
			},
			input.enableCustomNote,
			input.customNoteContent,
		),
	);

	// Build output
	const executionTimeMs = Date.now() - startTime;

	// Build createdRecords (only populated when returnHeaders is true)
	let createdRecords: CreatedRecords = createEmptyCreatedRecords();
	if (input.returnHeaders) {
		createdRecords = {
			clientUuid: clientResult.clientUuid,
			companyContactUuid: contactResult.contactUuid ?? '',
			jobUuid,
			jobContactUuid,
			systemNoteUuid: notesResult.systemNoteUuid,
			customNoteUuid: notesResult.customNoteUuid,
			attachmentUuids: attachmentsResult.attachmentUuids,
		};
	}

	const summary: ExecutionSummary = {
		clientCreated: clientResult.clientCreated,
		contactCreated: contactResult.contactCreated,
		categoryAssigned: categoryResult.categoryAssigned,
		categoryName: categoryResult.categoryName ?? '',
		categoryMissing: categoryResult.categoryMissing ?? '',
		badgesAssigned: badgesResult.badgesAssigned,
		badgesMissing: badgesResult.badgesMissing,
		queueAssigned: queueResult.queueAssigned,
		queueName: queueResult.queueName ?? '',
		queueMissing: queueResult.queueMissing ?? '',
		notificationsSent: {
			email: notificationsResult.emailsSent,
			sms: notificationsResult.smsSent,
		},
		attachmentsUploaded: attachmentsResult.attachmentsUploaded,
		attachmentsFailed: attachmentsResult.attachmentsFailed,
		noteAdded: notesResult.systemNoteAdded,
		customNoteAdded: notesResult.customNoteAdded,
	};

	return {
		success: true,
		error: '',
		jobUuid,
		jobNumber,
		clientUuid: clientResult.clientUuid,
		action: actionResult.action,
		summary,
		debug: {
			classification: input.kind,
			contactLookupField: input.contactLookupField ?? '',
			matchType: actionResult.matchType,
			reason: actionResult.reason,
			clientsChecked: actionResult.clientsChecked,
			executionTimeMs,
			// Debug: address data received
			clientAddressParts: input.clientAddressParts,
			clientAddress: input.clientAddress,
		},
		createdRecords,
		partialFailures,
	};
}
