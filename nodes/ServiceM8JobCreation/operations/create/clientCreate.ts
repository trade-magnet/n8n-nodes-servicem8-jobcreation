/**
 * Client Creation Operations
 * Create client and company contact
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { AddressParts } from '../../types';
import { createClient, createCompanyContact } from '../../helpers/api';
import { checkContactExistsOnClient } from './contactLookup';

export interface ClientCreateInput {
	clientName: string;
	isIndividual: number;
	clientAddress: string;
	clientAddressParts: AddressParts;
}

export interface ContactCreateInput {
	companyUuid: string;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string | null;
	mobile?: string | null;
}

export interface ClientCreateResult {
	clientUuid: string;
	clientCreated: boolean;
}

export interface ContactCreateResult {
	contactUuid?: string;
	contactCreated: boolean;
}

/**
 * Create a new client if needed
 */
export async function createClientIfNeeded(
	context: IExecuteFunctions,
	needsClient: boolean,
	existingClientUuid: string | null,
	input: ClientCreateInput,
): Promise<ClientCreateResult> {
	if (!needsClient && existingClientUuid) {
		return {
			clientUuid: existingClientUuid,
			clientCreated: false,
		};
	}

	const clientUuid = await createClient(context, {
		name: input.clientName,
		is_individual: input.isIndividual,
		address: input.clientAddress,
		address_street: input.clientAddressParts.street,
		address_city: input.clientAddressParts.city,
		address_state: input.clientAddressParts.state,
		address_postcode: input.clientAddressParts.postcode,
		address_country: input.clientAddressParts.country,
	});

	return {
		clientUuid,
		clientCreated: true,
	};
}

/**
 * Create a company contact if needed
 */
export async function createCompanyContactIfNeeded(
	context: IExecuteFunctions,
	needsContact: boolean,
	clientUuid: string,
	contactLookupField: 'email' | 'mobile' | 'phone' | null,
	input: ContactCreateInput,
): Promise<ContactCreateResult> {
	// Check if contact already exists on target client
	if (needsContact && contactLookupField) {
		const identifier = input.email || input.mobile || input.phone || '';
		const exists = await checkContactExistsOnClient(
			context,
			clientUuid,
			contactLookupField,
			identifier,
		);
		if (exists) {
			return { contactCreated: false };
		}
	}

	if (!needsContact) {
		return { contactCreated: false };
	}

	const contactUuid = await createCompanyContact(context, {
		company_uuid: clientUuid,
		first: input.firstName,
		last: input.lastName,
		email: input.email || undefined,
		phone: input.phone || undefined,
		mobile: input.mobile || undefined,
		type: 'BILLING',
	});

	return {
		contactUuid,
		contactCreated: true,
	};
}
