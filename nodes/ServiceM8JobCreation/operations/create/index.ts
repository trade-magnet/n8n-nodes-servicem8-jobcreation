/**
 * Create Job Operations Index
 */

// Orchestrator (main entry point)
export { executeJobCreation } from './orchestrator';

// Input processing
export {
	processInput,
	type ProcessedInput,
	type AttachmentMode,
	type AttachmentInputParams,
} from './inputProcessor';

// Contact operations
export {
	lookupContact,
	checkContactExistsOnClient,
	type ContactLookupResult,
} from './contactLookup';

// Client operations
export {
	lookupClients,
	findMatchingClientAndDetermineAction,
	type ClientLookupResult,
	type ActionResult,
} from './clientLookup';

// Client/Contact creation
export {
	createClientIfNeeded,
	createCompanyContactIfNeeded,
	type ClientCreateInput,
	type ContactCreateInput,
	type ClientCreateResult,
	type ContactCreateResult,
} from './clientCreate';

// Job creation
export {
	createNewJob,
	createNewJobContact,
	cleanupEmptyJobContacts,
	createJobWithContact,
	type JobCreateInput,
	type JobContactInput,
	type JobCreateResult,
} from './jobCreate';

// Category assignment
export {
	assignCategory,
	type CategoryAssignInput,
	type CategoryAssignResult,
} from './categoryAssign';

// Queue assignment
export {
	assignQueue,
	type QueueAssignInput,
	type QueueAssignResult,
} from './queueAssign';

// Notifications
export {
	sendNotifications,
	type NotificationRecipient,
	type NotificationsInput,
	type NotificationsResult,
} from './notifications';
