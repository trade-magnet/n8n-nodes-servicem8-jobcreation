/**
 * Execution Result Types
 * Fixed schemas - all fields always present
 */

// ============= Created Records (Headers) =============

export interface CreatedRecords {
	clientUuid: string;
	companyContactUuid: string;
	jobUuid: string;
	jobContactUuid: string;
	systemNoteUuid: string;
	customNoteUuid: string;
	attachmentUuids: string[];
}

export interface CreatedRecordsUpdate {
	systemNoteUuid: string;
	customNoteUuid: string;
	attachmentUuids: string[];
}

// ============= Create Job Results =============

export interface ExecutionSummary {
	clientCreated: boolean;
	contactCreated: boolean;
	categoryAssigned: boolean;
	categoryName: string;
	categoryMissing: string;
	badgesAssigned: string[];
	badgesMissing: string[];
	queueAssigned: boolean;
	queueName: string;
	queueMissing: string;
	notificationsSent: {
		email: number;
		sms: number;
	};
	attachmentsUploaded: string[];
	attachmentsFailed: string[];
	noteAdded: boolean;
	customNoteAdded: boolean;
}

export interface ExecutionDebug {
	classification: string;
	contactLookupField: string;
	matchType: {
		name: string;
		address: string;
	};
	reason: string;
	clientsChecked: number;
	executionTimeMs: number;
	// Debug: address data received
	clientAddressParts?: {
		street: string;
		city: string;
		state: string;
		postcode: string;
		country: string;
	};
	clientAddress?: string;
}

export interface ExecutionResult {
	success: boolean;
	error: string;
	jobUuid: string;
	jobNumber: string;
	clientUuid: string;
	action: string;
	summary: ExecutionSummary;
	debug: ExecutionDebug;
	createdRecords: CreatedRecords;
}

// ============= Update Job Results =============

export interface JobUpdateResult {
	success: boolean;
	error: string;
	jobUuid: string;
	jobNumber: string;
	fieldsUpdated: string[];
	badgesAssigned: string[];
	badgesMissing: string[];
	attachmentsUploaded: string[];
	attachmentsFailed: string[];
	noteAdded: boolean;
	createdRecords: CreatedRecordsUpdate;
}

// ============= Default/Empty Result Factories =============

export function createEmptyCreatedRecords(): CreatedRecords {
	return {
		clientUuid: '',
		companyContactUuid: '',
		jobUuid: '',
		jobContactUuid: '',
		systemNoteUuid: '',
		customNoteUuid: '',
		attachmentUuids: [],
	};
}

export function createEmptyCreatedRecordsUpdate(): CreatedRecordsUpdate {
	return {
		systemNoteUuid: '',
		customNoteUuid: '',
		attachmentUuids: [],
	};
}

export function createEmptySummary(): ExecutionSummary {
	return {
		clientCreated: false,
		contactCreated: false,
		categoryAssigned: false,
		categoryName: '',
		categoryMissing: '',
		badgesAssigned: [],
		badgesMissing: [],
		queueAssigned: false,
		queueName: '',
		queueMissing: '',
		notificationsSent: {
			email: 0,
			sms: 0,
		},
		attachmentsUploaded: [],
		attachmentsFailed: [],
		noteAdded: false,
		customNoteAdded: false,
	};
}

export function createEmptyDebug(): ExecutionDebug {
	return {
		classification: '',
		contactLookupField: '',
		matchType: {
			name: '',
			address: '',
		},
		reason: '',
		clientsChecked: 0,
		executionTimeMs: 0,
	};
}

export function createEmptyExecutionResult(): ExecutionResult {
	return {
		success: false,
		error: '',
		jobUuid: '',
		jobNumber: '',
		clientUuid: '',
		action: '',
		summary: createEmptySummary(),
		debug: createEmptyDebug(),
		createdRecords: createEmptyCreatedRecords(),
	};
}

export function createEmptyUpdateResult(): JobUpdateResult {
	return {
		success: false,
		error: '',
		jobUuid: '',
		jobNumber: '',
		fieldsUpdated: [],
		badgesAssigned: [],
		badgesMissing: [],
		attachmentsUploaded: [],
		attachmentsFailed: [],
		noteAdded: false,
		createdRecords: createEmptyCreatedRecordsUpdate(),
	};
}
