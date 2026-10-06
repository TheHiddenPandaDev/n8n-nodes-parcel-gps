import type { INodeProperties } from 'n8n-workflow';
import { TERRAIN_EXCLUDED_COUNTRIES } from '../shared/constants';
import { AUTO_DETECT, countriesExcept, countryOptions } from '../shared/country-options';

const forLand = { resource: ['land'] };

export const landOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forLand },
		options: [
			{
				name: 'Get Terrain',
				value: 'getTerrain',
				description: 'Get elevation, slope, aspect, protected areas and climate of a parcel',
				action: 'Get parcel terrain',
			},
			{
				name: 'Get Ground Motion',
				value: 'getGroundMotion',
				description: 'Get satellite-measured ground subsidence or uplift around a parcel',
				action: 'Get parcel ground motion',
			},
		],
		default: 'getTerrain',
	},
];

export const landFields: INodeProperties[] = [
	{
		displayName: 'Cadastral Reference',
		name: 'reference',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 9872023VH5797S0001WX',
		description: 'Official cadastral reference as written in its country',
		displayOptions: { show: forLand },
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		options: countryOptions(countriesExcept(TERRAIN_EXCLUDED_COUNTRIES)),
		default: AUTO_DETECT,
		description: 'Country of the reference. Leave on Auto-Detect to infer it from the reference format.',
		displayOptions: { show: forLand },
	},
];
