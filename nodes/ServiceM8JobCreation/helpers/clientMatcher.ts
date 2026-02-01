/**
 * Client Matching Logic
 * Implements fuzzy name + address matching for client deduplication
 */

import type {
	ServiceM8Client,
	AddressParts,
	NameMatchResult,
	MatchResult,
	ClientMatchResult,
} from '../types/index';
import { normalizeForMatching, matchAddresses } from './addressUtils';

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
 * Find the best matching client from a list
 * Implements the decision matrix:
 *
 * For BUSINESSES:
 * - Exact name → use existing
 * - Partial name + exact/near address → use existing (same business, name variant)
 * - Partial name + no address match → create new
 *
 * For INDIVIDUALS:
 * - Exact name + exact address → use existing
 * - Exact name + different address → create new (different person, same name)
 * - Partial name + exact/near address → use existing
 */
export function findBestMatchingClient(
	searchName: string,
	searchAddress: AddressParts,
	clients: ServiceM8Client[],
	isBusiness: boolean,
): ClientMatchResult {
	let matchedClient: ServiceM8Client | null = null;
	let matchType: MatchResult = { name: 'none', address: 'none' };
	let matchReason = '';

	for (const client of clients) {
		const nameMatch = matchClientName(searchName, client.name);
		const addressMatch = matchAddresses(searchAddress, client);

		if (nameMatch === 'exact') {
			// EXACT name match
			if (isBusiness) {
				// Business: exact name always matches
				matchedClient = client;
				matchType = { name: 'exact', address: addressMatch };
				matchReason = `Exact name match: "${client.name}"`;
				break; // No need to check further
			} else {
				// Individual: exact name + exact address = match
				if (addressMatch === 'exact') {
					matchedClient = client;
					matchType = { name: 'exact', address: 'exact' };
					matchReason = `Exact name match: "${client.name}" with exact address`;
					break;
				} else {
					// Same name but different address = different person
					// Don't match, continue looking for a better match
					// But record this as a potential issue
					if (!matchedClient) {
						matchReason = `Exact name match "${client.name}" but different address - different person`;
					}
				}
			}
		} else if (nameMatch === 'partial') {
			// PARTIAL name match - need address to confirm
			if (addressMatch === 'exact' || addressMatch === 'near') {
				// Partial name + similar address = same client
				if (!matchedClient || matchType.name !== 'exact') {
					matchedClient = client;
					matchType = { name: 'partial', address: addressMatch };
					matchReason = `Partial name "${client.name}" + ${addressMatch} address match`;
				}
			}
			// Partial name + different address = different client (don't match)
		}
	}

	if (!matchedClient) {
		matchReason = matchReason || 'No matching client found';
	}

	return {
		client: matchedClient,
		matchType,
		reason: matchReason,
	};
}

/**
 * Determine the action to take based on contact and client matches
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
	clientUuid: string | null;
}

export function determineAction(input: ActionDecisionInput): ActionDecisionResult {
	const {
		contactExists,
		existingContactClientUuid,
		matchedClient,
		matchType,
		matchReason,
		isBusiness,
		kind,
	} = input;

	let clientUuid: string | null = null;
	let needsClient = true;
	let needsContact = true;

	if (matchedClient) {
		// We found a matching client
		clientUuid = matchedClient.uuid;

		if (isBusiness) {
			// BUSINESS rules: use existing if we have a match
			needsClient = false;
		} else {
			// INDIVIDUAL rules
			if (matchType.name === 'exact' && matchType.address === 'exact') {
				needsClient = false;
			} else if (matchType.name === 'exact') {
				// Same name but different address = different person
				needsClient = true;
				clientUuid = null;
			} else {
				// Partial match
				needsClient = false;
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
		reason = `${kind}: ${matchReason}; creating new client and contact`;
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
		clientUuid,
	};
}
