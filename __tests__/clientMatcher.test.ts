import {
	matchClientName,
	buildClientName,
	buildBothNameFormats,
	findBestMatchingClient,
	determineAction,
} from '../nodes/ServiceM8JobCreation/helpers/clientMatcher';
import type { ServiceM8Client } from '../nodes/ServiceM8JobCreation/types';

describe('clientMatcher', () => {
	describe('matchClientName', () => {
		it('should return exact for identical names', () => {
			expect(matchClientName('John Smith', 'John Smith')).toBe('exact');
			expect(matchClientName('Acme Corp', 'Acme Corp')).toBe('exact');
		});

		it('should return exact ignoring case and special chars', () => {
			expect(matchClientName('john smith', 'John Smith')).toBe('exact');
			expect(matchClientName('ACME CORP.', 'Acme Corp')).toBe('exact');
		});

		it('should return partial for containment', () => {
			expect(matchClientName('Smith', 'John Smith')).toBe('partial');
			expect(matchClientName('John Smith', 'Smith')).toBe('partial');
			expect(matchClientName('Acme', 'Acme Corporation')).toBe('partial');
		});

		it('should return partial for starts-with', () => {
			expect(matchClientName('John', 'John Smith')).toBe('partial');
			expect(matchClientName('Acme Co', 'Acme Corp')).toBe('partial');
		});

		it('should return none for completely different names', () => {
			expect(matchClientName('John Smith', 'Jane Doe')).toBe('none');
			expect(matchClientName('Acme Corp', 'Widget Inc')).toBe('none');
		});

		it('should return none for empty strings', () => {
			expect(matchClientName('', 'John Smith')).toBe('none');
			expect(matchClientName('John Smith', '')).toBe('none');
		});
	});

	describe('buildClientName', () => {
		it('should return business name when provided', () => {
			const result = buildClientName('John', 'Smith', 'Acme Corp', 'john@example.com');
			expect(result.name).toBe('Acme Corp');
			expect(result.isBusiness).toBe(true);
		});

		it('should format individual as First Last by default', () => {
			const result = buildClientName('John', 'Smith', '', 'john@example.com', 'firstLast');
			expect(result.name).toBe('John Smith');
			expect(result.isBusiness).toBe(false);
		});

		it('should format individual as Last, First when specified', () => {
			const result = buildClientName('John', 'Smith', '', 'john@example.com', 'lastFirst');
			expect(result.name).toBe('Smith, John');
			expect(result.isBusiness).toBe(false);
		});

		it('should handle first name only', () => {
			const result = buildClientName('John', '', '', 'john@example.com');
			expect(result.name).toBe('John');
			expect(result.isBusiness).toBe(false);
		});

		it('should handle last name only', () => {
			const result = buildClientName('', 'Smith', '', 'john@example.com');
			expect(result.name).toBe('Smith');
			expect(result.isBusiness).toBe(false);
		});

		it('should fallback to email when no names provided', () => {
			const result = buildClientName('', '', '', 'john@example.com');
			expect(result.name).toBe('john@example.com');
			expect(result.isBusiness).toBe(false);
		});

		it('should fallback to Unknown when nothing provided', () => {
			const result = buildClientName('', '', '', '');
			expect(result.name).toBe('Unknown');
			expect(result.isBusiness).toBe(false);
		});
	});

	describe('buildBothNameFormats', () => {
		it('should build both formats for first and last name', () => {
			const result = buildBothNameFormats('John', 'Smith');
			expect(result.firstLast).toBe('John Smith');
			expect(result.lastFirst).toBe('Smith, John');
		});

		it('should handle first name only', () => {
			const result = buildBothNameFormats('John', '');
			expect(result.firstLast).toBe('John');
			expect(result.lastFirst).toBe('John');
		});

		it('should handle last name only', () => {
			const result = buildBothNameFormats('', 'Smith');
			expect(result.firstLast).toBe('Smith');
			expect(result.lastFirst).toBe('Smith');
		});
	});

	describe('findBestMatchingClient', () => {
		const clients: ServiceM8Client[] = [
			{
				uuid: 'client-1',
				name: 'John Smith',
				is_individual: 1,
				address: '123 Main St, Sydney NSW 2000',
				address_street: '123 Main St',
				address_city: 'Sydney',
				address_state: 'NSW',
				address_postcode: '2000',
				address_country: 'Australia',
				active: 1,
			},
			{
				uuid: 'client-2',
				name: 'Acme Corporation',
				is_individual: 0,
				address: '456 Business Ave, Melbourne VIC 3000',
				address_street: '456 Business Ave',
				address_city: 'Melbourne',
				address_state: 'VIC',
				address_postcode: '3000',
				address_country: 'Australia',
				active: 1,
			},
			{
				uuid: 'client-3',
				name: 'Jane Doe',
				is_individual: 1,
				address: '789 Other Rd, Brisbane QLD 4000',
				address_street: '789 Other Rd',
				address_city: 'Brisbane',
				address_state: 'QLD',
				address_postcode: '4000',
				address_country: 'Australia',
				active: 1,
			},
		];

		describe('business matching', () => {
			it('should match on exact business name regardless of address', () => {
				const result = findBestMatchingClient(
					'Acme Corporation',
					{ street: 'Different Address', city: 'Perth', state: 'WA', postcode: '6000', country: 'Australia' },
					clients,
					true,
				);
				expect(result.client?.uuid).toBe('client-2');
				expect(result.matchType.name).toBe('exact');
			});

			it('should match on partial business name with address match', () => {
				const result = findBestMatchingClient(
					'Acme Corp',
					{ street: '456 Business Ave', city: 'Melbourne', state: 'VIC', postcode: '3000', country: 'Australia' },
					clients,
					true,
				);
				expect(result.client?.uuid).toBe('client-2');
				expect(result.matchType.name).toBe('partial');
			});

			it('should not match partial business name without address match', () => {
				const result = findBestMatchingClient(
					'Acme',
					{ street: 'Different Address', city: 'Perth', state: 'WA', postcode: '6000', country: 'Australia' },
					clients,
					true,
				);
				expect(result.client).toBeNull();
			});
		});

		describe('individual matching', () => {
			it('should match on exact name with exact address', () => {
				const result = findBestMatchingClient(
					'John Smith',
					{ street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '2000', country: 'Australia' },
					clients,
					false,
				);
				expect(result.client?.uuid).toBe('client-1');
				expect(result.matchType.name).toBe('exact');
				expect(result.matchType.address).toBe('exact');
			});

			it('should not match exact name with different address (different person)', () => {
				const result = findBestMatchingClient(
					'John Smith',
					{ street: '999 Different St', city: 'Perth', state: 'WA', postcode: '6000', country: 'Australia' },
					clients,
					false,
				);
				expect(result.client).toBeNull();
			});

			it('should match partial name with address match', () => {
				const result = findBestMatchingClient(
					'Smith',
					{ street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '2000', country: 'Australia' },
					clients,
					false,
				);
				expect(result.client?.uuid).toBe('client-1');
				expect(result.matchType.name).toBe('partial');
			});
		});

		it('should return null when no clients match', () => {
			const result = findBestMatchingClient(
				'Unknown Person',
				{ street: 'Unknown Address', city: 'Unknown', state: 'XX', postcode: '0000', country: 'Australia' },
				clients,
				false,
			);
			expect(result.client).toBeNull();
		});
	});

	describe('determineAction', () => {
		it('should create client and contact when no match found', () => {
			const result = determineAction({
				contactExists: false,
				existingContactClientUuid: null,
				matchedClient: null,
				matchType: { name: 'none', address: 'none' },
				matchReason: 'No match',
				isBusiness: false,
				kind: 'person',
			});
			expect(result.action).toBe('create_client_and_contact');
			expect(result.needsClient).toBe(true);
			expect(result.needsContact).toBe(true);
		});

		it('should create job only when contact exists on matched client', () => {
			const result = determineAction({
				contactExists: true,
				existingContactClientUuid: 'client-1',
				matchedClient: { uuid: 'client-1', name: 'Test' } as ServiceM8Client,
				matchType: { name: 'exact', address: 'exact' },
				matchReason: 'Exact match',
				isBusiness: false,
				kind: 'person',
			});
			expect(result.action).toBe('create_job_only');
			expect(result.needsClient).toBe(false);
			expect(result.needsContact).toBe(false);
		});

		it('should create contact on existing client when contact does not exist', () => {
			const result = determineAction({
				contactExists: false,
				existingContactClientUuid: null,
				matchedClient: { uuid: 'client-1', name: 'Test' } as ServiceM8Client,
				matchType: { name: 'exact', address: 'exact' },
				matchReason: 'Exact match',
				isBusiness: false,
				kind: 'person',
			});
			expect(result.action).toBe('create_contact_and_job');
			expect(result.needsClient).toBe(false);
			expect(result.needsContact).toBe(true);
			expect(result.clientUuid).toBe('client-1');
		});

		it('should use existing business on exact name match', () => {
			const result = determineAction({
				contactExists: false,
				existingContactClientUuid: null,
				matchedClient: { uuid: 'client-1', name: 'Acme Corp' } as ServiceM8Client,
				matchType: { name: 'exact', address: 'none' },
				matchReason: 'Exact business name',
				isBusiness: true,
				kind: 'business',
			});
			expect(result.needsClient).toBe(false);
			expect(result.clientUuid).toBe('client-1');
		});

		it('should create new client for individual with same name but different address', () => {
			const result = determineAction({
				contactExists: false,
				existingContactClientUuid: null,
				matchedClient: { uuid: 'client-1', name: 'John Smith' } as ServiceM8Client,
				matchType: { name: 'exact', address: 'none' },
				matchReason: 'Same name different address',
				isBusiness: false,
				kind: 'person',
			});
			expect(result.needsClient).toBe(true);
			expect(result.clientUuid).toBeNull();
			expect(result.action).toBe('create_client_and_contact');
		});
	});
});
