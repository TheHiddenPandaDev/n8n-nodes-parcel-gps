import type { INodeProperties } from 'n8n-workflow';
import { UNITS_COUNTRIES } from '../shared/constants';
import { AUTO_DETECT, countryOptions } from '../shared/country-options';

const forBuilding = { resource: ['building'] };

export const buildingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forBuilding },
		options: [
			{
				name: 'Get Units',
				value: 'getUnits',
				description:
					'Get every dwelling, shop and garage of a building in Spain with its floor, door, use and area',
				action: 'Get building units',
			},
		],
		default: 'getUnits',
	},
];

export const buildingFields: INodeProperties[] = [
	{
		displayName: 'Cadastral Reference',
		name: 'reference',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 9872023VH5797S',
		description: 'The 14-character reference of the building (the first 14 characters of any unit)',
		displayOptions: { show: forBuilding },
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		options: countryOptions(UNITS_COUNTRIES),
		default: AUTO_DETECT,
		description:
			'Spain, or one of its foral cadastres. Each unit returned counts as one request of your quota.',
		displayOptions: { show: forBuilding },
	},
];
