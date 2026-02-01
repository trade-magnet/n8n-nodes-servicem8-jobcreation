/**
 * Execute Method
 * Main execution logic for the ServiceM8 Smart Job Creation node
 */

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { executeJobCreation, executeJobUpdate } from './operations';
import { createEmptyExecutionResult, createEmptyUpdateResult } from './types';

export async function execute(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const operation = this.getNodeParameter('operation', i) as string;

			let result: IDataObject;
			if (operation === 'update') {
				result = (await executeJobUpdate(this, i)) as unknown as IDataObject;
			} else {
				result = (await executeJobCreation(this, i)) as unknown as IDataObject;
			}

			returnData.push({
				json: result,
				pairedItem: i,
			});
		} catch (error) {
			if (this.continueOnFail()) {
				const operation = this.getNodeParameter('operation', i) as string;
				const errorResult = operation === 'update'
					? { ...createEmptyUpdateResult(), error: (error as Error).message }
					: { ...createEmptyExecutionResult(), error: (error as Error).message };

				returnData.push({
					json: errorResult as unknown as IDataObject,
					pairedItem: i,
				});
			} else {
				throw error;
			}
		}
	}

	return [returnData];
}
