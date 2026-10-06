import type { INodeProperties } from 'n8n-workflow';
import { COORDINATES_ONLY_COUNTRIES } from '../shared/constants';
import { AUTO_DETECT, countriesExcept, countryOptions } from '../shared/country-options';

const forParcel = { resource: ['parcel'] };

export const parcelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forParcel },
		options: [
			{
				name: 'Get by Reference',
				value: 'getByReference',
				description: 'Get an official cadastral parcel from its cadastral reference',
				action: 'Get a parcel by cadastral reference',
			},
			{
				name: 'Get at Coordinates',
				value: 'getAtCoordinates',
				description: 'Get the cadastral parcel that contains a WGS84 point',
				action: 'Get the parcel at coordinates',
			},
			{
				name: 'Get Geometry',
				value: 'getGeometry',
				description: 'Get the parcel outline as GeoJSON with its centroid and area',
				action: 'Get the geometry of a parcel',
			},
		],
		default: 'getByReference',
	},
];

export const parcelFields: INodeProperties[] = [
	{
		displayName: 'Cadastral Reference',
		name: 'reference',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 9872023VH5797S0001WX',
		description: 'Official cadastral reference as written in its country',
		displayOptions: { show: { ...forParcel, operation: ['getByReference', 'getGeometry'] } },
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 7 },
		placeholder: 'e.g. 40.4168',
		description: 'Latitude in WGS84 decimal degrees',
		displayOptions: { show: { ...forParcel, operation: ['getAtCoordinates'] } },
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 7 },
		placeholder: 'e.g. -3.7038',
		description: 'Longitude in WGS84 decimal degrees',
		displayOptions: { show: { ...forParcel, operation: ['getAtCoordinates'] } },
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		options: countryOptions(countriesExcept(COORDINATES_ONLY_COUNTRIES)),
		default: AUTO_DETECT,
		description:
			'Country of the reference. Leave on Auto-Detect to infer it from the reference format.',
		displayOptions: { show: { ...forParcel, operation: ['getByReference', 'getGeometry'] } },
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		options: countryOptions(),
		default: AUTO_DETECT,
		description: 'Country of the point. Leave on Auto-Detect to infer it from the coordinates.',
		displayOptions: { show: { ...forParcel, operation: ['getAtCoordinates'] } },
	},
	{
		displayName: 'Include Geometry',
		name: 'includeGeometry',
		type: 'boolean',
		default: false,
		description:
			'Whether to add the parcel outline as a GeoJSON Polygon in the geometry field when the official source provides it',
		displayOptions: { show: { ...forParcel, operation: ['getByReference', 'getAtCoordinates'] } },
	},
];
