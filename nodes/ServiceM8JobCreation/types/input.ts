/**
 * Input and Processing Types
 */

import type { ServiceM8Client, ServiceM8Contact } from './api';

// ============= Basic Input Types =============

export interface ContactInput {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	mobile: string;
}

export interface AddressParts {
	street: string;
	city: string;
	state: string;
	postcode: string;
	country: string;
}

export interface JobInput {
	details: string;
	status: string;
}

export interface NotificationRecipient {
	email: string;
	phone?: string;
	name?: string;
}

// ============= Attachment Types =============

export type AttachmentMode = 'allBinary' | 'urlList' | 'manual';

export interface AttachmentInputParams {
	sourceType: 'binary' | 'url';
	binaryPropertyName?: string;
	fileUrl?: string;
	fileName?: string;
	fileType?: string;
}

// ============= Matching Types =============

export type NameMatchResult = 'exact' | 'partial' | 'none';
export type AddressMatchResult = 'exact' | 'near' | 'none';

export interface MatchResult {
	name: NameMatchResult;
	address: AddressMatchResult;
}

export interface ClientMatchResult {
	client: ServiceM8Client | null;
	matchType: MatchResult;
	reason: string;
}

// ============= Processing Types =============

export interface ClassifiedInput {
	// Classification
	kind: 'business' | 'person';
	isBusiness: boolean;
	isIndividual: number;

	// Contact info (normalized)
	email: string;
	firstName: string;
	lastName: string;
	phone: string | null;
	mobile: string | null;

	// Contact lookup
	hasContactIdentifier: boolean;
	contactLookupField: 'email' | 'mobile' | 'phone' | null;
	contactLookupValue: string | null;
	contactLookupFilter: string | null;

	// Client info
	clientName: string;
	businessName: string | null;

	// Addresses
	clientAddress: string;
	clientAddressParts: AddressParts;
	jobAddress: string;

	// Job info
	jobDetails: string;
	jobStatus: string;
}

export interface ActionDecision {
	action: 'create_client_and_contact' | 'create_contact_and_job' | 'create_job_only';
	reason: string;
	needsClient: boolean;
	needsContact: boolean;
	existingContact: ServiceM8Contact | null;
	existingClient: ServiceM8Client | null;
	matchType: MatchResult;
	clientUuid: string | null;
}

// ============= Processed Input (from node parameters) =============

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
	notificationRecipientsInput: unknown;

	enableAttachments: boolean;
	attachmentMode: AttachmentMode;
	attachmentUrlList: string;
	attachmentsInput: { attachment?: AttachmentInputParams[] };

	enableCustomNote: boolean;
	customNoteContent: string;
}
