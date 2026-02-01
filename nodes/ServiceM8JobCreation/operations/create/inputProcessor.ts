/**
 * Input Processing Operations
 * Extracts and normalizes input parameters, classifies business/person
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { AddressParts } from '../../types';
import { derivePhones } from '../../helpers/phoneUtils';
import {
	buildAddressString,
	parseAddressFromInput,
	hasAddressContent,
} from '../../helpers/addressUtils';
import { buildClientName, type NameFormat } from '../../helpers/clientMatcher';
import { escapeOData } from '../../helpers/api';

export type AttachmentMode = 'allBinary' | 'urlList' | 'manual';

export interface AttachmentInputParams {
	sourceType: 'binary' | 'url';
	binaryPropertyName?: string;
	fileUrl?: string;
	fileName?: string;
	fileType?: string;
}

export interface ProcessedInput {
	// Contact info
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	mobile: string | null;

	// Business info
	businessName: string;

	// Classification
	clientName: string;
	isBusiness: boolean;
	kind: 'business' | 'person';
	isIndividual: number;

	// Addresses
	clientAddressParts: AddressParts;
	clientAddress: string;
	jobAddressParts: AddressParts;
	jobAddress: string;

	// Job info
	jobDetails: string;
	jobStatus: string;

	// Contact lookup
	contactLookupField: 'email' | 'mobile' | 'phone' | null;
	contactLookupFilter: string | null;

	// Optional feature flags and values
	enableCategory: boolean;
	categoryDynamic: boolean;
	categoryUuidInput: string;
	categoryNameInput: string;

	enableBadges: boolean;
	badgesDynamic: boolean;
	badgeUuidsInput: string[];
	badgeNamesInput: string;

	enableQueue: boolean;
	queueDynamic: boolean;
	queueUuidInput: string;
	queueNameInput: string;

	enableNotifications: boolean;
	notificationRecipientsInput: any;

	enableAttachments: boolean;
	attachmentMode: AttachmentMode;
	attachmentUrlList: string;
	attachmentsInput: { attachment?: AttachmentInputParams[] };

	enableCustomNote: boolean;
	customNoteContent: string;

	// Additional options
	nameFormat: NameFormat;
	returnHeaders: boolean;
}

/**
 * Extract and process all input parameters for a single item
 */
