/**
 * Methods Index
 * Exports all node methods (loadOptions, etc.)
 */

import { getCategories, getBadges, getQueues, getJobs } from './loadOptions';

export const methods = {
	loadOptions: {
		getCategories,
		getBadges,
		getQueues,
		getJobs,
	},
};
