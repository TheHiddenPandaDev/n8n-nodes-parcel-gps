import type { INodePropertyOptions } from 'n8n-workflow';
import { COUNTRY_NAMES } from './constants';

export const AUTO_DETECT = '';

const autoDetectOption: INodePropertyOptions = { name: 'Auto-Detect', value: AUTO_DETECT };

export function countryOptions(codes: string[] = Object.keys(COUNTRY_NAMES)): INodePropertyOptions[] {
	const sorted = codes
		.map((code) => ({ name: `${COUNTRY_NAMES[code]} (${code})`, value: code }))
		.sort((a, b) => a.name.localeCompare(b.name));
	return [autoDetectOption, ...sorted];
}

export function countriesExcept(excluded: string[]): string[] {
	return Object.keys(COUNTRY_NAMES).filter((code) => !excluded.includes(code));
}
