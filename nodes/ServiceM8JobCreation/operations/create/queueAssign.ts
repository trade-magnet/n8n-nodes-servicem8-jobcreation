/**
 * Queue Assignment Operations
 * Assign job to queue (static or dynamic)
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import type { ServiceM8Queue } from '../../types';
import {
	serviceM8Request,
	parseArrayResponse,
	assignJobToQueue,
	findQueueByName,
} from '../../helpers/api';

export interface QueueAssignInput {
	jobUuid: string;
	enableQueue: boolean;
	queueDynamic: boolean;
	queueUuidInput: string;
	queueNameInput: string;
}

export interface QueueAssignResult {
	queueAssigned: boolean;
	queueName?: string;
	queueMissing?: string;
}

/**
 * Assign a job to a queue
 * Handles both static (UUID from dropdown) and dynamic (name lookup) modes
 */
export async function assignQueue(
	context: IExecuteFunctions,
	input: QueueAssignInput,
): Promise<QueueAssignResult> {
	if (!input.enableQueue) {
		return { queueAssigned: false };
	}

	let queueUuid = input.queueUuidInput;
	let queueName: string | undefined;
	let queueMissing: string | undefined;

	// Handle dynamic queue name lookup
	if (input.queueDynamic && input.queueNameInput) {
		const queuesResponse = await serviceM8Request(context, {
			method: 'GET',
			endpoint: '/api_1.0/queue.json',
			query: { $filter: 'active eq 1' },
		});
		const allQueues = parseArrayResponse<ServiceM8Queue>(queuesResponse);
		const foundQueue = findQueueByName(allQueues, input.queueNameInput);

		if (foundQueue) {
			queueUuid = foundQueue.uuid;
			queueName = foundQueue.name;
		} else {
			queueMissing = input.queueNameInput;
		}
	}

	if (queueUuid) {
		await assignJobToQueue(context, input.jobUuid, queueUuid);

		// Get queue name for output if not already set
		if (!queueName) {
			const queuesResponse = await serviceM8Request(context, {
				method: 'GET',
				endpoint: '/api_1.0/queue.json',
				query: { $filter: `uuid eq '${queueUuid}'` },
			});
			const queues = parseArrayResponse<ServiceM8Queue>(queuesResponse);
			queueName = queues[0]?.name;
		}

		return {
			queueAssigned: true,
			queueName,
		};
	}

	return {
		queueAssigned: false,
		queueMissing,
	};
}
