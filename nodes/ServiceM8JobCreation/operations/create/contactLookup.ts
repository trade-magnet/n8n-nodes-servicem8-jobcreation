/**
 * Contact Lookup Operations
 * Find existing contact by email/mobile/phone
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ServiceM8Contact } from '../../types';
import { serviceM8Request, parseArrayResponse, escapeOData } from '../../helpers/api';

export interface ContactLookupResult {
	existingContact: ServiceM8Contact | null;
	foundByField: 'email' | 'mobile' | 'phone' | null;
}

/**
 * Look up an existing contact by email, mobile, or phone
 */
export async function lookupContact(
	context: IExecuteFunctions,
	contactLookupFilter: string | null,
	contactLookupField: 'email' | 'mobile' | 'phone' | null,
): Promise<ContactLookupResult> {
	if (!contactLookupFilter) {
		return {
			existingContact: null,
			foundByField: null,
		};
	}

	const contactResponse = await serviceM8Request(context, {
		method: 'GET',
		endpoint: '/api_1.0/companycontact.json',
		query: { $filter: contactLookupFilter },
	});

	const contacts = parseArrayResponse<ServiceM8Contact>(contactResponse);

	return {
		existingContact: contacts.length > 0 ? contacts[0] : null,
		foundByField: contacts.length > 0 ? contactLookupField : null,
	};
}

/**
 * Check if a contact already exists on a specific client
 */
export async function checkContactExistsOnClient(
	context: IExecuteFunctions,
	clientUuid: string,
	contactLookupField: 'email' | 'mobile' | 'phone' | null,
	identifier: string,
): Promise<boolean> {
	if (!contactLookupField || !identifier) {
		return false;
	}

	const dupeFilter = `active eq 1 and company_uuid eq '${clientUuid}' and ${contactLookupField} eq '${escapeOData(identifier)}'`;

	const dupeResponse = await serviceM8Request(context, {
		method: 'GET',
		endpoint: '/api_1.0/companycontact.json',
		query: { $filter: dupeFilter },
	});

	const dupeContacts = parseArrayResponse<ServiceM8Contact>(dupeResponse);
	return dupeContacts.length > 0;
}
