/**
 * Australian Phone Number Normalization Utilities
 */

/**
 * Remove all non-digit characters from a string
 */
function onlyDigits(str: string): string {
	return (str || '').replace(/\D+/g, '');
}

/**
 * Normalize an Australian mobile phone number to 04xx format
 * Handles formats: 04xx, +614xx, 614xx, 4xx
 * Returns null if not a valid mobile format
 */
export function normalizeAustralianMobile(phone: string | undefined | null): string | null {
	if (!phone) return null;

	const digits = onlyDigits(phone);

	// Already in 04xx format (10 digits starting with 04)
	if (/^04\d{8}$/.test(digits)) {
		return digits;
	}

	// International format: +614xx or 614xx (11-12 digits)
	if (/^(?:61)?4\d{8}$/.test(digits)) {
		return '0' + digits.slice(-9);
	}

	// Just the 9 digits without leading 0 (4xx xxx xxx)
	if (/^4\d{8}$/.test(digits)) {
		return '0' + digits;
	}

	return null;
}

/**
 * Normalize an Australian landline phone number
 * Handles formats: 0x xxxx xxxx, +61x xxxx xxxx, 8 digit local
 * Returns null if not a valid landline format
 */
export function normalizeAustralianLandline(phone: string | undefined | null): string | null {
	if (!phone) return null;

	const digits = onlyDigits(phone);

	// Full Australian landline: 0[2378] followed by 8 digits
	if (/^0[2378]\d{8}$/.test(digits)) {
		return digits;
	}

	// International format: 61[2378] followed by 8 digits
	if (/^61[2378]\d{8}$/.test(digits)) {
		return '0' + digits.slice(2);
	}

	// Local 8-digit number (no area code)
	if (/^\d{8}$/.test(digits)) {
		return digits;
	}

	return null;
}

/**
 * Smart phone derivation - determines mobile and landline from two input fields
 * Prioritizes the correct field but will detect if values are swapped
 */
export function derivePhones(
	inputPhone: string | undefined | null,
	inputMobile: string | undefined | null,
): { mobile: string | null; phone: string | null } {
	// First try to normalize each from its expected field
	let mobile = normalizeAustralianMobile(inputMobile);
	let phone = normalizeAustralianLandline(inputPhone);

	// If mobile field is empty but phone field contains a mobile number
	if (!mobile) {
		mobile = normalizeAustralianMobile(inputPhone);
	}

	// If phone field is empty but mobile field contains a landline
	// Only do this if we didn't already get a mobile from it
	if (!phone && !mobile) {
		phone = normalizeAustralianLandline(inputMobile);
	}

	return { mobile, phone };
}

/**
 * Format a phone number for display (with spaces)
 */
export function formatPhoneForDisplay(phone: string | null): string {
	if (!phone) return '';

	// Mobile: 04xx xxx xxx
	if (/^04\d{8}$/.test(phone)) {
		return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
	}

	// Landline: 0x xxxx xxxx
	if (/^0[2378]\d{8}$/.test(phone)) {
		return `${phone.slice(0, 2)} ${phone.slice(2, 6)} ${phone.slice(6)}`;
	}

	// 8-digit local: xxxx xxxx
	if (/^\d{8}$/.test(phone)) {
		return `${phone.slice(0, 4)} ${phone.slice(4)}`;
	}

	return phone;
}

/**
 * Check if a string looks like an Australian mobile number
 */
export function looksLikeMobile(phone: string | undefined | null): boolean {
	if (!phone) return false;
	const digits = onlyDigits(phone);
	return /^(?:0?4|61\s*4|\+61\s*4)/.test(phone) || /^(?:04|614|4)\d{8}$/.test(digits);
}

/**
 * Check if a string looks like an Australian landline number
 */
export function looksLikeLandline(phone: string | undefined | null): boolean {
	if (!phone) return false;
	const digits = onlyDigits(phone);
	return /^(?:0[2378]|61[2378])\d{8}$/.test(digits) || /^\d{8}$/.test(digits);
}
