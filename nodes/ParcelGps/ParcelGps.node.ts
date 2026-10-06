import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';
import { addressFields, addressOperations } from './descriptions/address-description';
import { buildingFields, buildingOperations } from './descriptions/building-description';
import { landFields, landOperations } from './descriptions/land-description';
import { parcelFields, parcelOperations } from './descriptions/parcel-description';
import { resolverFields, resolverOperations } from './descriptions/resolver-description';
import { CREDENTIAL_NAME } from './shared/constants';
import { ParcelGpsInputError } from './shared/input-error';
import {
	ParcelGpsApiError,
	runOperation,
	type FullResponse,
	type Transport,
} from './shared/operation-runner';

export class ParcelGps implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Parcel GPS',
		name: 'parcelGps',
		icon: { light: 'file:../../icons/parcel-gps.svg', dark: 'file:../../icons/parcel-gps.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Official cadastral parcels from 29 European countries by reference, coordinates or free text',
		defaults: {
			name: 'Parcel GPS',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: CREDENTIAL_NAME,
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Address', value: 'address' },
					{ name: 'Building', value: 'building' },
					{ name: 'Land', value: 'land' },
					{ name: 'Parcel', value: 'parcel' },
					{ name: 'Resolver', value: 'resolver' },
				],
				default: 'parcel',
			},
			...parcelOperations,
			...parcelFields,
			...resolverOperations,
			...resolverFields,
			...addressOperations,
			...addressFields,
			...buildingOperations,
			...buildingFields,
			...landOperations,
			...landFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const transport: Transport = async (options: IHttpRequestOptions) =>
			(await this.helpers.httpRequestWithAuthentication.call(
				this,
				CREDENTIAL_NAME,
				options,
			)) as FullResponse;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const read = (name: string) => this.getNodeParameter(name, itemIndex, '');
				const results = await runOperation(resource, operation, read, transport);
				for (const json of results) {
					returnData.push({ json, pairedItem: { item: itemIndex } });
				}
			} catch (error) {
				const nodeError = toNodeError(this, error, itemIndex);
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: nodeError.message, description: nodeError.description ?? '' } as IDataObject,
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw nodeError;
			}
		}

		return [returnData];
	}
}

function toNodeError(
	context: IExecuteFunctions,
	error: unknown,
	itemIndex: number,
): NodeApiError | NodeOperationError {
	if (error instanceof ParcelGpsApiError) {
		return new NodeApiError(context.getNode(), (error.body ?? {}) as JsonObject, {
			message: error.details.message,
			description: error.details.description,
			httpCode: error.details.httpCode,
			itemIndex,
		});
	}
	if (error instanceof ParcelGpsInputError) {
		return new NodeOperationError(context.getNode(), error.message, { itemIndex });
	}
	if (error instanceof NodeApiError || error instanceof NodeOperationError) return error;
	return new NodeApiError(context.getNode(), error as JsonObject, { itemIndex });
}
