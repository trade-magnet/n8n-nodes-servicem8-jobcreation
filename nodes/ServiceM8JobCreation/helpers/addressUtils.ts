/**
 * Address Building and Matching Utilities
 */

import type { AddressParts, AddressMatchResult } from '../types/index';

/**
 * Join non-empty strings with a separator
 */
export function joinNonEmpty(parts: (string | undefined | null)[], separator = ', '): string {
	return parts
		.filter((p) => p != null && String(p).trim() !== '')
		.map((p) => String(p).trim())
		.join(separator);
}

/**
 * Build a concatenated address string from parts
 */
export function buildAddressString(parts: AddressParts): string {
	return joinNonEmpty([
		parts.street,
		parts.city,
		parts.state,
		parts.postcode,
		parts.country,
	]);
}

/**
 * Normalize a string for matching (lowercase, remove special chars)
 */
export function normalizeForMatching(str: string | undefined | null): string {
	return (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Light normalization (lowercase, trim, but keep spaces)
 */
export function lightNormalize(str: string | undefined | null): string {
	return (str || '').toLowerCase().trim();
}

/**
 * Compare two addresses and return match quality
 * - 'exact': street + (postcode OR city) match
 * - 'near': postcode matches OR street contains/starts with
 * - 'none': no meaningful match
 */
export function matchAddresses(
	input: AddressParts,
	existing: {
		address_street?: string;
		address_city?: string;
		address_postcode?: string;
	},
): AddressMatchResult {
	const inputStreet = normalizeForMatching(input.street);
	const inputPostcode = normalizeForMatching(input.postcode);
	const inputCity = normalizeForMatching(input.city);

	const existingStreet = normalizeForMatching(existing.address_street);
	const existingPostcode = normalizeForMatching(existing.address_postcode);
	const existingCity = normalizeForMatching(existing.address_city);

	// Exact: street matches AND (postcode OR city matches)
	if (inputStreet && existingStreet && inputStreet === existingStreet) {
		if (
			(inputPostcode && existingPostcode && inputPostcode === existingPostcode) ||
			(inputCity && existingCity && inputCity === existingCity)
		) {
			return 'exact';
		}
	}

	// Near-exact: postcode matches
	if (inputPostcode && existingPostcode && inputPostcode === existingPostcode) {
		return 'near';
	}

	// Near-exact: street contains or starts with
	if (
		inputStreet &&
		existingStreet &&
		(existingStreet.includes(inputStreet) || inputStreet.includes(existingStreet))
	) {
		return 'near';
	}

	return 'none';
}

/**
 * Parse address parts from a node's fixedCollection input
 * Note: n8n fixedCollection returns an object (not array) when multipleValues is not set
 */
export function parseAddressFromInput(
	addressData: {
		address?: { street?: string; city?: string; state?: string; postcode?: string; country?: string }
			| Array<{ street?: string; city?: string; state?: string; postcode?: string; country?: string }>
	} | undefined,
): AddressParts {
	const addressContainer = addressData?.address;
	// Handle both object and array formats from n8n fixedCollection
	const addr = Array.isArray(addressContainer) ? addressContainer[0] : addressContainer;
	return {
		street: addr?.street || '',
		city: addr?.city || '',
		state: addr?.state || '',
		postcode: addr?.postcode || '',
		country: addr?.country || 'Australia',
	};
}

/**
 * Check if an address has any meaningful content
 */
export function hasAddressContent(parts: AddressParts): boolean {
	return !!(
		parts.street ||
		parts.city ||
		parts.state ||
		parts.postcode
	);
}

/**
 * Australian states for validation
 */
export const AUSTRALIAN_STATES = [
	'NSW',
	'VIC',
	'QLD',
	'WA',
	'SA',
	'TAS',
	'ACT',
	'NT',
] as const;

export type AustralianState = (typeof AUSTRALIAN_STATES)[number];

/**
 * Validate an Australian postcode format
 */
export function isValidAustralianPostcode(postcode: string | undefined | null): boolean {
	if (!postcode) return false;
	return /^\d{4}$/.test(postcode.trim());
}
