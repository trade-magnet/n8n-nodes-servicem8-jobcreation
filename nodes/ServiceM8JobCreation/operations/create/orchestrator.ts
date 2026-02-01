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

	// 2. Look up existing contact
	const { existingContact } = await lookupContact(
		context,
		input.contactLookupFilter,
		input.contactLookupField,
	);

	// 3. Look up clients and determine action
	const allClients = await lookupClients(context, input.isIndividual);
	const actionResult = findMatchingClientAndDetermineAction(
		input.clientName,
		input.clientAddressParts,
		allClients,
		input.isBusiness,
		input.kind,
		existingContact,
	);

	// 4. Create client if needed
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
	const jobData = await getJob(context, jobUuid);
	const jobNumber = (jobData.generated_job_id as string) || '';

	// 7. Assign category
	const categoryResult = await assignCategory(context, {
		jobUuid,
		enableCategory: input.enableCategory,
		categoryDynamic: input.categoryDynamic,
		categoryUuidInput: input.categoryUuidInput,
		categoryNameInput: input.categoryNameInput,
	});

	// 8. Assign badges
	const badgesResult = await assignBadges(context, {
		jobUuid,
		enableBadges: input.enableBadges,
		badgesDynamic: input.badgesDynamic,
		badgeUuidsInput: input.badgeUuidsInput,
		badgeNamesInput: input.badgeNamesInput,
	});

	// 9. Assign queue
	const queueResult = await assignQueue(context, {
		jobUuid,
		enableQueue: input.enableQueue,
		queueDynamic: input.queueDynamic,
		queueUuidInput: input.queueUuidInput,
		queueNameInput: input.queueNameInput,
	});

	// 10. Upload attachments (before notifications so UUIDs can be included in emails)
	const attachmentsResult = await uploadAttachments(
		context,
		itemIndex,
		jobUuid,
		{
			enableAttachments: input.enableAttachments,
			attachmentMode: input.attachmentMode,
			attachmentUrlList: input.attachmentUrlList,
			attachmentsInput: input.attachmentsInput,
		},
	);

	// 11. Send notifications (with attachment UUIDs for email inclusion)
	const notificationsResult = await sendNotifications(context, {
		jobUuid,
		enableNotifications: input.enableNotifications,
		notificationRecipientsInput: input.notificationRecipientsInput,
		clientName: input.clientName,
		jobAddress: input.jobAddress,
		jobDetails: input.jobDetails,
		attachmentUuids: attachmentsResult.attachmentUuids,
	});

	// 12. Create notes
	const notesResult = await createNotes(
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
		},
		createdRecords,
	};
}
