import type { IDataObject } from 'n8n-workflow';

type Position = [number, number];

export interface PolygonGeometry extends IDataObject {
	type: 'Polygon';
	coordinates: Position[][];
}

const MIN_RING_POINTS = 3;

function asObject(value: unknown): IDataObject {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as IDataObject) : {};
}

function firstDefined(...values: unknown[]): unknown {
	return values.find((value) => value !== undefined && value !== null && value !== '');
}

function finiteNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function positiveNumber(value: unknown): number | undefined {
	const number = finiteNumber(value);
	return number !== undefined && number > 0 ? number : undefined;
}

export function compact(record: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(record)) {
		if (value !== undefined && value !== '') result[key] = value;
	}
	return result;
}

export function unwrapData(body: unknown): IDataObject {
	const object = asObject(body);
	return 'data' in object ? asObject(object.data) : object;
}

export function latLngRingToPolygon(ring: unknown): PolygonGeometry | null {
	if (!Array.isArray(ring)) return null;
	const positions: Position[] = [];
	for (const point of ring) {
		if (!Array.isArray(point)) continue;
		const lat = finiteNumber(point[0]);
		const lng = finiteNumber(point[1]);
		if (lat !== undefined && lng !== undefined) positions.push([lng, lat]);
	}
	if (positions.length < MIN_RING_POINTS) return null;
	const [firstLng, firstLat] = positions[0];
	const [lastLng, lastLat] = positions[positions.length - 1];
	if (firstLng !== lastLng || firstLat !== lastLat) positions.push([firstLng, firstLat]);
	return { type: 'Polygon', coordinates: [positions] };
}

export function normalizeGeoJson(value: unknown): IDataObject | null {
	const object = asObject(value);
	if (object.type === 'Feature') return normalizeGeoJson(object.geometry);
	if (object.type === 'FeatureCollection' && Array.isArray(object.features)) {
		return normalizeGeoJson(object.features[0]);
	}
	if (typeof object.type === 'string' && Array.isArray(object.coordinates)) return object;
	return null;
}

function geometryOf(data: IDataObject): IDataObject | null {
	return normalizeGeoJson(data.geojson) ?? latLngRingToPolygon(data.poligono);
}

export function mapParcel(data: IDataObject, includeGeometry: boolean, requestedCountry = ''): IDataObject {
	const point = asObject(data.coordenadas);
	const centroid = asObject(data.centroid);
	const parcel = compact({
		reference: firstDefined(data.refCatastral, data.referenciaCatastral, data.refcat) as string,
		reference14: data.refCat14 as string,
		country: firstDefined(data.pais, requestedCountry) as string,
		lat: finiteNumber(firstDefined(data.latitud, point.latitud, centroid.latitude)),
		lon: finiteNumber(firstDefined(data.longitud, point.longitud, centroid.longitude)),
		areaM2: positiveNumber(firstDefined(data.superficieParcela, data.area)),
		builtAreaM2: positiveNumber(data.superficieConstruida),
		address: data.direccion as string,
		postalCode: data.codigoPostal as string,
		municipality: data.municipio as string,
		province: data.provincia as string,
		landUse: data.uso as string,
		landClass: data.clase as string,
		propertyType: data.tipoInmueble as string,
		constructionYear: positiveNumber(data.anioConstruccion),
		dwellings: positiveNumber(data.viviendas),
		floors: positiveNumber(data.plantas),
		source: firstDefined(data.fuenteDatos, data.dataSource) as string,
		googleMapsUrl: data.googleMapsUrl as string,
	});
	if (includeGeometry) parcel.geometry = geometryOf(data);
	return parcel;
}

const SIMPLIFIED_PARCEL_FIELDS = [
	'reference',
	'country',
	'lat',
	'lon',
	'areaM2',
	'address',
	'municipality',
	'province',
	'landUse',
	'geometry',
];

const SIMPLIFIED_ADDRESS_FIELDS = [
	'reference',
	'country',
	'address',
	'number',
	'postalCode',
	'municipality',
	'lat',
	'lon',
	'confidence',
	'landUse',
];

function pick(record: IDataObject, fields: string[]): IDataObject {
	const result: IDataObject = {};
	for (const field of fields) {
		if (field in record) result[field] = record[field];
	}
	return result;
}

