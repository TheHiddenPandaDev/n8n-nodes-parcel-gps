import type { INodeProperties } from 'n8n-workflow';
import { ADDRESS_COUNTRIES, DEFAULT_ADDRESS_LIMIT, MAX_ADDRESS_LIMIT } from '../shared/constants';
import { AUTO_DETECT, countryOptions } from '../shared/country-options';

const forAddress = { resource: ['address'] };

export const addressOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forAddress },
		options: [
			{
				name: 'Search',
				value: 'search',
				description: 'Find the cadastral parcels that match a postal address',
				action: 'Search parcels by address',
			},
		],
		default: 'search',
	},
];

export const addressFields: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Calle Mayor 1, Madrid',
		description: 'Street, number and town',
		displayOptions: { show: forAddress },
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		options: countryOptions(ADDRESS_COUNTRIES),
		default: AUTO_DETECT,
		description: 'Country of the address. Address search covers 27 countries.',
		displayOptions: { show: forAddress },
	},
	{
		displayName: 'Max Results',
		name: 'maxResults',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: MAX_ADDRESS_LIMIT },
		default: DEFAULT_ADDRESS_LIMIT,
		description: 'Max number of candidate parcels to return',
		displayOptions: { show: forAddress },
	},
];
