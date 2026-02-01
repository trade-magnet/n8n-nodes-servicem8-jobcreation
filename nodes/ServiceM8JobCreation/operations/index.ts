/**
 * Operations Index
 * Re-exports all operations for the ServiceM8 Smart Job Creation node
 */

// Orchestrators (main entry points)
export { executeJobCreation } from './create';
export { executeJobUpdate, type JobUpdateResult } from './update';

// Shared operations
export {
	uploadAttachments,
	assignBadges,
	createNotes,
	buildSystemReportNote,
	type AttachmentMode,
	type AttachmentInput,
	type AttachmentUploadResult,
	type AttachmentsResult,
	type AttachmentsConfig,
	type BadgesAssignInput,
	type BadgesAssignResult,
	type SystemReportInput,
	type NotesCreateResult,
} from './shared';

// Create operations (for granular access)
export {
	processInput,
	lookupContact,
	checkContactExistsOnClient,
	lookupClients,
	findMatchingClientAndDetermineAction,
	createClientIfNeeded,
	createCompanyContactIfNeeded,
	createJobWithContact,
	createNewJob,
	createNewJobContact,
	cleanupEmptyJobContacts,
	assignCategory,
	assignQueue,
	sendNotifications,
	type ProcessedInput,
	type ContactLookupResult,
	type ClientLookupResult,
	type ActionResult,
	type ClientCreateInput,
	type ContactCreateInput,
	type ClientCreateResult,
	type ContactCreateResult,
	type JobCreateInput,
	type JobContactInput,
	type JobCreateResult,
	type CategoryAssignInput,
	type CategoryAssignResult,
	type QueueAssignInput,
	type QueueAssignResult,
	type NotificationRecipient,
	type NotificationsInput,
	type NotificationsResult,
} from './create';
