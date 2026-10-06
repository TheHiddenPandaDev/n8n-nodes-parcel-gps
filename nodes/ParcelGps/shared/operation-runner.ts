import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import { describeApiError, type ApiErrorDescription } from './api-error';
import { MAX_UNIT_PAGES } from './constants';
import { ParcelGpsInputError } from './input-error';
import {
	addressSearchRequest,
	groundMotionRequest,
	parcelAtCoordinatesRequest,
	parcelByReferenceRequest,
	parcelGeometryRequest,
	resolveRequest,
	terrainRequest,
	unitsRequest,
} from './request-builder';
import {
	compact,
	mapAddressCandidates,
	mapGeometry,
	mapParcel,
	mapResolve,
	mapUnits,
	unwrapData,
} from './response-mapper';

export interface FullResponse {
	statusCode: number;
	body: unknown;
	headers?: Record<string, unknown>;
}

export type Transport = (options: IHttpRequestOptions) => Promise<FullResponse>;

export type ParameterReader = (name: string) => unknown;

export class ParcelGpsApiError extends Error {
	readonly details: ApiErrorDescription;

	readonly body: unknown;

	constructor(details: ApiErrorDescription, body: unknown) {
		super(details.message);
		this.name = 'ParcelGpsApiError';
		this.details = details;
		this.body = body;
	}
}

const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 299;

function headerNumber(headers: Record<string, unknown> | undefined, name: string): number | undefined {
	const raw = headers?.[name] ?? headers?.[name.toLowerCase()];
	const value = Number(Array.isArray(raw) ? raw[0] : raw);
	return Number.isFinite(value) && value > 0 ? value : undefined;
}

export async function send(transport: Transport, options: IHttpRequestOptions): Promise<IDataObject> {
	const response = await transport(options);
	if (response.statusCode < HTTP_OK_MIN || response.statusCode > HTTP_OK_MAX) {
		const retryAfter = headerNumber(response.headers, 'retry-after');
		throw new ParcelGpsApiError(describeApiError(response.statusCode, response.body, retryAfter), response.body);
	}
	return unwrapData(response.body);
}

function text(read: ParameterReader, name: string): string {
	const value = read(name);
	return typeof value === 'string' ? value.trim() : '';
}

async function fetchAllUnitPages(
	transport: Transport,
	reference: string,
	country: string,
): Promise<IDataObject[]> {
	const pages: IDataObject[] = [];
	let cursor: string | undefined;
	for (let count = 0; count < MAX_UNIT_PAGES; count += 1) {
		const page = await send(transport, unitsRequest(reference, country, cursor));
		pages.push(page);
		const next = typeof page.nextCursor === 'string' ? page.nextCursor : '';
		if (page.truncated !== true || !next) return pages;
		cursor = next;
	}
	throw new ParcelGpsInputError(`The building has more than ${MAX_UNIT_PAGES} pages of units`);
}

type Handler = (read: ParameterReader, transport: Transport) => Promise<IDataObject[]>;

const handlers: Record<string, Handler> = {
	'parcel:getByReference': async (read, transport) => {
		const country = text(read, 'country');
		const data = await send(transport, parcelByReferenceRequest(text(read, 'reference'), country));
		return [mapParcel(data, read('includeGeometry') === true, country)];
	},
	'parcel:getAtCoordinates': async (read, transport) => {
		const country = text(read, 'country');
		const data = await send(
			transport,
			parcelAtCoordinatesRequest(read('latitude'), read('longitude'), country),
		);
		return [mapParcel(data, read('includeGeometry') === true, country)];
	},
	'parcel:getGeometry': async (read, transport) => {
		const reference = text(read, 'reference');
		const country = text(read, 'country');
		const data = await send(transport, parcelGeometryRequest(reference, country));
		return [mapGeometry(data, reference, country)];
	},
	'resolver:resolve': async (read, transport) => {
		const data = await send(transport, resolveRequest(text(read, 'text'), text(read, 'hint')));
		return [mapResolve(data)];
	},
	'address:search': async (read, transport) => {
		const limit = Number(read('maxResults'));
		const data = await send(
			transport,
			addressSearchRequest(text(read, 'address'), text(read, 'country'), limit),
		);
		return mapAddressCandidates(data);
	},
	'building:getUnits': async (read, transport) => {
		const pages = await fetchAllUnitPages(transport, text(read, 'reference'), text(read, 'country'));
		return [mapUnits(pages)];
	},
	'land:getTerrain': async (read, transport) => {
		const data = await send(transport, terrainRequest(text(read, 'reference'), text(read, 'country')));
		return [compact(data)];
	},
	'land:getGroundMotion': async (read, transport) => {
		const data = await send(
			transport,
			groundMotionRequest(text(read, 'reference'), text(read, 'country')),
		);
		return [compact(data)];
	},
};

export async function runOperation(
	resource: string,
	operation: string,
	read: ParameterReader,
	transport: Transport,
): Promise<IDataObject[]> {
	const handler = handlers[`${resource}:${operation}`];
	if (!handler) throw new ParcelGpsInputError(`Unsupported operation: ${resource} / ${operation}`);
	return handler(read, transport);
}
