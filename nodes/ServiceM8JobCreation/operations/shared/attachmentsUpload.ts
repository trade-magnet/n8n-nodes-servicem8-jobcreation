/**
 * Attachment Upload Operations
 * Two-step attachment upload process for ServiceM8
 * Step 1: Create attachment metadata record
 * Step 2: Upload binary file content
 *
 * Supports three modes:
 * - allBinary: Automatically upload all binary properties from the item
 * - urlList: Download and upload from a list of URLs
 * - manual: Manually specified attachments
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import {
	serviceM8Request,
	extractUuidFromResponse,
	uploadAttachmentBinary,
} from '../../helpers/api';

export type AttachmentMode = 'allBinary' | 'urlList' | 'manual';

export interface AttachmentInput {
	sourceType: 'binary' | 'url';
	binaryPropertyName?: string;
	fileUrl?: string;
	fileName?: string;
	fileType?: string;
}

export interface AttachmentUploadResult {
	uuid: string;
	fileName: string;
}

export interface AttachmentsResult {
	attachmentsUploaded: string[];
	attachmentsFailed: string[];
	attachmentUuids: string[];
}

export interface AttachmentsConfig {
	enableAttachments: boolean;
	attachmentMode: AttachmentMode;
	attachmentUrlList: string;
	attachmentsInput: { attachment?: AttachmentInput[] };
}

/**
 * Get file extension from filename or mime type
 */
function getFileExtension(fileName: string, mimeType?: string): string {
	// Try to get extension from filename
	const parts = fileName.split('.');
	if (parts.length > 1) {
		return '.' + parts.pop()!.toLowerCase();
	}

	// Fall back to mime type mapping
	if (mimeType) {
		const mimeToExt: Record<string, string> = {
			'application/pdf': '.pdf',
			'image/jpeg': '.jpg',
			'image/png': '.png',
			'image/gif': '.gif',
			'image/webp': '.webp',
			'application/msword': '.doc',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
			'application/vnd.ms-excel': '.xls',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
			'text/plain': '.txt',
			'text/csv': '.csv',
		};
		if (mimeToExt[mimeType]) {
			return mimeToExt[mimeType];
		}
	}

	return '.bin';
}

/**
 * Upload a single binary property to a job
 */
async function uploadBinaryProperty(
	context: IExecuteFunctions,
	itemIndex: number,
	jobUuid: string,
	binaryPropertyName: string,
): Promise<AttachmentUploadResult> {
	const binaryData = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	let fileName = binaryData.fileName || `${binaryPropertyName}_${Date.now()}`;
	const mimeType = binaryData.mimeType || 'application/octet-stream';
	const fileType = getFileExtension(fileName, mimeType);

	// Ensure filename has extension
	if (!fileName.includes('.')) {
		fileName = fileName + fileType;
	}

	// Step 1: Create attachment metadata record
	const metadataResponse = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/Attachment.json',
		body: {
			related_object: 'job',
			related_object_uuid: jobUuid,
			attachment_name: fileName,
			file_type: fileType,
			active: 1,
		},
		returnFullResponse: true,
	});

	const attachmentUuid = extractUuidFromResponse(metadataResponse);
	if (!attachmentUuid) {
		throw new Error(`Failed to create attachment metadata for ${fileName}`);
	}

	// Step 2: Upload binary file content
	await uploadAttachmentBinary(context, attachmentUuid, buffer, fileName, mimeType);

	return {
		uuid: attachmentUuid,
		fileName,
	};
}

/**
 * Upload a file from URL to a job
 */
async function uploadFromUrl(
	context: IExecuteFunctions,
	jobUuid: string,
	fileUrl: string,
	customFileName?: string,
): Promise<AttachmentUploadResult> {
	// Download file from URL
	const response = await context.helpers.httpRequest({
		method: 'GET',
		url: fileUrl,
		encoding: 'arraybuffer',
	});
	const buffer = Buffer.from(response as ArrayBuffer);

	// Extract filename from URL or use provided
	let fileName: string;
	if (customFileName) {
		fileName = customFileName;
	} else {
		const urlPath = new URL(fileUrl).pathname;
		fileName = urlPath.split('/').pop() || `download_${Date.now()}`;
	}

	const mimeType = 'application/octet-stream';
	const fileType = getFileExtension(fileName, mimeType);

	// Ensure filename has extension
	if (!fileName.includes('.')) {
		fileName = fileName + fileType;
	}

	// Step 1: Create attachment metadata record
	const metadataResponse = await serviceM8Request(context, {
		method: 'POST',
		endpoint: '/api_1.0/Attachment.json',
		body: {
			related_object: 'job',
			related_object_uuid: jobUuid,
			attachment_name: fileName,
			file_type: fileType,
			active: 1,
		},
		returnFullResponse: true,
	});

	const attachmentUuid = extractUuidFromResponse(metadataResponse);
	if (!attachmentUuid) {
		throw new Error(`Failed to create attachment metadata for ${fileName}`);
	}

	// Step 2: Upload binary file content
	await uploadAttachmentBinary(context, attachmentUuid, buffer, fileName, mimeType);

	return {
		uuid: attachmentUuid,
		fileName,
	};
}

