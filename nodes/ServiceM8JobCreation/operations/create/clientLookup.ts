/**
 * Client Lookup Operations
 * Find and match existing clients with decision logic
 * Uses exact name matching (case-insensitive)
 * Note: ServiceM8 allows duplicate client names, so we prefer the client
 * that already has a matching contact when the email exists
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type {
	ServiceM8Client,
	ServiceM8Contact,
	MatchResult,
} from '../../types';
import { serviceM8Request, parseArrayResponse } from '../../helpers/api';
import {
	findBestMatchingClient,
	determineAction,
	type ActionDecisionResult,
} from '../../helpers/clientMatcher';
import { normalizeForMatching } from '../../helpers/addressUtils';

export interface ClientLookupResult {
	allClients: ServiceM8Client[];
	matchResult: {
		client: ServiceM8Client | null;
		matchType: MatchResult;
		reason: string;
	};
}

export interface ActionResult extends ActionDecisionResult {
	matchType: MatchResult;
	matchReason: string;
	clientsChecked: number;
}

/**
 * Look up all active clients (both business and individual)
 * We need all clients to check for name conflicts and find suffix numbers
 */
export async function lookupClients(
	context: IExecuteFunctions,
): Promise<ServiceM8Client[]> {
	const clientsResponse = await serviceM8Request(context, {
		method: 'GET',
		endpoint: '/api_1.0/company.json',
		query: { $filter: 'active eq 1' },
	});

	return parseArrayResponse<ServiceM8Client>(clientsResponse);
}

/**
 * Find the best matching client and determine action to take
 * Uses exact name matching only (case-insensitive)
 *
 * PRIORITY ORDER:
 * 1. Search ALL contacts with matching email/phone to find one on a client with matching name
 *    (This handles duplicate emails - find the contact that belongs to a matching client)
 * 2. Otherwise, find first client with exact name match
 */
export function findMatchingClientAndDetermineAction(
	clientName: string,
	allClients: ServiceM8Client[],
	isBusiness: boolean,
	kind: 'business' | 'person',
	existingContact: ServiceM8Contact | null,
	allMatchingContacts: ServiceM8Contact[] = [],
): ActionResult {
	let matchResult: {
		client: ServiceM8Client | null;
		matchType: MatchResult;
		reason: string;
	};

	// The contact we'll use for action determination (might be different from existingContact)
	let contactForAction: ServiceM8Contact | null = existingContact;

	// PRIORITY 1: Search ALL matching contacts to find one on a client with matching name
	// This handles the case where the same email exists on multiple clients
	if (allMatchingContacts.length > 0) {
		const normalizedInputName = normalizeForMatching(clientName);

		for (const contact of allMatchingContacts) {
			const contactClient = allClients.find(c => c.uuid === contact.company_uuid);
			if (contactClient && normalizeForMatching(contactClient.name) === normalizedInputName) {
				// Found a contact on a client with matching name - use this one!
				contactForAction = contact;
				matchResult = {
					client: contactClient,
					matchType: { name: 'exact', address: 'none' },
					reason: `Exact name match (via existing contact): "${contactClient.name}"`,
				};
				break;
			}
		}
	}

	// PRIORITY 2: No contact found on a matching client, use normal name matching
	if (!matchResult!) {
		matchResult = findBestMatchingClient(clientName, allClients);
	}

	// Determine what action to take
	const actionResult = determineAction({
		contactExists: contactForAction !== null,
		existingContactClientUuid: contactForAction?.company_uuid || null,
		matchedClient: matchResult.client,
		matchType: matchResult.matchType,
		matchReason: matchResult.reason,
		isBusiness,
		kind,
	});

	return {
		...actionResult,
		matchType: matchResult.matchType,
		matchReason: matchResult.reason,
		clientsChecked: allClients.length,
	};
}
