import {
	joinNonEmpty,
	buildAddressString,
	normalizeForMatching,
	lightNormalize,
	matchAddresses,
	hasAddressContent,
	isValidAustralianPostcode,
} from '../nodes/ServiceM8JobCreation/helpers/addressUtils';

describe('addressUtils', () => {
	describe('joinNonEmpty', () => {
		it('should join non-empty strings', () => {
			expect(joinNonEmpty(['a', 'b', 'c'])).toBe('a, b, c');
		});

		it('should filter out empty and null values', () => {
			expect(joinNonEmpty(['a', '', null, 'b', undefined])).toBe('a, b');
		});

		it('should use custom separator', () => {
			expect(joinNonEmpty(['a', 'b', 'c'], ' - ')).toBe('a - b - c');
		});

		it('should trim whitespace', () => {
			expect(joinNonEmpty(['  a  ', '  b  '])).toBe('a, b');
		});

		it('should return empty string for all empty values', () => {
			expect(joinNonEmpty(['', null, undefined])).toBe('');
		});
	});

	describe('buildAddressString', () => {
		it('should build full address string', () => {
			const result = buildAddressString({
				street: '123 Main St',
				city: 'Sydney',
				state: 'NSW',
				postcode: '2000',
				country: 'Australia',
			});
			expect(result).toBe('123 Main St, Sydney, NSW, 2000, Australia');
		});

		it('should handle partial address', () => {
			const result = buildAddressString({
				street: '123 Main St',
				city: 'Sydney',
				state: '',
				postcode: '2000',
				country: '',
			});
			expect(result).toBe('123 Main St, Sydney, 2000');
		});
	});

	describe('normalizeForMatching', () => {
		it('should lowercase and remove special characters', () => {
			expect(normalizeForMatching('123 Main St.')).toBe('123mainst');
			expect(normalizeForMatching('Unit 5/42 King Street')).toBe('unit542kingstreet');
		});

		it('should handle null and undefined', () => {
			expect(normalizeForMatching(null)).toBe('');
			expect(normalizeForMatching(undefined)).toBe('');
		});

		it('should trim whitespace', () => {
			expect(normalizeForMatching('  hello world  ')).toBe('helloworld');
		});
	});

	describe('lightNormalize', () => {
		it('should lowercase and trim but keep spaces', () => {
			expect(lightNormalize('  Hello World  ')).toBe('hello world');
		});

		it('should handle null and undefined', () => {
			expect(lightNormalize(null)).toBe('');
			expect(lightNormalize(undefined)).toBe('');
		});
	});

	describe('matchAddresses', () => {
		it('should return exact for matching street + postcode', () => {
			const result = matchAddresses(
				{ street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '2000', country: 'Australia' },
				{ address_street: '123 Main St', address_city: 'Sydney', address_postcode: '2000' },
			);
			expect(result).toBe('exact');
		});

		it('should return exact for matching street + city', () => {
			const result = matchAddresses(
				{ street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '', country: 'Australia' },
				{ address_street: '123 Main St', address_city: 'Sydney', address_postcode: '' },
			);
			expect(result).toBe('exact');
		});

		it('should return near for matching postcode only', () => {
			const result = matchAddresses(
				{ street: '456 Other Ave', city: 'Sydney', state: 'NSW', postcode: '2000', country: 'Australia' },
				{ address_street: '123 Main St', address_city: 'Sydney', address_postcode: '2000' },
			);
			expect(result).toBe('near');
		});

		it('should return near for street containment', () => {
			const result = matchAddresses(
				{ street: '123 Main', city: '', state: '', postcode: '', country: '' },
				{ address_street: '123 Main Street', address_city: '', address_postcode: '' },
			);
			expect(result).toBe('near');
		});

		it('should return none for completely different addresses', () => {
			const result = matchAddresses(
				{ street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '2000', country: 'Australia' },
				{ address_street: '456 Other Ave', address_city: 'Melbourne', address_postcode: '3000' },
			);
			expect(result).toBe('none');
		});

		it('should normalize addresses before comparing', () => {
			const result = matchAddresses(
				{ street: '123 MAIN ST.', city: 'SYDNEY', state: 'NSW', postcode: '2000', country: 'Australia' },
				{ address_street: '123 main st', address_city: 'sydney', address_postcode: '2000' },
			);
			expect(result).toBe('exact');
		});
	});

	describe('hasAddressContent', () => {
		it('should return true if any address field has content', () => {
			expect(hasAddressContent({ street: '123 Main St', city: '', state: '', postcode: '', country: '' })).toBe(true);
			expect(hasAddressContent({ street: '', city: 'Sydney', state: '', postcode: '', country: '' })).toBe(true);
			expect(hasAddressContent({ street: '', city: '', state: 'NSW', postcode: '', country: '' })).toBe(true);
			expect(hasAddressContent({ street: '', city: '', state: '', postcode: '2000', country: '' })).toBe(true);
		});

		it('should return false if all fields are empty', () => {
			expect(hasAddressContent({ street: '', city: '', state: '', postcode: '', country: '' })).toBe(false);
			expect(hasAddressContent({ street: '', city: '', state: '', postcode: '', country: 'Australia' })).toBe(false);
		});
	});

	describe('isValidAustralianPostcode', () => {
		it('should accept valid 4-digit postcodes', () => {
			expect(isValidAustralianPostcode('2000')).toBe(true);
			expect(isValidAustralianPostcode('3000')).toBe(true);
			expect(isValidAustralianPostcode('0800')).toBe(true);
		});

		it('should reject invalid postcodes', () => {
			expect(isValidAustralianPostcode('200')).toBe(false);
			expect(isValidAustralianPostcode('20000')).toBe(false);
			expect(isValidAustralianPostcode('abcd')).toBe(false);
			expect(isValidAustralianPostcode(null)).toBe(false);
			expect(isValidAustralianPostcode(undefined)).toBe(false);
		});

		it('should handle postcodes with whitespace', () => {
			expect(isValidAustralianPostcode('  2000  ')).toBe(true);
		});
	});
});
