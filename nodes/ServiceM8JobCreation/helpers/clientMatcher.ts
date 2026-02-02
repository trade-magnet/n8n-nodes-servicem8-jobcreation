/**
 * Client Matching Logic
 * Implements exact name matching (case-insensitive) for client deduplication
 * Note: ServiceM8 allows duplicate client names, so proper deduplication
 * requires checking both name AND contact email (handled in clientLookup.ts)
 */

import type {
	ServiceM8Client,
	NameMatchResult,
	MatchResult,
	ClientMatchResult,
} from '../types/index';
import { normalizeForMatching } from './addressUtils';

/**
 * Compare two names and return match quality
 * - 'exact': normalized strings are equal
 * - 'partial': one contains the other, or starts with the other
 * - 'none': no match
 */
export function matchClientName(
	searchName: string,
	clientName: string,
): NameMatchResult {
	const s = normalizeForMatching(searchName);
	const c = normalizeForMatching(clientName);

	if (!s || !c) return 'none';

	// Exact match
	if (s === c) return 'exact';

	// Partial match: one contains the other
	if (c.includes(s) || s.includes(c)) return 'partial';

	// Partial match: one starts with the other
	if (c.startsWith(s) || s.startsWith(c)) return 'partial';

	return 'none';
}

export type NameFormat = 'firstLast' | 'lastFirst';

/**
 * Build a client name from first/last names or business name
 * For individuals: format depends on nameFormat parameter
 *   - 'firstLast': "John Smith"
 *   - 'lastFirst': "Smith, John" (ServiceM8 default)
 * For businesses: businessName
 */
export function buildClientName(
	firstName: string,
	lastName: string,
	businessName: string,
	email: string,
	nameFormat: NameFormat = 'firstLast',
): { name: string; isBusiness: boolean } {
	const trimmedBusiness = (businessName || '').trim();
	const trimmedFirst = (firstName || '').trim();
	const trimmedLast = (lastName || '').trim();
	const trimmedEmail = (email || '').trim().toLowerCase();

	if (trimmedBusiness) {
		return { name: trimmedBusiness, isBusiness: true };
	}

	// Individual: format based on nameFormat setting
	if (trimmedLast && trimmedFirst) {
		const name = nameFormat === 'lastFirst'
			? `${trimmedLast}, ${trimmedFirst}`
			: `${trimmedFirst} ${trimmedLast}`;
		return { name, isBusiness: false };
	}

	// Only first name provided
	if (trimmedFirst) {
		return { name: trimmedFirst, isBusiness: false };
	}

	// Only last name provided
	if (trimmedLast) {
		return { name: trimmedLast, isBusiness: false };
	}

	// Fallback to email
	const name = trimmedEmail || 'Unknown';
	return { name, isBusiness: false };
}

/**
 * Build both possible name formats for matching purposes
 * Returns both "First Last" and "Last, First" versions
 */
export function buildBothNameFormats(
	firstName: string,
	lastName: string,
): { firstLast: string; lastFirst: string } {
	const trimmedFirst = (firstName || '').trim();
	const trimmedLast = (lastName || '').trim();

	if (trimmedFirst && trimmedLast) {
		return {
			firstLast: `${trimmedFirst} ${trimmedLast}`,
			lastFirst: `${trimmedLast}, ${trimmedFirst}`,
		};
	}

	// Only one name available
	const single = trimmedFirst || trimmedLast || '';
	return {
		firstLast: single,
		lastFirst: single,
	};
}

/**
 * Find the next available name with suffix for name conflicts
 * e.g., if "David List" and "David List 1" exist, returns "David List 2"
 */
export function findNextAvailableName(
	baseName: string,
	existingClients: ServiceM8Client[],
): string {
	const normalizedBase = normalizeForMatching(baseName);

	// Find all clients with matching base name or numbered variants
	let highestSuffix = 0;

	for (const client of existingClients) {
		const normalizedClientName = normalizeForMatching(client.name);

		// Check for exact base name match
		if (normalizedClientName === normalizedBase) {
			highestSuffix = Math.max(highestSuffix, 1);
			continue;
		}

		// Check for numbered variants like "Name 1", "Name 2", etc.
		// Match pattern: baseName + space + number
		const suffixPattern = new RegExp(`^${normalizedBase}(\\d+)$`);
		const match = normalizedClientName.match(suffixPattern);
		if (match) {
			const suffix = parseInt(match[1], 10);
			highestSuffix = Math.max(highestSuffix, suffix + 1);
		}
	}

	// If no conflicts, return base name; otherwise append next number
	if (highestSuffix === 0) {
		return baseName;
	}

	return `${baseName} ${highestSuffix}`;
}

