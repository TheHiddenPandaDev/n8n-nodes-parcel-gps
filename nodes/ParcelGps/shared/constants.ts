export const API_BASE_URL = 'https://api.parcelgps.com';

export const CREDENTIAL_NAME = 'parcelGpsApi';

export const MAX_UNIT_PAGES = 200;

export const DEFAULT_ADDRESS_LIMIT = 5;

export const MAX_ADDRESS_LIMIT = 10;

export const COUNTRY_NAMES: Record<string, string> = {
	AT: 'Austria',
	BE: 'Belgium',
	BG: 'Bulgaria',
	CH: 'Switzerland',
	CY: 'Cyprus',
	CZ: 'Czechia',
	DE: 'Germany',
	DK: 'Denmark',
	EE: 'Estonia',
	ES: 'Spain',
	FI: 'Finland',
	FR: 'France',
	GR: 'Greece',
	HR: 'Croatia (coordinates only)',
	IE: 'Ireland',
	IS: 'Iceland',
	IT: 'Italy',
	LI: 'Liechtenstein',
	LT: 'Lithuania',
	LU: 'Luxembourg',
	LV: 'Latvia',
	NA: 'Spain - Navarre foral cadastre',
	NL: 'Netherlands',
	NO: 'Norway',
	PL: 'Poland',
	PT: 'Portugal',
	PV: 'Spain - Basque Country foral cadastre',
	SE: 'Sweden',
	SI: 'Slovenia',
	SK: 'Slovakia',
	UK: 'United Kingdom - Scotland (coordinates only)',
};

export const COORDINATES_ONLY_COUNTRIES = ['UK', 'HR'];

export const ADDRESS_COUNTRIES = [
	'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE',
	'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'NL', 'NO', 'PL', 'PT', 'SI', 'SK', 'UK',
];

export const UNITS_COUNTRIES = ['ES', 'PV', 'NA'];

export const TERRAIN_EXCLUDED_COUNTRIES = ['UK', 'HR'];
