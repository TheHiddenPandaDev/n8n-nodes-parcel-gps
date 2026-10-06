import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ParcelGpsApi implements ICredentialType {
	name = 'parcelGpsApi';

	displayName = 'Parcel GPS API';

	icon: Icon = { light: 'file:../icons/parcel-gps.svg', dark: 'file:../icons/parcel-gps.dark.svg' };

	documentationUrl = 'https://github.com/TheHiddenPandaDev/n8n-nodes-parcel-gps#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Parcel GPS API key. Get a free one at https://www.parcelgps.com/developers.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.parcelgps.com',
			url: '/api/locations/provinces',
			method: 'GET',
		},
	};
}
