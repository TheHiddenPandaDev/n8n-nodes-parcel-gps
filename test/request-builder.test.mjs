import { describe, expect, it } from 'vitest';
import {
	addressSearchRequest,
	buildRequest,
	groundMotionRequest,
	parcelAtCoordinatesRequest,
	parcelByReferenceRequest,
	parcelGeometryRequest,
	requireCoordinate,
	resolveRequest,
	terrainRequest,
	unitsRequest,
} from '../nodes/ParcelGps/shared/request-builder';
import { ParcelGpsInputError } from '../nodes/ParcelGps/shared/input-error';

describe('buildRequest', () => {
	it('targets the Parcel GPS API and lets the node read error statuses itself', () => {
		const request = buildRequest('/api/resolve', { q: 'x' });
		expect(request).toMatchObject({
			method: 'GET',
			url: 'https://api.parcelgps.com/api/resolve',
			qs: { q: 'x' },
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
			headers: { Accept: 'application/json' },
		});
	});

	it('drops empty and undefined query values', () => {
		expect(buildRequest('/a', { country: '', cursor: undefined, limit: 0 }).qs).toEqual({ limit: 0 });
	});

	it('defaults to an empty query', () => {
		expect(buildRequest('/a').qs).toEqual({});
	});
});

describe('parcel requests', () => {
	it('encodes and trims the reference and sends the country', () => {
		const request = parcelByReferenceRequest('  12 34/5 ', 'PT');
		expect(request.url).toBe('https://api.parcelgps.com/api/catastro/12%2034%2F5');
		expect(request.qs).toEqual({ country: 'PT' });
	});

	it('omits the country when auto-detecting', () => {
		expect(parcelByReferenceRequest('9872023VH5797S0001WX', '').qs).toEqual({});
	});

	it('builds the geometry, units, terrain and ground motion paths', () => {
		expect(parcelGeometryRequest('R1', 'FR').url).toMatch(/\/api\/catastro\/R1\/polygon$/);
		expect(terrainRequest('R1', '').url).toMatch(/\/api\/catastro\/R1\/terrain$/);
		expect(groundMotionRequest('R1', 'IT').url).toMatch(/\/api\/catastro\/R1\/ground-motion$/);
		const units = unitsRequest('9872023VH5797S', 'ES', 'NEXTCURSOR');
		expect(units.url).toMatch(/\/api\/catastro\/9872023VH5797S\/units$/);
		expect(units.qs).toEqual({ country: 'ES', cursor: 'NEXTCURSOR' });
	});

	it('rejects an empty reference before calling the API', () => {
		expect(() => parcelByReferenceRequest('   ', '')).toThrow(ParcelGpsInputError);
		expect(() => terrainRequest(undefined, '')).toThrow('Cadastral Reference must not be empty');
	});
});

describe('coordinates', () => {
	it('sends lat and lng', () => {
		const request = parcelAtCoordinatesRequest(40.4168, -3.7038, '');
		expect(request.url).toBe('https://api.parcelgps.com/api/search/coordinates');
		expect(request.qs).toEqual({ lat: 40.4168, lng: -3.7038 });
	});

	it('accepts numeric strings from expressions', () => {
		expect(parcelAtCoordinatesRequest('48.85', '2.35', 'FR').qs).toEqual({ lat: 48.85, lng: 2.35, country: 'FR' });
	});

	it.each([
		[91, 0, 'Latitude'],
		[-91, 0, 'Latitude'],
		[0, 181, 'Longitude'],
		['abc', 0, 'Latitude'],
		['', 0, 'Latitude'],
		[Number.NaN, 0, 'Latitude'],
		[0, null, 'Longitude'],
	])('rejects lat=%s lon=%s', (lat, lon, label) => {
		expect(() => parcelAtCoordinatesRequest(lat, lon, '')).toThrow(label);
	});

	it('accepts the exact limits', () => {
		expect(requireCoordinate(-90, 'Latitude', 90)).toBe(-90);
		expect(requireCoordinate(180, 'Longitude', 180)).toBe(180);
	});
});

describe('resolve and address search', () => {
	it('sends the text and the optional hint', () => {
		expect(resolveRequest(' 40.4, -3.7 ', 'ES').qs).toEqual({ q: '40.4, -3.7', hint: 'ES' });
		expect(() => resolveRequest('', '')).toThrow('Text must not be empty');
	});

	it.each([
		[5, 5],
		[0, 5],
		[Number.NaN, 5],
		[-3, 1],
		[3.7, 3],
		[99, 10],
	])('bounds the limit %s to %s', (limit, expected) => {
		expect(addressSearchRequest('Calle Mayor 1', '', limit).qs.limit).toBe(expected);
	});

	it('requires an address', () => {
		expect(() => addressSearchRequest('  ', 'ES', 5)).toThrow('Address must not be empty');
		expect(addressSearchRequest('Calle Mayor 1', 'ES', 5).url).toBe(
			'https://api.parcelgps.com/api/search/address/candidates',
		);
	});
});
