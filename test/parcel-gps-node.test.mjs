import { describe, expect, it, vi } from 'vitest';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { ParcelGps } from '../nodes/ParcelGps/ParcelGps.node';
import { ParcelGpsApi } from '../credentials/ParcelGpsApi.credentials';
import { failure, ok, spanishParcel } from './fixtures.mjs';

const node = { id: '1', name: 'Parcel GPS', type: 'n8n-nodes-parcel-gps.parcelGps', typeVersion: 1, position: [0, 0], parameters: {} };

function context({ items, parameters, responses, continueOnFail = false }) {
	const httpRequestWithAuthentication = vi.fn();
	for (const response of responses) {
		if (response instanceof Error) httpRequestWithAuthentication.mockRejectedValueOnce(response);
		else httpRequestWithAuthentication.mockResolvedValueOnce(response);
	}
	return {
		getInputData: () => items,
		getNodeParameter: (name, index, fallback) => {
			const values = parameters[index] ?? parameters[0];
			return name in values ? values[name] : fallback;
		},
		getNode: () => node,
		continueOnFail: () => continueOnFail,
		helpers: { httpRequestWithAuthentication },
	};
}

const byReference = { resource: 'parcel', operation: 'getByReference', reference: '9872023VH5797S0001WX', country: '', includeGeometry: false };

describe('ParcelGps node', () => {
	it('describes a usable tool with five resources and the Parcel GPS credential', () => {
		const { description } = new ParcelGps();
		expect(description.name).toBe('parcelGps');
		expect(description.usableAsTool).toBe(true);
		expect(description.description).toContain('29 European countries');
		expect(description.credentials).toEqual([{ name: 'parcelGpsApi', required: true }]);
		const resource = description.properties.find((property) => property.name === 'resource');
		expect(resource.options.map((option) => option.value)).toEqual(['address', 'building', 'land', 'parcel', 'resolver']);
	});

	it('runs one request per item through the credential and pairs the output', async () => {
		const ctx = context({ items: [{ json: {} }, { json: {} }], parameters: [byReference], responses: [ok(spanishParcel), ok(spanishParcel)] });
		const [output] = await new ParcelGps().execute.call(ctx);
		expect(output).toHaveLength(2);
		expect(output[1].pairedItem).toEqual({ item: 1 });
		expect(output[0].json.reference).toBe('9872023VH5797S0001WX');
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'parcelGpsApi',
			expect.objectContaining({ url: 'https://api.parcelgps.com/api/catastro/9872023VH5797S0001WX' }),
		);
	});

	it.each([
		[401, { code: 'KEY_AUTH_002', error: 'Invalid API key' }, 'Invalid or missing API key'],
		[429, { code: 'KEY_AUTH_004' }, 'Monthly API quota exhausted'],
		[404, {}, 'Parcel not found'],
		[422, { code: 'CNV_COVERAGE' }, 'This country or feature is not covered'],
	])('throws a NodeApiError on HTTP %s', async (status, body, message) => {
		const ctx = context({ items: [{ json: {} }], parameters: [byReference], responses: [failure(status, body)] });
		const error = await new ParcelGps().execute.call(ctx).catch((caught) => caught);
		expect(error).toBeInstanceOf(NodeApiError);
		expect(error.message).toBe(message);
		expect(error.httpCode).toBe(String(status));
	});

	it('throws a NodeOperationError on invalid input', async () => {
		const ctx = context({ items: [{ json: {} }], parameters: [{ ...byReference, reference: '' }], responses: [] });
		const error = await new ParcelGps().execute.call(ctx).catch((caught) => caught);
		expect(error).toBeInstanceOf(NodeOperationError);
		expect(error.message).toBe('Cadastral Reference must not be empty');
	});

	it('wraps transport failures in a NodeApiError', async () => {
		const ctx = context({ items: [{ json: {} }], parameters: [byReference], responses: [new Error('socket hang up')] });
		await expect(new ParcelGps().execute.call(ctx)).rejects.toBeInstanceOf(NodeApiError);
	});

	it('passes through errors that are already node errors', async () => {
		const original = new NodeOperationError(node, 'already wrapped');
		const ctx = context({ items: [{ json: {} }], parameters: [byReference], responses: [original] });
		await expect(new ParcelGps().execute.call(ctx)).rejects.toBe(original);
	});

	it('keeps going with an error item when Continue On Fail is on', async () => {
		const ctx = context({
			items: [{ json: {} }, { json: {} }],
			parameters: [byReference],
			responses: [failure(404, {}), ok(spanishParcel)],
			continueOnFail: true,
		});
		const [output] = await new ParcelGps().execute.call(ctx);
		expect(output[0]).toMatchObject({ json: { error: 'Parcel not found' }, pairedItem: { item: 0 } });
		expect(output[0].json.description).toContain('not charged');
		expect(output[1].json.reference).toBe('9872023VH5797S0001WX');
	});

	it('returns no items when an address has no candidates', async () => {
		const ctx = context({
			items: [{ json: {} }],
			parameters: [{ resource: 'address', operation: 'search', address: 'Nowhere 1', country: '', maxResults: 5 }],
			responses: [ok({ candidatos: [] })],
		});
		const [output] = await new ParcelGps().execute.call(ctx);
		expect(output).toEqual([]);
	});
});

describe('ParcelGpsApi credential', () => {
	it('sends the key in X-API-Key and tests it against the API', () => {
		const credential = new ParcelGpsApi();
		expect(credential.name).toBe('parcelGpsApi');
		expect(credential.displayName).toBe('Parcel GPS API');
		expect(credential.authenticate.properties.headers).toEqual({ 'X-API-Key': '={{$credentials.apiKey}}' });
		expect(credential.test.request).toMatchObject({ baseURL: 'https://api.parcelgps.com', method: 'GET' });
		expect(credential.properties[0]).toMatchObject({ name: 'apiKey', typeOptions: { password: true } });
	});
});
