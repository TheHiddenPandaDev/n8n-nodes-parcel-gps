import { describe, expect, it, vi } from 'vitest';
import { ParcelGpsApiError, runOperation, send } from '../nodes/ParcelGps/shared/operation-runner';
import { ParcelGpsInputError } from '../nodes/ParcelGps/shared/input-error';
import { MAX_UNIT_PAGES } from '../nodes/ParcelGps/shared/constants';
import { addressCandidates, failure, ok, pointMatch, resolveResult, spanishParcel, unitsPage } from './fixtures.mjs';

function reader(values) {
	return (name) => (name in values ? values[name] : '');
}

function transportReturning(...responses) {
	const transport = vi.fn();
	for (const response of responses) transport.mockResolvedValueOnce(response);
	return transport;
}

describe('send', () => {
	it('unwraps the data of a 2xx answer', async () => {
		await expect(send(transportReturning(ok({ a: 1 })), {})).resolves.toEqual({ a: 1 });
	});

	it('turns an error status into a described API error with Retry-After', async () => {
		const transport = transportReturning(failure(429, { code: 'RATE' }, { 'retry-after': ['7'] }));
		const error = await send(transport, {}).catch((caught) => caught);
		expect(error).toBeInstanceOf(ParcelGpsApiError);
		expect(error.details.description).toContain('Retry after 7 seconds');
		expect(error.body).toEqual({ code: 'RATE' });
	});

	it('ignores an unusable Retry-After header and a missing header map', async () => {
		const bad = await send(transportReturning(failure(503, {}, { 'retry-after': 'soon' })), {}).catch((e) => e);
		expect(bad.details.description).not.toContain('Retry after');
		const none = await send(transportReturning({ statusCode: 500, body: {} }), {}).catch((e) => e);
		expect(none.details.httpCode).toBe('500');
	});

	it('treats a 300 ambiguous answer as an error', async () => {
		const error = await send(transportReturning(failure(300, { code: 'CNV_AMBIGUOUS' })), {}).catch((e) => e);
		expect(error.details.message).toBe('The reference matches more than one country');
	});
});

