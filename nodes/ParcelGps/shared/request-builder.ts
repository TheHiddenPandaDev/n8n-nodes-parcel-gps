import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import { API_BASE_URL, DEFAULT_ADDRESS_LIMIT, MAX_ADDRESS_LIMIT } from './constants';
import { ParcelGpsInputError } from './input-error';

type QueryValue = string | number | undefined;

const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;

export function buildRequest(path: string, query: Record<string, QueryValue> = {}): IHttpRequestOptions {
	const qs: IDataObject = {};
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined && value !== '') qs[key] = value;
	}
	return {
		method: 'GET',
		url: `${API_BASE_URL}${path}`,
		qs,
		headers: { Accept: 'application/json' },
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};
}

export function parcelPath(reference: string, suffix = ''): string {
	const trimmed = requireText(reference, 'Cadastral Reference');
	return `/api/catastro/${encodeURIComponent(trimmed)}${suffix}`;
}

export function requireText(value: unknown, label: string): string {
	const text = typeof value === 'string' ? value.trim() : '';
	if (!text) throw new ParcelGpsInputError(`${label} must not be empty`);
	return text;
}

export function requireCoordinate(value: unknown, label: string, limit: number): number {
	const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
	if (typeof number !== 'number' || !Number.isFinite(number) || Math.abs(number) > limit) {
		throw new ParcelGpsInputError(`${label} must be a number between -${limit} and ${limit}`);
	}
	return number;
}

export function parcelByReferenceRequest(reference: string, country: string): IHttpRequestOptions {
	return buildRequest(parcelPath(reference), { country });
}

export function parcelGeometryRequest(reference: string, country: string): IHttpRequestOptions {
	return buildRequest(parcelPath(reference, '/polygon'), { country });
}

export function parcelAtCoordinatesRequest(lat: unknown, lon: unknown, country: string): IHttpRequestOptions {
	return buildRequest('/api/search/coordinates', {
		lat: requireCoordinate(lat, 'Latitude', LATITUDE_LIMIT),
		lng: requireCoordinate(lon, 'Longitude', LONGITUDE_LIMIT),
		country,
	});
}

export function resolveRequest(text: string, hint: string): IHttpRequestOptions {
	return buildRequest('/api/resolve', { q: requireText(text, 'Text'), hint });
}

export function addressSearchRequest(address: string, country: string, limit: number): IHttpRequestOptions {
	const bounded = Math.min(Math.max(Math.trunc(limit) || DEFAULT_ADDRESS_LIMIT, 1), MAX_ADDRESS_LIMIT);
	return buildRequest('/api/search/address/candidates', {
		q: requireText(address, 'Address'),
		country,
		limit: bounded,
	});
}

export function unitsRequest(reference: string, country: string, cursor?: string): IHttpRequestOptions {
	return buildRequest(parcelPath(reference, '/units'), { country, cursor });
}

export function terrainRequest(reference: string, country: string): IHttpRequestOptions {
	return buildRequest(parcelPath(reference, '/terrain'), { country });
}

export function groundMotionRequest(reference: string, country: string): IHttpRequestOptions {
	return buildRequest(parcelPath(reference, '/ground-motion'), { country });
}
