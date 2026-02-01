/**
 * Category Assignment Operations
 * Assign category to job (static or dynamic)
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ServiceM8Category } from '../../types';
import {
	serviceM8Request,
	parseArrayResponse,
	updateJob,
	findCategoryByName,
} from '../../helpers/api';

export interface CategoryAssignInput {
	jobUuid: string;
	enableCategory: boolean;
	categoryDynamic: boolean;
	categoryUuidInput: string;
	categoryNameInput: string;
}

export interface CategoryAssignResult {
	categoryAssigned: boolean;
	categoryName?: string;
	categoryMissing?: string;
}

/**
 * Assign a category to a job
 * Handles both static (UUID from dropdown) and dynamic (name lookup) modes
 */
export async function assignCategory(
	context: IExecuteFunctions,
	input: CategoryAssignInput,
): Promise<CategoryAssignResult> {
	if (!input.enableCategory) {
		return { categoryAssigned: false };
	}

	let categoryUuid = input.categoryUuidInput;
	let categoryName: string | undefined;
	let categoryMissing: string | undefined;

	// Handle dynamic category name lookup
	if (input.categoryDynamic && input.categoryNameInput) {
		const categoriesResponse = await serviceM8Request(context, {
			method: 'GET',
			endpoint: '/api_1.0/category.json',
			query: { $filter: 'active eq 1' },
		});
		const allCategories = parseArrayResponse<ServiceM8Category>(categoriesResponse);
		const foundCategory = findCategoryByName(allCategories, input.categoryNameInput);

		if (foundCategory) {
			categoryUuid = foundCategory.uuid;
			categoryName = foundCategory.name;
		} else {
			categoryMissing = input.categoryNameInput;
		}
	}

	if (categoryUuid) {
		await updateJob(context, input.jobUuid, { category_uuid: categoryUuid });

		// Get category name for output if not already set
		if (!categoryName) {
			const categoriesResponse = await serviceM8Request(context, {
				method: 'GET',
				endpoint: '/api_1.0/category.json',
				query: { $filter: `uuid eq '${categoryUuid}'` },
			});
			const categories = parseArrayResponse<ServiceM8Category>(categoriesResponse);
			categoryName = categories[0]?.name;
		}

		return {
			categoryAssigned: true,
			categoryName,
		};
	}

	return {
		categoryAssigned: false,
		categoryMissing,
	};
}
