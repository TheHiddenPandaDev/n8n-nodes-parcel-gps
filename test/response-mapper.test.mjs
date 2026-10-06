import { describe, expect, it } from 'vitest';
import {
	compact,
	latLngRingToPolygon,
	mapAddressCandidates,
	mapGeometry,
	mapParcel,
	mapResolve,
	mapUnits,
	normalizeGeoJson,
	unwrapData,
} from '../nodes/ParcelGps/shared/response-mapper';
import { addressCandidates, foreignPointMatch, pointMatch, resolveResult, spanishParcel, unitsPage } from './fixtures.mjs';

describe('mapParcel', () => {
	it('flattens a Spanish parcel to English keys without geometry by default', () => {
		expect(mapParcel(spanishParcel, false)).toEqual({
			reference: '9872023VH5797S0001WX',
			country: 'ES',
			lat: 40.4168,
			lon: -3.7038,
			areaM2: 250,
			builtAreaM2: 120,
			address: 'CL MAYOR 1',
			postalCode: '28013',
			municipality: 'MADRID',
			province: 'MADRID',
			landUse: 'Residencial',
			landClass: 'Urbano',
			constructionYear: 1950,
			dwellings: 4,
			source: 'catastro',
			googleMapsUrl: 'https://www.google.com/maps?q=40.4168,-3.7038',
		});
	});

	it('adds a closed GeoJSON polygon in lon/lat order when asked', () => {
		const { geometry } = mapParcel(spanishParcel, true);
		expect(geometry).toEqual({
			type: 'Polygon',
			coordinates: [
				[
					[-3.7038, 40.4168],
					[-3.7038, 40.4169],
					[-3.7037, 40.4169],
					[-3.7038, 40.4168],
				],
			],
		});
	});

	it('sets geometry to null when asked and the source has no outline', () => {
		expect(mapParcel(pointMatch, true).geometry).toBeNull();
	});

	it('reads the point shape returned by the coordinates search', () => {
		expect(mapParcel(pointMatch, false)).toEqual({
			reference: '9872023VH5797S0001WX',
			reference14: '9872023VH5797S',
			country: 'ES',
			lat: 40.4168,
			lon: -3.7038,
			address: 'CL MAYOR 1',
			municipality: 'MADRID',
			province: 'MADRID',
			propertyType: 'Urbano',
			googleMapsUrl: 'https://www.google.com/maps?q=40.4168,-3.7038',
		});
	});

	it('reads a foreign parcel found by coordinates, keeping an already closed ring', () => {
		const parcel = mapParcel(foreignPointMatch, true);
		expect(parcel).toMatchObject({ reference: '75056000AB0001', country: 'FR', lat: 48.85, lon: 2.35, areaM2: 812 });
		expect(parcel.geometry.coordinates[0]).toHaveLength(4);
	});

	it('falls back to the requested country and drops zero or invalid numbers', () => {
		const parcel = mapParcel({ refCatastral: 'X', latitud: 'n/a', superficieParcela: 0, anioConstruccion: -1 }, false, 'IT');
		expect(parcel).toEqual({ reference: 'X', country: 'IT' });
	});
});

describe('geometry helpers', () => {
	it('ignores malformed points and refuses rings with fewer than 3 points', () => {
		expect(latLngRingToPolygon([[1, 2], 'x', [null, 3], [3, 4]])).toBeNull();
		expect(latLngRingToPolygon('nope')).toBeNull();
		expect(latLngRingToPolygon([[1, 2], [3, 4], [5, 6]]).coordinates[0]).toHaveLength(4);
	});

	it('unwraps Feature and FeatureCollection GeoJSON', () => {
		const polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };
		expect(normalizeGeoJson(polygon)).toBe(polygon);
		expect(normalizeGeoJson({ type: 'Feature', geometry: polygon })).toBe(polygon);
		expect(normalizeGeoJson({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: polygon }] })).toBe(polygon);
		expect(normalizeGeoJson({ type: 'Point' })).toBeNull();
		expect(normalizeGeoJson(undefined)).toBeNull();
	});

	it('prefers the GeoJSON of the polygon endpoint and reads its centroid and area', () => {
		const polygon = { type: 'MultiPolygon', coordinates: [] };
		expect(
			mapGeometry({ refcat: 'R1', pais: 'PT', geojson: { type: 'Feature', geometry: polygon }, centroid: { latitude: 38.7, longitude: -9.1 }, area: 500 }, 'R1'),
		).toEqual({ reference: 'R1', country: 'PT', lat: 38.7, lon: -9.1, areaM2: 500, geometry: polygon });
	});

	it('builds the geometry from the ring when the polygon endpoint sends no GeoJSON', () => {
		const geometry = mapGeometry({ poligono: spanishParcel.poligono }, 'ASKED', 'ES');
		expect(geometry.reference).toBe('ASKED');
		expect(geometry.country).toBe('ES');
		expect(geometry.geometry.type).toBe('Polygon');
	});
});

