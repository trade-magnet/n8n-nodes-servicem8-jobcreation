/**
 * Contact Lookup Operations
 * Find existing contact by email/mobile/phone
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ServiceM8Contact } from '../../types';
import { serviceM8Request, parseArrayResponse, escapeOData } from '../../helpers/api';

export interface ContactLookupResult {
	existingContact: ServiceM8Contact | null;
	allMatchingContacts: ServiceM8Contact[];
	foundByField: 'email' | 'mobile' | 'phone' | null;
}

export interface ContactIdentifiers {
	email: string | null;
	mobile: string | null;
	phone: string | null;
}

/**
 * Look up existing contacts by ANY of email/mobile/phone (OR query).
 * Filters results client-side with case-insensitive comparisons because
 * ServiceM8 OData `eq` is not reliably case-insensitive on string fields.
 */
export async function lookupContact(
	context: IExecuteFunctions,
	identifiers: ContactIdentifiers,
): Promise<ContactLookupResult> {
	const email = identifiers.email ? identifiers.email.trim().toLowerCase() : null;
	const mobile = identifiers.mobile ? identifiers.mobile.trim() : null;
	const phone = identifiers.phone ? identifiers.phone.trim() : null;

	// ServiceM8 OData does not reliably support `or` in filters, so we issue one
	// request per provided identifier and merge results client-side.
	const queries: Array<{ field: 'email' | 'mobile' | 'phone'; value: string }> = [];
	if (email) queries.push({ field: 'email', value: email });
	if (mobile) queries.push({ field: 'mobile', value: mobile });
	if (phone) queries.push({ field: 'phone', value: phone });

	if (queries.length === 0) {
		return { existingContact: null, allMatchingContacts: [], foundByField: null };
	}

	const raw: ServiceM8Contact[] = [];
	for (const q of queries) {
		const response = await serviceM8Request(context, {
			method: 'GET',
			endpoint: '/api_1.0/companycontact.json',
			query: { $filter: `active eq 1 and ${q.field} eq '${escapeOData(q.value)}'` },
		});
		raw.push(...parseArrayResponse<ServiceM8Contact>(response));
	}

	// Client-side case-insensitive filter + dedupe by uuid
	const seen = new Set<string>();
	const contacts: ServiceM8Contact[] = [];
	for (const c of raw) {
		const cEmail = (c.email || '').trim().toLowerCase();
		const cMobile = (c.mobile || '').trim();
		const cPhone = (c.phone || '').trim();
		const matches =
			(!!email && cEmail === email) ||
			(!!mobile && cMobile === mobile) ||
			(!!phone && cPhone === phone);
		if (!matches) continue;
		if (c.uuid && seen.has(c.uuid)) continue;
		if (c.uuid) seen.add(c.uuid);
		contacts.push(c);
	}

	let foundByField: 'email' | 'mobile' | 'phone' | null = null;
	if (contacts.length > 0) {
		const first = contacts[0];
		const fEmail = (first.email || '').trim().toLowerCase();
		const fMobile = (first.mobile || '').trim();
		if (email && fEmail === email) foundByField = 'email';
		else if (mobile && fMobile === mobile) foundByField = 'mobile';
		else foundByField = 'phone';
	}

	return {
		existingContact: contacts.length > 0 ? contacts[0] : null,
		allMatchingContacts: contacts,
		foundByField,
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