export function simplifyParcel(parcel: IDataObject): IDataObject {
	return pick(parcel, SIMPLIFIED_PARCEL_FIELDS);
}

export function simplifyAddressCandidate(candidate: IDataObject): IDataObject {
	return pick(candidate, SIMPLIFIED_ADDRESS_FIELDS);
}

export function mapGeometry(data: IDataObject, reference: string, requestedCountry = ''): IDataObject {
	const parcel = mapParcel(data, true, requestedCountry);
	return {
		reference: parcel.reference ?? reference,
		country: parcel.country,
		lat: parcel.lat,
		lon: parcel.lon,
		areaM2: parcel.areaM2,
		geometry: parcel.geometry,
	};
}

export function mapResolve(data: IDataObject): IDataObject {
	const candidates = (Array.isArray(data.candidates) ? data.candidates : []).map((candidate) => {
		const item = asObject(candidate);
		return compact({
			country: item.country as string,
			kind: item.kind as string,
			normalized: item.normalized as string,
			confidence: finiteNumber(item.confidence),
			supported: typeof item.supported === 'boolean' ? item.supported : undefined,
		});
	});
	const best = [...candidates].sort(
		(a, b) => ((b.confidence as number) ?? 0) - ((a.confidence as number) ?? 0),
	)[0];
	return compact({
		input: data.input as string,
		ambiguous: data.ambiguous === true,
		country: best?.country as string,
		kind: best?.kind as string,
		normalized: best?.normalized as string,
		confidence: best?.confidence as number,
		supported: best?.supported as boolean,
		candidates,
	});
}

export function mapAddressCandidates(data: IDataObject): IDataObject[] {
	const candidates = Array.isArray(data.candidatos) ? data.candidatos : [];
	return candidates.map((candidate) => {
		const item = asObject(candidate);
		return compact({
			reference: item.refCatastral as string,
			country: item.pais as string,
			address: item.direccion as string,
			number: finiteNumber(item.numero),
			postalCode: item.codigoPostal as string,
			municipality: item.municipio as string,
			province: item.provincia as string,
			lat: finiteNumber(item.latitud),
			lon: finiteNumber(item.longitud),
			confidence: finiteNumber(item.confianza),
			matchesNumber: typeof item.coincideNumero === 'boolean' ? item.coincideNumero : undefined,
			matchesMunicipality:
				typeof item.coincideMunicipio === 'boolean' ? item.coincideMunicipio : undefined,
			landUse: item.uso as string,
			dwellings: positiveNumber(item.viviendas),
			constructionYear: positiveNumber(item.anioConstruccion),
			attribution: data.attribution as string,
		});
	});
}

function mapUnit(value: unknown): IDataObject {
	const unit = asObject(value);
	return compact({
		reference: unit.refCatastral as string,
		staircase: unit.escalera as string,
		floor: unit.planta as string,
		door: unit.puerta as string,
		use: unit.uso as string,
		areaM2: finiteNumber(unit.superficie),
		description: unit.descripcion as string,
		participation: finiteNumber(unit.participacion),
		year: positiveNumber(unit.anio),
		address: unit.direccion as string,
	});
}

export function mapUnits(pages: IDataObject[]): IDataObject {
	const first = pages[0] ?? {};
	const last = pages[pages.length - 1] ?? {};
	const units = pages.flatMap((page) => (Array.isArray(page.unidades) ? page.unidades : []).map(mapUnit));
	const constructions = pages.flatMap((page) =>
		(Array.isArray(page.construcciones) ? page.construcciones : []).map(mapUnit),
	);
	return compact({
		reference: first.refCatastral as string,
		address: first.direccion as string,
		postalCode: first.codigoPostal as string,
		municipality: first.municipio as string,
		province: first.provincia as string,
		generalUse: first.usoGeneral as string,
		constructionYear: positiveNumber(first.anioConstruccion),
		totalUnits: finiteNumber(last.totalUnidadesFinca) ?? units.length,
		units,
		constructions,
		source: first.dataSource as string,
		dataDate: first.dataDate as string,
		attribution: first.attribution as string,
	});
}