export function processInput(
	context: IExecuteFunctions,
	itemIndex: number,
): ProcessedInput {
	// ========== EXTRACT BASIC PARAMETERS ==========
	const firstName = context.getNodeParameter('firstName', itemIndex, '') as string;
	const lastName = context.getNodeParameter('lastName', itemIndex, '') as string;
	const email = (context.getNodeParameter('email', itemIndex, '') as string).trim().toLowerCase();
	const inputPhone = context.getNodeParameter('phone', itemIndex, '') as string;
	const inputMobile = context.getNodeParameter('mobile', itemIndex, '') as string;
	const businessName = context.getNodeParameter('businessName', itemIndex, '') as string;
	const clientAddressInput = context.getNodeParameter('clientAddress', itemIndex, {}) as any;
	const jobAddressSameAsClient = context.getNodeParameter('jobAddressSameAsClient', itemIndex, true) as boolean;
	const jobAddressInput = context.getNodeParameter('jobAddress', itemIndex, {}) as any;
	const jobDetails = context.getNodeParameter('jobDetails', itemIndex, '') as string;
	const jobStatus = context.getNodeParameter('jobStatus', itemIndex, 'Quote') as string;

	// ========== OPTIONAL FEATURES ==========
	const enableCategory = context.getNodeParameter('enableCategory', itemIndex, false) as boolean;
	const categoryDynamic = enableCategory
		? (context.getNodeParameter('categoryDynamic', itemIndex, false) as boolean)
		: false;
	const categoryUuidInput = enableCategory && !categoryDynamic
		? (context.getNodeParameter('category', itemIndex, '') as string)
		: '';
	const categoryNameInput = enableCategory && categoryDynamic
		? (context.getNodeParameter('categoryName', itemIndex, '') as string)
		: '';

	const enableBadges = context.getNodeParameter('enableBadges', itemIndex, false) as boolean;
	const badgesDynamic = enableBadges
		? (context.getNodeParameter('badgesDynamic', itemIndex, false) as boolean)
		: false;
	const badgeUuidsInput = enableBadges && !badgesDynamic
		? (context.getNodeParameter('badges', itemIndex, []) as string[])
		: [];
	const badgeNamesInput = enableBadges && badgesDynamic
		? (context.getNodeParameter('badgeNames', itemIndex, '') as string)
		: '';

	const enableQueue = context.getNodeParameter('enableQueue', itemIndex, false) as boolean;
	const queueDynamic = enableQueue
		? (context.getNodeParameter('queueDynamic', itemIndex, false) as boolean)
		: false;
	const queueUuidInput = enableQueue && !queueDynamic
		? (context.getNodeParameter('queue', itemIndex, '') as string)
		: '';
	const queueNameInput = enableQueue && queueDynamic
		? (context.getNodeParameter('queueName', itemIndex, '') as string)
		: '';

	const enableNotifications = context.getNodeParameter('enableNotifications', itemIndex, false) as boolean;
	const notificationRecipientsInput = context.getNodeParameter('notificationRecipients', itemIndex, {}) as any;

	const enableAttachments = context.getNodeParameter('enableAttachments', itemIndex, false) as boolean;
	const attachmentMode = enableAttachments
		? (context.getNodeParameter('attachmentMode', itemIndex, 'allBinary') as AttachmentMode)
		: 'allBinary';
	const attachmentUrlList = enableAttachments && attachmentMode === 'urlList'
		? (context.getNodeParameter('attachmentUrlList', itemIndex, '') as string)
		: '';
	const attachmentsInput = enableAttachments && attachmentMode === 'manual'
		? (context.getNodeParameter('attachments', itemIndex, {}) as { attachment?: AttachmentInputParams[] })
		: {};

	const enableCustomNote = context.getNodeParameter('enableCustomNote', itemIndex, false) as boolean;
	const customNoteContent = enableCustomNote
		? (context.getNodeParameter('customNoteContent', itemIndex, '') as string)
		: '';

	// ========== ADDITIONAL OPTIONS ==========
	const additionalOptions = context.getNodeParameter('additionalOptions', itemIndex, {}) as {
		nameFormat?: NameFormat;
		returnHeaders?: boolean;
	};
	const nameFormat = additionalOptions.nameFormat ?? 'firstLast';
	const returnHeaders = additionalOptions.returnHeaders ?? false;

	// ========== VALIDATE REQUIRED FIELDS ==========
	// First name is required (unless business name is provided)
	const trimmedFirstName = firstName.trim();
	const trimmedBusinessName = businessName.trim();

	if (!trimmedFirstName && !trimmedBusinessName) {
		throw new Error('First Name is required (or provide a Business Name for business clients)');
	}

	// At least one contact method is required for deduplication
	const hasContactMethod = email.trim() || inputPhone.trim() || inputMobile.trim();
	if (!hasContactMethod) {
		throw new Error('At least one contact method is required (Email, Phone, or Mobile) for contact deduplication');
	}

	// ========== NORMALIZE PHONES ==========
	const { mobile, phone } = derivePhones(inputPhone, inputMobile);

	// ========== PROCESS ADDRESSES ==========
	const clientAddressParts = parseAddressFromInput(clientAddressInput);
	const clientAddress = buildAddressString(clientAddressParts);

	let jobAddressParts = clientAddressParts;
	let jobAddress = clientAddress;
	if (!jobAddressSameAsClient) {
		jobAddressParts = parseAddressFromInput(jobAddressInput);
		if (hasAddressContent(jobAddressParts)) {
			jobAddress = buildAddressString(jobAddressParts);
		}
	}

	// ========== CLASSIFY BUSINESS/PERSON ==========
	const { name: clientName, isBusiness } = buildClientName(
		firstName,
		lastName,
		businessName,
		email,
		nameFormat,
	);
	const kind = isBusiness ? 'business' : 'person';
	const isIndividual = isBusiness ? 0 : 1;

	// ========== DETERMINE CONTACT LOOKUP ==========
	let contactLookupField: 'email' | 'mobile' | 'phone' | null = null;
	let contactLookupFilter: string | null = null;

	if (email) {
		contactLookupField = 'email';
		contactLookupFilter = `active eq 1 and email eq '${escapeOData(email)}'`;
	} else if (mobile) {
		contactLookupField = 'mobile';
		contactLookupFilter = `active eq 1 and mobile eq '${escapeOData(mobile)}'`;
	} else if (phone) {
		contactLookupField = 'phone';
		contactLookupFilter = `active eq 1 and phone eq '${escapeOData(phone)}'`;
	}

	return {
		// Contact info
		firstName,
		lastName,
		email,
		phone,
		mobile,

		// Business info
		businessName,

		// Classification
		clientName,
		isBusiness,
		kind,
		isIndividual,

		// Addresses
		clientAddressParts,
		clientAddress,
		jobAddressParts,
		jobAddress,

		// Job info
		jobDetails,
		jobStatus,

		// Contact lookup
		contactLookupField,
		contactLookupFilter,

		// Optional features
		enableCategory,
		categoryDynamic,
		categoryUuidInput,
		categoryNameInput,

		enableBadges,
		badgesDynamic,
		badgeUuidsInput,
		badgeNamesInput,

		enableQueue,
		queueDynamic,
		queueUuidInput,
		queueNameInput,

		enableNotifications,
		notificationRecipientsInput,

		enableAttachments,
		attachmentMode,
		attachmentUrlList,
		attachmentsInput,

		enableCustomNote,
		customNoteContent,

		// Additional options
		nameFormat,
		returnHeaders,
	};
}
