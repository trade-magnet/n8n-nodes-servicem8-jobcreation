/**
 * Shared Operations Index
 * Operations used by both Create and Update
 */

export {
	uploadAttachments,
	type AttachmentMode,
	type AttachmentInput,
	type AttachmentUploadResult,
	type AttachmentsResult,
	type AttachmentsConfig,
} from './attachmentsUpload';

export {
	assignBadges,
	type BadgesAssignInput,
	type BadgesAssignResult,
} from './badgesAssign';

export {
	buildSystemReportNote,
	createNotes,
	type SystemReportInput,
	type NotesCreateResult,
} from './notesCreate';
