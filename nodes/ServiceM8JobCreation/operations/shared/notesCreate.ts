/**
 * Notes Creation Operations
 * Create system report and custom notes
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { createJobNote } from '../../helpers/api';

export interface SystemReportInput {
	jobUuid: string;
	clientCreated: boolean;
	contactCreated: boolean;
	matchReason: string;

	// Category
	enableCategory: boolean;
	categoryAssigned: boolean;
	categoryName?: string;
	categoryMissing?: string;

	// Badges
	enableBadges: boolean;
	badgesAssigned: string[];
	badgesMissing: string[];

	// Queue
	enableQueue: boolean;
	queueAssigned: boolean;
	queueName?: string;
	queueMissing?: string;

	// Notifications
	enableNotifications: boolean;
	emailsSent: number;
	smsSent: number;

	// Attachments
	enableAttachments: boolean;
	attachmentsUploaded: string[];
	attachmentsFailed: string[];
}

export interface NotesCreateResult {
	systemNoteAdded: boolean;
	customNoteAdded: boolean;
	systemNoteUuid: string;
	customNoteUuid: string;
}

/**
 * Build the system report note content
 */
export function buildSystemReportNote(input: SystemReportInput): string {
	const reportLines: string[] = [];

	reportLines.push('📋 JOB CREATION REPORT');
	reportLines.push('─'.repeat(30));
	reportLines.push('');

	// Client/Contact status
	if (input.clientCreated) {
		reportLines.push('✅ New client created');
	} else {
		reportLines.push(`✅ Matched existing client: ${input.matchReason}`);
	}

	if (input.contactCreated) {
		reportLines.push('✅ New contact created');
	} else {
		reportLines.push('✅ Using existing contact');
	}

	// Category status
	if (input.enableCategory) {
		if (input.categoryAssigned && input.categoryName) {
			reportLines.push(`✅ Category: ${input.categoryName}`);
		} else if (input.categoryMissing) {
			reportLines.push(`⚠️ Category not found: "${input.categoryMissing}"`);
		}
	}

	// Badges status
	if (input.enableBadges) {
		if (input.badgesAssigned.length > 0) {
			reportLines.push(`✅ Badges: ${input.badgesAssigned.join(', ')}`);
		}
		if (input.badgesMissing.length > 0) {
			reportLines.push(`⚠️ Badges not found: ${input.badgesMissing.join(', ')}`);
		}
	}

	// Queue status
	if (input.enableQueue) {
		if (input.queueAssigned && input.queueName) {
			reportLines.push(`✅ Queue: ${input.queueName}`);
		} else if (input.queueMissing) {
			reportLines.push(`⚠️ Queue not found: "${input.queueMissing}"`);
		}
	}

	// Notifications status
	if (input.enableNotifications) {
		if (input.emailsSent > 0 || input.smsSent > 0) {
			reportLines.push(`✅ Notifications: ${input.emailsSent} email(s), ${input.smsSent} SMS`);
		}
	}

	// Attachments status
	if (input.enableAttachments) {
		if (input.attachmentsUploaded.length > 0) {
			reportLines.push(`✅ Attachments: ${input.attachmentsUploaded.join(', ')}`);
		}
		if (input.attachmentsFailed.length > 0) {
			reportLines.push(`⚠️ Attachments failed: ${input.attachmentsFailed.join(', ')}`);
		}
	}

	// Branding footer
	reportLines.push('');
	reportLines.push('─'.repeat(30));
	reportLines.push('n8n ServiceM8 Smart Job Creator');
	reportLines.push('Created by Trade Magnet🧲');
	reportLines.push('www.trademagnet.com.au');

	return reportLines.join('\n');
}

/**
 * Create the system report note and optional custom note
 */
export async function createNotes(
	context: IExecuteFunctions,
	jobUuid: string,
	systemReportInput: SystemReportInput,
	enableCustomNote: boolean,
	customNoteContent: string,
): Promise<NotesCreateResult> {
	// Create system report note
	const systemReportNote = buildSystemReportNote(systemReportInput);
	const systemNoteUuid = await createJobNote(context, jobUuid, systemReportNote);

	// Create custom note if enabled
	let customNoteAdded = false;
	let customNoteUuid = '';
	if (enableCustomNote && customNoteContent) {
		customNoteUuid = await createJobNote(context, jobUuid, customNoteContent);
		customNoteAdded = true;
	}

	return {
		systemNoteAdded: true,
		customNoteAdded,
		systemNoteUuid,
		customNoteUuid,
	};
}