describe('runOperation', () => {
	it('gets a parcel by reference with geometry', async () => {
		const transport = transportReturning(ok(spanishParcel));
		const [parcel] = await runOperation(
			'parcel',
			'getByReference',
			reader({ reference: ' 9872023VH5797S0001WX ', country: 'ES', includeGeometry: true }),
			transport,
		);
		expect(transport.mock.calls[0][0]).toMatchObject({
			url: 'https://api.parcelgps.com/api/catastro/9872023VH5797S0001WX',
			qs: { country: 'ES' },
		});
		expect(parcel.reference).toBe('9872023VH5797S0001WX');
		expect(parcel.geometry.type).toBe('Polygon');
	});

	it('gets the parcel at coordinates without geometry', async () => {
		const transport = transportReturning(ok(pointMatch));
		const [parcel] = await runOperation(
			'parcel',
			'getAtCoordinates',
			reader({ latitude: 40.4168, longitude: -3.7038, includeGeometry: false }),
			transport,
		);
		expect(transport.mock.calls[0][0].qs).toEqual({ lat: 40.4168, lng: -3.7038 });
		expect(parcel).toMatchObject({ reference: '9872023VH5797S0001WX', lat: 40.4168, lon: -3.7038 });
		expect(parcel).not.toHaveProperty('geometry');
	});

	it('gets the geometry of a parcel', async () => {
		const transport = transportReturning(ok({ refcat: 'R1', poligono: spanishParcel.poligono, area: 9 }));
		const [geometry] = await runOperation('parcel', 'getGeometry', reader({ reference: 'R1' }), transport);
		expect(transport.mock.calls[0][0].url).toMatch(/\/R1\/polygon$/);
		expect(geometry).toMatchObject({ reference: 'R1', areaM2: 9 });
	});

	it('resolves free text', async () => {
		const transport = transportReturning(ok(resolveResult));
		const [result] = await runOperation('resolver', 'resolve', reader({ text: '9872023VH5797S0001WX', hint: 'ES' }), transport);
		expect(transport.mock.calls[0][0].qs).toEqual({ q: '9872023VH5797S0001WX', hint: 'ES' });
		expect(result.country).toBe('ES');
	});

	it('searches an address and returns one item per candidate', async () => {
		const transport = transportReturning(ok(addressCandidates));
		const results = await runOperation('address', 'search', reader({ address: 'Calle Mayor 1', country: 'ES', maxResults: 3 }), transport);
		expect(transport.mock.calls[0][0].qs).toEqual({ q: 'Calle Mayor 1', country: 'ES', limit: 3 });
		expect(results).toHaveLength(1);
	});

	it('simplifies a parcel to at most ten fields and keeps the requested geometry', async () => {
		const transport = transportReturning(ok(spanishParcel));
		const [parcel] = await runOperation(
			'parcel',
			'getByReference',
			reader({ reference: '9872023VH5797S0001WX', includeGeometry: true, simplify: true }),
			transport,
		);
		expect(Object.keys(parcel).length).toBeLessThanOrEqual(10);
		expect(parcel).toMatchObject({ reference: '9872023VH5797S0001WX', municipality: 'MADRID', landUse: 'Residencial' });
		expect(parcel.geometry.type).toBe('Polygon');
		expect(parcel).not.toHaveProperty('googleMapsUrl');
		expect(parcel).not.toHaveProperty('constructionYear');
	});

	it('simplifies the parcel at coordinates without inventing missing fields', async () => {
		const transport = transportReturning(ok(pointMatch));
		const [parcel] = await runOperation(
			'parcel',
			'getAtCoordinates',
			reader({ latitude: 40.4168, longitude: -3.7038, simplify: true }),
			transport,
		);
		expect(parcel).toEqual({
			reference: '9872023VH5797S0001WX',
			country: 'ES',
			lat: 40.4168,
			lon: -3.7038,
			address: 'CL MAYOR 1',
			municipality: 'MADRID',
			province: 'MADRID',
		});
	});

	it('simplifies every address candidate to at most ten fields', async () => {
		const transport = transportReturning(ok(addressCandidates));
		const [candidate] = await runOperation(
			'address',
			'search',
			reader({ address: 'Calle Mayor 1', maxResults: 3, simplify: true }),
			transport,
		);
		expect(Object.keys(candidate).length).toBeLessThanOrEqual(10);
		expect(candidate).toMatchObject({ reference: '9872023VH5797S', confidence: 0.98, landUse: 'Residencial' });
		expect(candidate).not.toHaveProperty('matchesNumber');
		expect(candidate).not.toHaveProperty('attribution');
	});

	it('follows the units cursor until the last page', async () => {
		const transport = transportReturning(
			ok(unitsPage({ truncated: true, nextCursor: 'CURSOR2' })),
			ok(unitsPage({ unidades: [{ refCatastral: 'B' }] })),
		);
		const [building] = await runOperation('building', 'getUnits', reader({ reference: '9872023VH5797S', country: 'ES' }), transport);
		expect(transport).toHaveBeenCalledTimes(2);
		expect(transport.mock.calls[1][0].qs).toEqual({ country: 'ES', cursor: 'CURSOR2' });
		expect(building.units).toHaveLength(2);
	});

	it('stops when a truncated page has no cursor', async () => {
		const transport = transportReturning(ok(unitsPage({ truncated: true, nextCursor: '' })));
		await runOperation('building', 'getUnits', reader({ reference: 'R' }), transport);
		expect(transport).toHaveBeenCalledTimes(1);
	});

	it('gives up after the maximum number of unit pages', async () => {
		const transport = vi.fn().mockResolvedValue(ok(unitsPage({ truncated: true, nextCursor: 'AGAIN' })));
		await expect(runOperation('building', 'getUnits', reader({ reference: 'R' }), transport)).rejects.toThrow(
			ParcelGpsInputError,
		);
		expect(transport).toHaveBeenCalledTimes(MAX_UNIT_PAGES);
	});

	it.each([
		['getTerrain', '/terrain'],
		['getGroundMotion', '/ground-motion'],
	])('passes the %s answer through', async (operation, suffix) => {
		const transport = transportReturning(ok({ refcat: 'R', country: 'ES', status: 'ok', empty: '' }));
		const [result] = await runOperation('land', operation, reader({ reference: 'R', country: 'ES' }), transport);
		expect(transport.mock.calls[0][0].url.endsWith(`/api/catastro/R${suffix}`)).toBe(true);
		expect(result).toEqual({ refcat: 'R', country: 'ES', status: 'ok' });
	});

	it('propagates API errors such as 404 and coverage', async () => {
		const notFound = transportReturning(failure(404, { code: 'CNV_002' }));
		await expect(runOperation('parcel', 'getByReference', reader({ reference: 'R' }), notFound)).rejects.toMatchObject({
			details: { message: 'Parcel not found', httpCode: '404' },
		});
		const coverage = transportReturning(failure(422, { code: 'CNV_COVERAGE', data: { supportedCountries: ['ES'] } }));
		await expect(runOperation('land', 'getTerrain', reader({ reference: 'R' }), coverage)).rejects.toMatchObject({
			details: { code: 'CNV_COVERAGE' },
		});
	});

	it('rejects bad input before any request', async () => {
		const transport = vi.fn();
		await expect(runOperation('parcel', 'getByReference', reader({}), transport)).rejects.toThrow(ParcelGpsInputError);
		await expect(runOperation('parcel', 'getAtCoordinates', reader({ latitude: 100, longitude: 0 }), transport)).rejects.toThrow(
			'Latitude',
		);
		await expect(runOperation('parcel', 'delete', reader({}), transport)).rejects.toThrow('Unsupported operation');
		expect(transport).not.toHaveBeenCalled();
	});
});
