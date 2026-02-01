/**
 * Badges Assignment Operations
 * Assign badges to job (static or dynamic)
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ServiceM8Badge } from '../../types';
import {
	serviceM8Request,
	parseArrayResponse,
	assignBadgesToJob,
	findBadgeByName,
} from '../../helpers/api';

export interface BadgesAssignInput {
	jobUuid: string;
	enableBadges: boolean;
	badgesDynamic: boolean;
	badgeUuidsInput: string[];
	badgeNamesInput: string;
}

export interface BadgesAssignResult {
	badgesAssigned: string[];
	badgesMissing: string[];
}

/**
 * Assign badges to a job
 * Handles both static (UUIDs from dropdown) and dynamic (name lookup) modes
 */
export async function assignBadges(
	context: IExecuteFunctions,
	input: BadgesAssignInput,
): Promise<BadgesAssignResult> {
	const badgesAssigned: string[] = [];
	const badgesMissing: string[] = [];

	if (!input.enableBadges) {
		return { badgesAssigned, badgesMissing };
	}

	// Get all badges for lookup
	const badgesResponse = await serviceM8Request(context, {
		method: 'GET',
		endpoint: '/api_1.0/badge.json',
		query: { $filter: 'active eq 1' },
	});
	const allBadges = parseArrayResponse<ServiceM8Badge>(badgesResponse);
	const badgeMap = new Map(allBadges.map((b) => [b.uuid, b.name]));

	let badgeUuidsToApply: string[] = [];

	if (input.badgesDynamic && input.badgeNamesInput) {
		// Dynamic mode: parse comma-separated names and look them up
		const badgeNames = input.badgeNamesInput
			.split(',')
			.map((n) => n.trim())
			.filter((n) => n);

		for (const name of badgeNames) {
			const foundBadge = findBadgeByName(allBadges, name);
			if (foundBadge) {
				badgeUuidsToApply.push(foundBadge.uuid);
			} else {
				badgesMissing.push(name);
			}
		}
	} else {
		// Static mode: use UUIDs directly
		badgeUuidsToApply = input.badgeUuidsInput;
	}

	// Assign badges (all at once via job update)
	if (badgeUuidsToApply.length > 0) {
		await assignBadgesToJob(context, input.jobUuid, badgeUuidsToApply);

		// Record which badges were assigned
		for (const badgeUuid of badgeUuidsToApply) {
			const badgeName = badgeMap.get(badgeUuid);
			if (badgeName) {
				badgesAssigned.push(badgeName);
			}
		}
	}

	return {
		badgesAssigned,
		badgesMissing,
	};
}
