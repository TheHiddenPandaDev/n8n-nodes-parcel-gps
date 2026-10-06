export const spanishParcel = {
	refCatastral: '9872023VH5797S0001WX',
	pais: 'ES',
	direccion: 'CL MAYOR 1',
	codigoPostal: '28013',
	municipio: 'MADRID',
	provincia: 'MADRID',
	latitud: 40.4168,
	longitud: -3.7038,
	googleMapsUrl: 'https://www.google.com/maps?q=40.4168,-3.7038',
	uso: 'Residencial',
	clase: 'Urbano',
	superficieConstruida: 120,
	superficieParcela: 250,
	anioConstruccion: 1950,
	viviendas: 4,
	fuenteDatos: 'catastro',
	poligono: [
		[40.4168, -3.7038],
		[40.4169, -3.7038],
		[40.4169, -3.7037],
	],
};

export const pointMatch = {
	referenciaCatastral: '9872023VH5797S0001WX',
	refCat14: '9872023VH5797S',
	pais: 'ES',
	direccion: 'CL MAYOR 1',
	municipio: 'MADRID',
	provincia: 'MADRID',
	tipoInmueble: 'Urbano',
	coordenadas: { latitud: 40.4168, longitud: -3.7038 },
	googleMapsUrl: 'https://www.google.com/maps?q=40.4168,-3.7038',
};

export const foreignPointMatch = {
	refCatastral: '75056000AB0001',
	referenciaCatastral: '75056000AB0001',
	pais: 'FR',
	latitud: 48.85,
	longitud: 2.35,
	municipio: 'Paris',
	superficieParcela: 812,
	coordenadas: { latitud: 48.85, longitud: 2.35 },
	poligono: [
		[48.85, 2.35],
		[48.851, 2.35],
		[48.851, 2.351],
		[48.85, 2.35],
	],
};

export const resolveResult = {
	input: '9872023VH5797S0001WX',
	ambiguous: false,
	candidates: [
		{ country: 'PT', kind: 'reference', normalized: '9872023VH5797S0001WX', confidence: 0.2, supported: true },
		{ country: 'ES', kind: 'reference', normalized: '9872023VH5797S0001WX', confidence: 1, supported: true },
	],
};

export const addressCandidates = {
	consulta: { texto: 'Calle Mayor 1, Madrid' },
	candidatos: [
		{
			refCatastral: '9872023VH5797S',
			pais: 'ES',
			direccion: 'CL MAYOR 1',
			numero: 1,
			codigoPostal: '28013',
			municipio: 'MADRID',
			provincia: 'MADRID',
			latitud: 40.4168,
			longitud: -3.7038,
			confianza: 0.98,
			coincideNumero: true,
			coincideMunicipio: true,
			enCopia: true,
			uso: 'Residencial',
			viviendas: 12,
			anioConstruccion: 1950,
		},
	],
	attribution: 'Dirección General del Catastro',
};

export function unitsPage(overrides = {}) {
	return {
		refCatastral: '9872023VH5797S',
		direccion: 'CL MAYOR 1',
		codigoPostal: '28013',
		municipio: 'MADRID',
		provincia: 'MADRID',
		usoGeneral: 'Residencial',
		anioConstruccion: 1950,
		totalUnidades: 1,
		totalUnidadesFinca: 2,
		unidades: [
			{
				refCatastral: '9872023VH5797S0001WX',
				escalera: '1',
				planta: '01',
				puerta: 'A',
				uso: 'Vivienda',
				superficie: 80,
				descripcion: 'VIVIENDA',
				participacion: 25.5,
				anio: 1950,
			},
		],
		construcciones: [
			{ escalera: '1', planta: '01', puerta: 'A', uso: 'V', superficie: 80, descripcion: 'VIVIENDA' },
		],
		truncated: false,
		dataSource: 'clone',
		dataDate: '2026-09-01',
		attribution: 'Dirección General del Catastro',
		...overrides,
	};
}

export function ok(data) {
	return { statusCode: 200, body: { success: true, data }, headers: {} };
}

export function failure(statusCode, body, headers = {}) {
	return { statusCode, body, headers };
}