/**
 * Upload a single attachment to a job (manual mode)
 */
async function uploadManualAttachment(
	context: IExecuteFunctions,
	itemIndex: number,
	jobUuid: string,
	attachment: AttachmentInput,
): Promise<AttachmentUploadResult> {
	if (attachment.sourceType === 'binary') {
		return uploadBinaryProperty(context, itemIndex, jobUuid, attachment.binaryPropertyName || 'data');
	} else {
		return uploadFromUrl(context, jobUuid, attachment.fileUrl!, attachment.fileName);
	}
}

/**
 * Parse URL list - handles both comma-separated string and array
 */
function parseUrlList(urlListInput: string | string[]): string[] {
	if (Array.isArray(urlListInput)) {
		return urlListInput.map(u => u.trim()).filter(u => u);
	}

	if (typeof urlListInput === 'string' && urlListInput.trim()) {
		return urlListInput
			.split(',')
			.map(u => u.trim())
			.filter(u => u);
	}

	return [];
}

/**
 * Get all binary property names from an item
 */
function getAllBinaryPropertyNames(
	context: IExecuteFunctions,
	itemIndex: number,
): string[] {
	const items = context.getInputData();
	const item = items[itemIndex];

	if (!item.binary) {
		return [];
	}

	return Object.keys(item.binary);
}

/**
 * Upload attachments to a job - handles all three modes
 */
export async function uploadAttachments(
	context: IExecuteFunctions,
	itemIndex: number,
	jobUuid: string,
	config: AttachmentsConfig,
): Promise<AttachmentsResult> {
	const uploaded: string[] = [];
	const failed: string[] = [];
	const uuids: string[] = [];

	if (!config.enableAttachments) {
		return { attachmentsUploaded: uploaded, attachmentsFailed: failed, attachmentUuids: uuids };
	}

	const mode = config.attachmentMode || 'allBinary';

	if (mode === 'allBinary') {
		// Upload all binary properties from the item
		const binaryPropertyNames = getAllBinaryPropertyNames(context, itemIndex);

		if (binaryPropertyNames.length === 0) {
			return { attachmentsUploaded: uploaded, attachmentsFailed: failed, attachmentUuids: uuids };
		}

		for (const propertyName of binaryPropertyNames) {
			try {
				const result = await uploadBinaryProperty(context, itemIndex, jobUuid, propertyName);
				uploaded.push(result.fileName);
				uuids.push(result.uuid);
			} catch (error) {
				failed.push(propertyName);
			}
		}
	} else if (mode === 'urlList') {
		// Download and upload from URL list
		const urls = parseUrlList(config.attachmentUrlList);

		if (urls.length === 0) {
			return { attachmentsUploaded: uploaded, attachmentsFailed: failed, attachmentUuids: uuids };
		}

		for (const url of urls) {
			try {
				const result = await uploadFromUrl(context, jobUuid, url);
				uploaded.push(result.fileName);
				uuids.push(result.uuid);
			} catch (error) {
				failed.push(url);
			}
		}
	} else {
		// Manual mode - use the fixed collection
		const attachments = config.attachmentsInput.attachment || [];

		if (attachments.length === 0) {
			return { attachmentsUploaded: uploaded, attachmentsFailed: failed, attachmentUuids: uuids };
		}

		for (const attachment of attachments) {
			try {
				const result = await uploadManualAttachment(context, itemIndex, jobUuid, attachment);
				uploaded.push(result.fileName);
				uuids.push(result.uuid);
			} catch (error) {
				const name =
					attachment.fileName ||
					attachment.binaryPropertyName ||
					attachment.fileUrl ||
					'unknown';
				failed.push(name);
			}
		}
	}

	return {
		attachmentsUploaded: uploaded,
		attachmentsFailed: failed,
		attachmentUuids: uuids,
	};
}
