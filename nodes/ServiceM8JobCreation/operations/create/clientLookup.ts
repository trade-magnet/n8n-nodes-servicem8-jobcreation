/**
 * Client Lookup Operations
 * Find and match existing clients with decision logic
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type {
	ServiceM8Client,
	ServiceM8Contact,
	AddressParts,
	MatchResult,
} from '../../types';
import { serviceM8Request, parseArrayResponse } from '../../helpers/api';
import {
	findBestMatchingClient,
	determineAction,
	type ActionDecisionResult,
} from '../../helpers/clientMatcher';

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
 * Look up clients of a specific type (business or individual)
 */
export async function lookupClients(
	context: IExecuteFunctions,
	isIndividual: number,
): Promise<ServiceM8Client[]> {
	const clientsResponse = await serviceM8Request(context, {
		method: 'GET',
		endpoint: '/api_1.0/company.json',
		query: { $filter: `active eq 1 and is_individual eq ${isIndividual}` },
	});

	return parseArrayResponse<ServiceM8Client>(clientsResponse);
}

/**
 * Find the best matching client and determine action to take
 */
export function findMatchingClientAndDetermineAction(
	clientName: string,
	clientAddressParts: AddressParts,
	allClients: ServiceM8Client[],
	isBusiness: boolean,
	kind: 'business' | 'person',
	existingContact: ServiceM8Contact | null,
): ActionResult {
	// Find the best matching client
	const matchResult = findBestMatchingClient(
		clientName,
		clientAddressParts,
		allClients,
		isBusiness,
	);

	// Determine what action to take
	const actionResult = determineAction({
		contactExists: existingContact !== null,
		existingContactClientUuid: existingContact?.company_uuid || null,
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
