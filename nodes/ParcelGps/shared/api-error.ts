import type { IDataObject } from 'n8n-workflow';

export interface ApiErrorDescription {
	httpCode: string;
	code?: string;
	message: string;
	description: string;
}

const DEVELOPERS_URL = 'https://www.parcelgps.com/developers';

const HTTP_AMBIGUOUS = 300;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;
const HTTP_TOO_MANY = 429;
const HTTP_SERVER_ERROR = 500;
const HTTP_UNAVAILABLE = 503;

export const QUOTA_EXHAUSTED_CODE = 'KEY_AUTH_004';

function asObject(value: unknown): IDataObject {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as IDataObject) : {};
}

function serverMessage(body: IDataObject): string {
	if (typeof body.error === 'string' && body.error) return body.error;
	if (typeof body.message === 'string' && body.message) return body.message;
	return '';
}

function withServerMessage(text: string, body: IDataObject): string {
	const detail = serverMessage(body);
	return detail ? `${text} API message: ${detail}` : text;
}

function candidateList(details: IDataObject): string {
	const candidates = Array.isArray(details.candidates) ? details.candidates : [];
	return candidates
		.map((candidate) => asObject(candidate).country)
		.filter((country): country is string => typeof country === 'string' && country !== '')
		.join(', ');
}

function supportedList(details: IDataObject): string {
	const countries = Array.isArray(details.supportedCountries) ? details.supportedCountries : [];
	return countries.filter((country) => typeof country === 'string').join(', ');
}

function placeLabel(details: IDataObject): string {
	const location = asObject(details.location);
	const lat = location.lat;
	const lng = location.lng;
	const label = typeof location.label === 'string' ? location.label : location.address;
	const point = typeof lat === 'number' && typeof lng === 'number' ? ` (${lat}, ${lng})` : '';
	return `${typeof label === 'string' ? label : 'the place'}${point}`;
}

export function describeApiError(
	status: number,
	rawBody: unknown,
	retryAfterSeconds?: number,
): ApiErrorDescription {
	const body = asObject(rawBody);
	const code = typeof body.code === 'string' ? body.code : undefined;
	const details = asObject(body.data ?? body.parsed);
	const base = { httpCode: String(status), code };

	if (code === 'CNV_AMBIGUOUS' || status === HTTP_AMBIGUOUS) {
		const countries = candidateList(details);
		return {
			...base,
			message: 'The reference matches more than one country',
			description: countries
				? `Possible countries: ${countries}. Set the Country field to pick one.`
				: 'Set the Country field to pick one.',
		};
	}
	if (code === 'CNV_COVERAGE') {
		const supported = supportedList(details);
		return {
			...base,
			message: 'This country or feature is not covered',
			description: withServerMessage(
				supported ? `Supported countries for this operation: ${supported}.` : 'Check the Country field.',
				body,
			),
		};
	}
	if (code === 'CNV_PLACE_NAME') {
		return {
			...base,
			message: 'The text is a place name, not a cadastral reference',
			description: `It was geocoded to ${placeLabel(details)}. Use Get Parcel at Coordinates with that point.`,
		};
	}
	if (code === QUOTA_EXHAUSTED_CODE) {
		return {
			...base,
			message: 'Monthly API quota exhausted',
			description: withServerMessage(
				`Your plan has no requests left this month. Upgrade or top up at ${DEVELOPERS_URL}`,
				body,
			),
		};
	}
	if (status === HTTP_TOO_MANY) {
		const wait = retryAfterSeconds ? ` Retry after ${retryAfterSeconds} seconds.` : '';
		return {
			...base,
			message: 'Too many requests',
			description: `The per-minute rate limit was reached.${wait} You can enable Retry On Fail in the node settings.`,
		};
	}
	if (status === HTTP_UNAUTHORIZED) {
		return {
			...base,
			message: 'Invalid or missing API key',
			description: withServerMessage(
				`Check the API key in the Parcel GPS API credential. Get a free key at ${DEVELOPERS_URL}`,
				body,
			),
		};
	}
	if (status === HTTP_FORBIDDEN) {
		return {
			...base,
			message: 'This API key cannot use this operation',
			description: withServerMessage('Your plan does not include this resource.', body),
		};
	}
	if (status === HTTP_NOT_FOUND) {
		return {
			...base,
			message: 'Parcel not found',
			description: withServerMessage(
				'No parcel matches this reference or point. Failed lookups are not charged.',
				body,
			),
		};
	}
	if (status === HTTP_BAD_REQUEST || status === HTTP_UNPROCESSABLE) {
		return {
			...base,
			message: 'The request was rejected',
			description: withServerMessage('Check the reference, coordinates and country.', body),
		};
	}
	if (status === HTTP_UNAVAILABLE) {
		const wait = retryAfterSeconds ? ` Retry after ${retryAfterSeconds} seconds.` : '';
		return {
			...base,
			message: 'The official cadastre is temporarily unavailable',
			description: `The source did not answer in time.${wait} Failed lookups are not charged.`,
		};
	}
	if (status >= HTTP_SERVER_ERROR) {
		return {
			...base,
			message: 'Parcel GPS server error',
			description: withServerMessage('Try again in a few minutes.', body),
		};
	}
	return {
		...base,
		message: `Unexpected response (HTTP ${status})`,
		description: withServerMessage('The API answered with an unexpected status.', body),
	};
}
