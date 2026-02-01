import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ServiceM8Api implements ICredentialType {
	name = 'serviceM8Api';
	displayName = 'ServiceM8 API';
	documentationUrl = 'https://developer.servicem8.com/docs/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your ServiceM8 API Key from Settings > API Access',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Api-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.servicem8.com',
			url: '/api_1.0/vendor.json',
			method: 'GET',
		},
	};
}
