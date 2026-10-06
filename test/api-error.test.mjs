import { describe, expect, it } from 'vitest';
import { describeApiError } from '../nodes/ParcelGps/shared/api-error';

describe('describeApiError', () => {
	it('explains an invalid key and keeps the API message', () => {
		const error = describeApiError(401, { success: false, error: 'Invalid API key', code: 'KEY_AUTH_002' });
		expect(error).toMatchObject({ httpCode: '401', code: 'KEY_AUTH_002', message: 'Invalid or missing API key' });
		expect(error.description).toContain('parcelgps.com/developers');
		expect(error.description).toContain('API message: Invalid API key');
	});

	it('uses the message field when there is no error field', () => {
		expect(describeApiError(401, { message: 'Missing key' }).description).toContain('API message: Missing key');
	});

	it('survives a body that is not JSON', () => {
		const error = describeApiError(401, 'Unauthorized');
		expect(error.code).toBeUndefined();
		expect(error.description).not.toContain('API message');
		expect(describeApiError(401, [1, 2]).message).toBe('Invalid or missing API key');
		expect(describeApiError(401, null).message).toBe('Invalid or missing API key');
	});

	it('separates an exhausted monthly quota from a burst rate limit', () => {
		const quota = describeApiError(429, { code: 'KEY_AUTH_004', error: 'Quota exceeded' });
		expect(quota.message).toBe('Monthly API quota exhausted');
		expect(quota.description).toContain('Upgrade or top up');

		const burst = describeApiError(429, { code: 'RATE_LIMIT' }, 12);
		expect(burst.message).toBe('Too many requests');
		expect(burst.description).toContain('Retry after 12 seconds');
		expect(describeApiError(429, {}).description).not.toContain('Retry after');
	});

	it('reports a parcel that does not exist', () => {
		const error = describeApiError(404, { code: 'CNV_002', error: 'Referencia no encontrada' });
		expect(error.message).toBe('Parcel not found');
		expect(error.description).toContain('not charged');
	});

	it('lists the supported countries on a coverage error', () => {
		const error = describeApiError(422, {
			code: 'CNV_COVERAGE',
			error: 'No disponible',
			data: { country: 'HR', supportedCountries: ['ES', 'PT', 7] },
		});
		expect(error.message).toBe('This country or feature is not covered');
		expect(error.description).toContain('Supported countries for this operation: ES, PT.');
	});

	it('handles a coverage error without a country list', () => {
		expect(describeApiError(422, { code: 'CNV_COVERAGE' }).description).toBe('Check the Country field.');
	});

	it('lists the candidate countries of an ambiguous reference', () => {
		const error = describeApiError(300, {
			code: 'CNV_AMBIGUOUS',
			data: { candidates: [{ country: 'ES' }, { country: 'PT' }, { country: '' }, 'junk'] },
		});
		expect(error.message).toBe('The reference matches more than one country');
		expect(error.description).toBe('Possible countries: ES, PT. Set the Country field to pick one.');
		expect(describeApiError(300, {}).description).toBe('Set the Country field to pick one.');
	});

	it('points a place name to the coordinates operation', () => {
		const error = describeApiError(422, {
			code: 'CNV_PLACE_NAME',
			parsed: { location: { lat: 40.4, lng: -3.7, label: 'Madrid' } },
		});
		expect(error.message).toBe('The text is a place name, not a cadastral reference');
		expect(error.description).toBe('It was geocoded to Madrid (40.4, -3.7). Use Get Parcel at Coordinates with that point.');
		expect(
			describeApiError(422, { code: 'CNV_PLACE_NAME', data: { location: { address: 'Gran Via' } } }).description,
		).toContain('geocoded to Gran Via.');
		expect(describeApiError(422, { code: 'CNV_PLACE_NAME' }).description).toContain('geocoded to the place.');
	});

	it.each([
		[400, 'The request was rejected'],
		[422, 'The request was rejected'],
		[403, 'This API key cannot use this operation'],
		[500, 'Parcel GPS server error'],
		[502, 'Parcel GPS server error'],
		[418, 'Unexpected response (HTTP 418)'],
	])('maps HTTP %s', (status, message) => {
		expect(describeApiError(status, {}).message).toBe(message);
	});

	it('suggests retrying when the official source is down', () => {
		expect(describeApiError(503, {}, 30).description).toContain('Retry after 30 seconds');
		expect(describeApiError(503, {}).description).not.toContain('Retry after');
	});
});