/**
 * Find client by exact name match (case-insensitive)
 * Returns the FIRST matching client found.
 *
 * Note: ServiceM8 allows duplicate names, so if the contact already exists,
 * prefer using that contact's client (handled in clientLookup.ts)
 */
export function findBestMatchingClient(
	searchName: string,
	clients: ServiceM8Client[],
): ClientMatchResult {
	const normalizedSearch = normalizeForMatching(searchName);

	for (const client of clients) {
		const normalizedClientName = normalizeForMatching(client.name);

		if (normalizedSearch === normalizedClientName) {
			return {
				client,
				matchType: { name: 'exact', address: 'none' },
				reason: `Exact name match: "${client.name}"`,
			};
		}
	}

	return {
		client: null,
		matchType: { name: 'none', address: 'none' },
		reason: 'No matching client found',
	};
}

/**
 * Determine the action to take based on contact and client matches
 *
 * For INDIVIDUALS:
 * - Matched client has existing contact with same email → use existing client
 * - Matched client but no/different email → create new client with numbered suffix
 * - No name match → create new client
 *
 * For BUSINESSES:
 * - Exact name match → use existing business, add contact
 * - No name match → create new business
 *
 * Note: The matched client should already be the correct one (preferring the
 * contact's client if email exists) - see findMatchingClientAndDetermineAction()
 */
export interface ActionDecisionInput {
	contactExists: boolean;
	existingContactClientUuid: string | null;
	matchedClient: ServiceM8Client | null;
	matchType: MatchResult;
	matchReason: string;
	isBusiness: boolean;
	kind: 'business' | 'person';
}

export interface ActionDecisionResult {
	action: 'create_client_and_contact' | 'create_contact_and_job' | 'create_job_only';
	reason: string;
	needsClient: boolean;
	needsContact: boolean;
	needsNameSuffix: boolean;
	clientUuid: string | null;
}

export function determineAction(input: ActionDecisionInput): ActionDecisionResult {
	const {
		contactExists,
		existingContactClientUuid,
		matchedClient,
		matchReason,
		isBusiness,
		kind,
	} = input;

	let clientUuid: string | null = null;
	let needsClient = true;
	let needsContact = true;
	let needsNameSuffix = false;

	if (matchedClient) {
		// We found a client with exact name match
		clientUuid = matchedClient.uuid;

		if (isBusiness) {
			// BUSINESS: exact name match → use existing, add contact
			needsClient = false;
		} else {
			// INDIVIDUAL: check if contact email matches
			if (contactExists && existingContactClientUuid === matchedClient.uuid) {
				// Email matches existing contact on this client → use existing
				needsClient = false;
			} else {
				// Name matches but email doesn't → create new with suffix
				needsClient = true;
				needsNameSuffix = true;
				clientUuid = null;
			}
		}
	}

	// Determine if we need to create a contact
	if (contactExists && existingContactClientUuid === clientUuid && clientUuid !== null) {
		// Contact already exists on our target client
		needsContact = false;
	}

	// Build the action and reason
	let action: ActionDecisionResult['action'];
	let reason: string;

	if (needsClient) {
		action = 'create_client_and_contact';
		if (needsNameSuffix) {
			reason = `${kind}: ${matchReason}; name conflict - creating new client with suffix`;
		} else {
			reason = `${kind}: ${matchReason}; creating new client and contact`;
		}
	} else if (needsContact) {
		action = 'create_contact_and_job';
		reason = `${kind}: ${matchReason}; creating contact on existing client`;
	} else {
		action = 'create_job_only';
		reason = `${kind}: ${matchReason}; contact already exists on this client`;
	}

	return {
		action,
		reason,
		needsClient,
		needsContact,
		needsNameSuffix,
		clientUuid,
	};
}
