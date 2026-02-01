/**
 * Notification Operations
 * Send email/SMS notifications with support for HTML/text format and attachments
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { sendSms, sendEmail, getJob } from '../../helpers/api';

export type NotificationType = 'email' | 'sms';
export type EmailFormat = 'html' | 'text';

export interface NotificationRecipient {
	notificationType: NotificationType;
	email?: string;
	phone?: string;
	name?: string;
	emailFormat?: EmailFormat;
	subject?: string;
	htmlMessage?: string;
	textMessage?: string;
	smsMessage?: string;
	includeAttachments?: boolean;
}

export interface NotificationsInput {
	jobUuid: string;
	enableNotifications: boolean;
	notificationRecipientsInput: {
		recipient?: NotificationRecipient[];
	};
	clientName: string;
	jobAddress: string;
	jobDetails: string;
	attachmentUuids?: string[];
}

export interface NotificationsResult {
	emailsSent: number;
	smsSent: number;
}

/**
 * Replace placeholders in message templates
 */
function replacePlaceholders(
	template: string,
	values: {
		name: string;
		jobNumber: string;
		clientName: string;
		jobAddress: string;
		jobDetails: string;
	},
): string {
	return template
		.replace(/\{\{name\}\}/g, values.name)
		.replace(/\{\{jobNumber\}\}/g, values.jobNumber)
		.replace(/\{\{clientName\}\}/g, values.clientName)
		.replace(/\{\{jobAddress\}\}/g, values.jobAddress)
		.replace(/\{\{jobDetails\}\}/g, values.jobDetails);
}


/**
 * Send email notification
 */
async function sendEmailNotification(
	context: IExecuteFunctions,
	recipient: NotificationRecipient,
	jobUuid: string,
	jobNumber: string,
	clientName: string,
	jobAddress: string,
	jobDetails: string,
	attachmentUuids: string[],
): Promise<boolean> {
	const recipientEmail = recipient.email;
	if (!recipientEmail) {
		return false;
	}

	const recipientName = recipient.name || recipientEmail.split('@')[0] || 'there';
	const emailFormat = recipient.emailFormat || 'html';

	const placeholderValues = {
		name: recipientName,
		jobNumber,
		clientName,
		jobAddress,
		jobDetails,
	};

	// Build subject (always use the field value, with default if empty)
	const subjectTemplate = recipient.subject || '[SM8 NEW JOB] #{{jobNumber}} - {{clientName}}';
	const subject = replacePlaceholders(subjectTemplate, placeholderValues);

	// Build body
	let htmlBody: string | undefined;
	let textBody: string | undefined;

	if (emailFormat === 'html') {
		const htmlTemplate = recipient.htmlMessage || '<p>Hi {{name}},</p><p>A new job has been created.</p><ul><li><strong>Customer:</strong> {{clientName}}</li><li><strong>Job Address:</strong> {{jobAddress}}</li><li><strong>Job #:</strong> #{{jobNumber}}</li><li><strong>Description:</strong> {{jobDetails}}</li></ul><p>Thanks</p>';
		htmlBody = replacePlaceholders(htmlTemplate, placeholderValues);
	} else {
		const textTemplate = recipient.textMessage || 'Hi {{name}},\n\nA new job has been created.\n\nCustomer: {{clientName}}\nJob Address: {{jobAddress}}\nJob #: #{{jobNumber}}\nDescription: {{jobDetails}}\n\nThanks';
		textBody = replacePlaceholders(textTemplate, placeholderValues);
	}

	// Include attachments if enabled and available
	const emailAttachments = recipient.includeAttachments ? attachmentUuids : [];

	// Send email
	await sendEmail(context, {
		to: recipientEmail,
		subject,
		htmlBody,
		textBody,
		jobUuid,
		attachmentUuids: emailAttachments.length > 0 ? emailAttachments : undefined,
	});

	return true;
}

/**
 * Send SMS notification
 */
async function sendSmsNotification(
	context: IExecuteFunctions,
	recipient: NotificationRecipient,
	jobUuid: string,
	jobNumber: string,
	clientName: string,
	jobAddress: string,
	jobDetails: string,
): Promise<boolean> {
	const recipientPhone = recipient.phone;
	if (!recipientPhone) {
		return false;
	}

	const recipientName = recipient.name || 'there';

	const placeholderValues = {
		name: recipientName,
		jobNumber,
		clientName,
		jobAddress,
		jobDetails,
	};

	// Build message (always use the field value, with default if empty)
	const messageTemplate = recipient.smsMessage || '[NEW JOB] #{{jobNumber}} - {{clientName}}. Check ServiceM8 for details.';
	const message = replacePlaceholders(messageTemplate, placeholderValues);

	await sendSms(context, recipientPhone, message, jobUuid);
	return true;
}

/**
 * Send notifications for a new job
 */
export async function sendNotifications(
	context: IExecuteFunctions,
	input: NotificationsInput,
): Promise<NotificationsResult> {
	if (!input.enableNotifications) {
		return { emailsSent: 0, smsSent: 0 };
	}

	const recipients = input.notificationRecipientsInput.recipient || [];
	let emailsSent = 0;
	let smsSent = 0;

	if (recipients.length === 0) {
		return { emailsSent, smsSent };
	}

	// Get job details for notification
	const jobData = await getJob(context, input.jobUuid);
	const jobNumber = (jobData.generated_job_id as string) || '';

	for (const recipient of recipients) {
		const notificationType = recipient.notificationType || 'email';

		if (notificationType === 'email') {
			const sent = await sendEmailNotification(
				context,
				recipient,
				input.jobUuid,
				jobNumber,
				input.clientName,
				input.jobAddress,
				input.jobDetails,
				input.attachmentUuids || [],
			);
			if (sent) {
				emailsSent++;
			}
		} else if (notificationType === 'sms') {
			const sent = await sendSmsNotification(
				context,
				recipient,
				input.jobUuid,
				jobNumber,
				input.clientName,
				input.jobAddress,
				input.jobDetails,
			);
			if (sent) {
				smsSent++;
			}
		}
	}

	return {
		emailsSent,
		smsSent,
	};
}