describe('mapResolve', () => {
	it('promotes the most confident candidate', () => {
		expect(mapResolve(resolveResult)).toMatchObject({
			input: '9872023VH5797S0001WX',
			ambiguous: false,
			country: 'ES',
			kind: 'reference',
			normalized: '9872023VH5797S0001WX',
			confidence: 1,
			supported: true,
		});
	});

	it('handles an empty or malformed answer', () => {
		expect(mapResolve({ input: 'zz', ambiguous: true })).toEqual({ input: 'zz', ambiguous: true, candidates: [] });
		expect(mapResolve({ candidates: [{ country: 'FR' }, null] }).country).toBe('FR');
	});
});

describe('mapAddressCandidates', () => {
	it('returns one flat item per candidate', () => {
		expect(mapAddressCandidates(addressCandidates)).toEqual([
			{
				reference: '9872023VH5797S',
				country: 'ES',
				address: 'CL MAYOR 1',
				number: 1,
				postalCode: '28013',
				municipality: 'MADRID',
				province: 'MADRID',
				lat: 40.4168,
				lon: -3.7038,
				confidence: 0.98,
				matchesNumber: true,
				matchesMunicipality: true,
				landUse: 'Residencial',
				dwellings: 12,
				constructionYear: 1950,
				attribution: 'Dirección General del Catastro',
			},
		]);
	});

	it('returns nothing when there are no candidates', () => {
		expect(mapAddressCandidates({})).toEqual([]);
	});
});

describe('mapUnits', () => {
	it('merges pages into one building', () => {
		const second = unitsPage({ unidades: [{ refCatastral: 'B', superficie: 20, anio: 0 }], construcciones: undefined });
		const building = mapUnits([unitsPage({ truncated: true, nextCursor: 'C' }), second]);
		expect(building).toMatchObject({
			reference: '9872023VH5797S',
			generalUse: 'Residencial',
			totalUnits: 2,
			source: 'clone',
			dataDate: '2026-09-01',
		});
		expect(building.units).toEqual([
			{
				reference: '9872023VH5797S0001WX',
				staircase: '1',
				floor: '01',
				door: 'A',
				use: 'Vivienda',
				areaM2: 80,
				description: 'VIVIENDA',
				participation: 25.5,
				year: 1950,
			},
			{ reference: 'B', areaM2: 20 },
		]);
		expect(building.constructions).toHaveLength(1);
	});

	it('counts the units when the total is missing', () => {
		expect(mapUnits([unitsPage({ totalUnidadesFinca: undefined, unidades: 'bad' })]).totalUnits).toBe(0);
		expect(mapUnits([]).units).toEqual([]);
	});
});

describe('small helpers', () => {
	it('unwraps the data envelope only when present', () => {
		expect(unwrapData({ success: true, data: { a: 1 } })).toEqual({ a: 1 });
		expect(unwrapData({ a: 1 })).toEqual({ a: 1 });
		expect(unwrapData('text')).toEqual({});
	});

	it('compact keeps false, zero and null but drops empty strings and undefined', () => {
		expect(compact({ a: false, b: 0, c: null, d: '', e: undefined })).toEqual({ a: false, b: 0, c: null });
	});
});
