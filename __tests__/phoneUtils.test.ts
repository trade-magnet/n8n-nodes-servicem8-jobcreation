import {
	normalizeAustralianMobile,
	normalizeAustralianLandline,
	derivePhones,
	formatPhoneForDisplay,
	looksLikeMobile,
	looksLikeLandline,
} from '../nodes/ServiceM8JobCreation/helpers/phoneUtils';

describe('phoneUtils', () => {
	describe('normalizeAustralianMobile', () => {
		it('should return null for empty input', () => {
			expect(normalizeAustralianMobile(null)).toBeNull();
			expect(normalizeAustralianMobile(undefined)).toBeNull();
			expect(normalizeAustralianMobile('')).toBeNull();
		});

		it('should normalize 04xx format (10 digits)', () => {
			expect(normalizeAustralianMobile('0412345678')).toBe('0412345678');
			expect(normalizeAustralianMobile('0412 345 678')).toBe('0412345678');
			expect(normalizeAustralianMobile('0412-345-678')).toBe('0412345678');
		});

		it('should normalize international +614xx format', () => {
			expect(normalizeAustralianMobile('+61412345678')).toBe('0412345678');
			expect(normalizeAustralianMobile('+61 412 345 678')).toBe('0412345678');
		});

		it('should normalize 614xx format (without +)', () => {
			expect(normalizeAustralianMobile('61412345678')).toBe('0412345678');
		});

		it('should normalize 4xx format (9 digits, no leading 0)', () => {
			expect(normalizeAustralianMobile('412345678')).toBe('0412345678');
		});

		it('should return null for invalid mobile numbers', () => {
			expect(normalizeAustralianMobile('0212345678')).toBeNull(); // landline
			expect(normalizeAustralianMobile('12345')).toBeNull(); // too short
			expect(normalizeAustralianMobile('041234567')).toBeNull(); // 9 digits with 04
		});
	});

	describe('normalizeAustralianLandline', () => {
		it('should return null for empty input', () => {
			expect(normalizeAustralianLandline(null)).toBeNull();
			expect(normalizeAustralianLandline(undefined)).toBeNull();
			expect(normalizeAustralianLandline('')).toBeNull();
		});

		it('should normalize full Australian landline (0x xxxx xxxx)', () => {
			expect(normalizeAustralianLandline('0298765432')).toBe('0298765432');
			expect(normalizeAustralianLandline('02 9876 5432')).toBe('0298765432');
			expect(normalizeAustralianLandline('0398765432')).toBe('0398765432'); // Melbourne
			expect(normalizeAustralianLandline('0798765432')).toBe('0798765432'); // QLD
			expect(normalizeAustralianLandline('0898765432')).toBe('0898765432'); // WA
		});

		it('should normalize international format', () => {
			expect(normalizeAustralianLandline('+61298765432')).toBe('0298765432');
			expect(normalizeAustralianLandline('61298765432')).toBe('0298765432');
		});

		it('should accept local 8-digit numbers', () => {
			expect(normalizeAustralianLandline('98765432')).toBe('98765432');
			expect(normalizeAustralianLandline('9876 5432')).toBe('98765432');
		});

		it('should return null for invalid landline numbers', () => {
			expect(normalizeAustralianLandline('0412345678')).toBeNull(); // mobile
			expect(normalizeAustralianLandline('12345')).toBeNull(); // too short
		});
	});

	describe('derivePhones', () => {
		it('should correctly identify mobile and landline from expected fields', () => {
			const result = derivePhones('0298765432', '0412345678');
			expect(result.phone).toBe('0298765432');
			expect(result.mobile).toBe('0412345678');
		});

		it('should detect mobile in phone field when mobile field is empty', () => {
			const result = derivePhones('0412345678', null);
			expect(result.mobile).toBe('0412345678');
			expect(result.phone).toBeNull();
		});

		it('should detect landline in mobile field when phone field is empty', () => {
			const result = derivePhones(null, '0298765432');
			expect(result.phone).toBe('0298765432');
			expect(result.mobile).toBeNull();
		});

		it('should handle both fields empty', () => {
			const result = derivePhones(null, null);
			expect(result.phone).toBeNull();
			expect(result.mobile).toBeNull();
		});
	});

	describe('formatPhoneForDisplay', () => {
		it('should format mobile numbers with spaces', () => {
			expect(formatPhoneForDisplay('0412345678')).toBe('0412 345 678');
		});

		it('should format landline numbers with spaces', () => {
			expect(formatPhoneForDisplay('0298765432')).toBe('02 9876 5432');
		});

		it('should format 8-digit local numbers', () => {
			expect(formatPhoneForDisplay('98765432')).toBe('9876 5432');
		});

		it('should return empty string for null', () => {
			expect(formatPhoneForDisplay(null)).toBe('');
		});

		it('should return unrecognized formats unchanged', () => {
			expect(formatPhoneForDisplay('12345')).toBe('12345');
		});
	});

	describe('looksLikeMobile', () => {
		it('should identify mobile patterns', () => {
			expect(looksLikeMobile('0412345678')).toBe(true);
			expect(looksLikeMobile('04 1234 5678')).toBe(true);
			expect(looksLikeMobile('+61412345678')).toBe(true);
			expect(looksLikeMobile('61412345678')).toBe(true);
			expect(looksLikeMobile('412345678')).toBe(true);
		});

		it('should reject non-mobile patterns', () => {
			expect(looksLikeMobile('0298765432')).toBe(false);
			expect(looksLikeMobile('')).toBe(false);
			expect(looksLikeMobile(null)).toBe(false);
		});
	});

	describe('looksLikeLandline', () => {
		it('should identify landline patterns', () => {
			expect(looksLikeLandline('0298765432')).toBe(true);
			expect(looksLikeLandline('61298765432')).toBe(true);
			expect(looksLikeLandline('98765432')).toBe(true);
		});

		it('should reject non-landline patterns', () => {
			expect(looksLikeLandline('0412345678')).toBe(false);
			expect(looksLikeLandline('')).toBe(false);
			expect(looksLikeLandline(null)).toBe(false);
		});
	});
});
