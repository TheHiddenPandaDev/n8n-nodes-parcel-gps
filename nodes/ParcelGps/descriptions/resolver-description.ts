import type { INodeProperties } from 'n8n-workflow';
import { AUTO_DETECT, countryOptions } from '../shared/country-options';

const forResolver = { resource: ['resolver'] };

export const resolverOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: forResolver },
		options: [
			{
				name: 'Resolve',
				value: 'resolve',
				description:
					'Classify free text as a cadastral reference, coordinates or a place name and detect its country',
				action: 'Resolve free text',
			},
		],
		default: 'resolve',
	},
];

export const resolverFields: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 9872023VH5797S0001WX or 40.4168, -3.7038',
		description: 'A cadastral reference, a pair of coordinates or a place name',
		displayOptions: { show: forResolver },
	},
	{
		displayName: 'Country Hint',
		name: 'hint',
		type: 'options',
		options: countryOptions(),
		default: AUTO_DETECT,
		description: 'Optional country to rank first when the text could belong to several countries',
		displayOptions: { show: forResolver },
	},
];
