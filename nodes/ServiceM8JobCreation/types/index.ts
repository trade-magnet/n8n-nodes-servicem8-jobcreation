/**
 * Types Index
 * Re-exports all types for the ServiceM8 Smart Job Creation node
 */

// API types
export {
	type ServiceM8Client,
	type ServiceM8Contact,
	type ServiceM8Job,
	type ServiceM8Category,
	type ServiceM8Badge,
	type ServiceM8Queue,
	type ServiceM8ApiResponse,
	isServiceM8Client,
	isServiceM8Contact,
	parseApiResult,
} from './api';

// Input types
export {
	type ContactInput,
	type AddressParts,
	type JobInput,
	type NotificationRecipient,
	type AttachmentMode,
	type AttachmentInputParams,
	type NameMatchResult,
	type AddressMatchResult,
	type MatchResult,
	type ClientMatchResult,
	type ClassifiedInput,
	type ActionDecision,
	type ProcessedInput,
} from './input';

// Result types
export {
	type CreatedRecords,
	type CreatedRecordsUpdate,
	type ExecutionSummary,
	type ExecutionDebug,
	type ExecutionResult,
	type JobUpdateResult,
	createEmptyCreatedRecords,
	createEmptyCreatedRecordsUpdate,
	createEmptySummary,
	createEmptyDebug,
	createEmptyExecutionResult,
	createEmptyUpdateResult,
} from './result';
