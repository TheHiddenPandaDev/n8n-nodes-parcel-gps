# n8n-nodes-parcel-gps

This is an n8n community node for the [Parcel GPS API](https://www.parcelgps.com/developers). It returns official cadastral parcels from **29 European countries** (including the Basque Country and Navarre foral cadastres): by cadastral reference in 27 countries and by coordinates in all 29, with outline (GeoJSON), area, municipality and centroid.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
- [Output](#output)
- [Errors](#errors)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Example workflow](#example-workflow)
- [Development](#development)
- [Version history](#version-history)

## Installation

In n8n, go to **Settings → Community nodes → Install**, enter `n8n-nodes-parcel-gps` and confirm.

For other setups (queue mode, Docker images), follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

1. Create a free API key at [parcelgps.com/developers](https://www.parcelgps.com/developers). The free plan includes 250 requests a month, forever. Paid plans: 19, 49 and 99 EUR a month.
2. In n8n, create a **Parcel GPS API** credential and paste the key.

The key travels in the `X-API-Key` header. Testing the credential makes one small authenticated request, which counts as one request of your quota. Failed lookups (not found, not covered) are never charged.

## Operations

| Resource | Operation | What it does |
|----------|-----------|--------------|
| Parcel | Get by Reference | Parcel from its official cadastral reference. Country is auto-detected from the reference format, or set it. |
| Parcel | Get at Coordinates | Parcel that contains a WGS84 point (29 countries). |
| Parcel | Get Geometry | Outline as GeoJSON, centroid and area. |
| Resolver | Resolve | Tells whether a free text is a cadastral reference, coordinates or a place name, and in which country. |
| Address | Search | Candidate parcels for a postal address (27 countries). One output item per candidate. |
| Building | Get Units | Every dwelling, shop and garage of a building in Spain (including the foral cadastres), following all pages. Each unit returned counts as one request. |
| Land | Get Terrain | Elevation, slope, aspect, protected areas (Natura 2000) and climate. |
| Land | Get Ground Motion | Satellite-measured subsidence or uplift around the parcel. |

The node is usable as a tool by the n8n AI Agent.

## Output

Parcel operations return flat JSON with English keys. **Simplify** (on by default for Parcel → Get by Reference, Parcel → Get at Coordinates and Address → Search) keeps the ten most useful fields; turn it off to get every field the official source publishes, as in the example below. **Include Geometry** adds the outline as a GeoJSON `Polygon` (`[lon, lat]` order) in `geometry`, or `null` when the official source has no outline.

```json
{
  "reference": "9872023VH5797S0001WX",
  "country": "ES",
  "lat": 40.4168,
  "lon": -3.7038,
  "areaM2": 250,
  "builtAreaM2": 120,
  "address": "CL MAYOR 1",
  "postalCode": "28013",
  "municipality": "MADRID",
  "province": "MADRID",
  "landUse": "Residencial",
  "constructionYear": 1950,
  "source": "catastro",
  "googleMapsUrl": "https://www.google.com/maps?q=40.4168,-3.7038",
  "geometry": { "type": "Polygon", "coordinates": [[[-3.7038, 40.4168], [-3.7038, 40.4169], [-3.7037, 40.4169], [-3.7038, 40.4168]]] }
}
```

Fields the source country does not publish are left out.

## Errors

| HTTP | Meaning in the node |
|------|---------------------|
| 401 | Invalid or missing API key |
| 404 | Parcel not found (not charged) |
| 300 | The reference matches more than one country: set **Country** |
| 422 `CNV_COVERAGE` | Country or feature not covered; the message lists the supported countries |
| 422 `CNV_PLACE_NAME` | The text is a place name; use Get at Coordinates with the returned point |
| 429 `KEY_AUTH_004` | Monthly quota exhausted |
| 429 | Per-minute rate limit; enable **Retry On Fail** in the node settings |
| 503 | The official cadastre did not answer in time (not charged) |

With **Continue On Fail**, failed items are returned as `{ "error": "...", "description": "..." }` and the rest of the batch keeps running.

## Compatibility

Built with the `n8n-node` CLI and tested with n8n 1.x (nodes API version 1). The package has no runtime dependencies.

## Usage

1. Add the **Parcel GPS** node to a workflow and select your **Parcel GPS API** credential.
2. Pick a **Resource** and an **Operation**. Every text field accepts expressions, so the reference, coordinates or address can come from a previous node (a spreadsheet row, a form submission, a webhook).
3. Leave **Country** on **Auto-Detect** unless the API answers that the reference matches more than one country.
4. For long lists, keep **Simplify** on and enable **Retry On Fail** in the node settings so per-minute rate limits are retried.

Typical uses: enrich a list of cadastral references with area, municipality and coordinates; find the parcel under a GPS point collected in the field; turn a postal address into candidate parcels; give an AI Agent a tool to look up parcels.

## Example workflow

Enrich a list of cadastral references and get one row per parcel:

1. **Manual Trigger**.
2. **Code** node that returns one item per reference, for example `return [{ json: { reference: '9872023VH5797S0001WX' } }];`.
3. **Parcel GPS** node: Resource **Parcel**, Operation **Get by Reference**, Cadastral Reference `{{ $json.reference }}`, Country **Auto-Detect**, Simplify on.
4. Any destination node (Google Sheets, Postgres, Airtable) to store `reference`, `country`, `lat`, `lon`, `areaM2`, `municipality` and `province`.

The same pattern works with Parcel → Get at Coordinates (`{{ $json.lat }}` and `{{ $json.lon }}`) and Address → Search (`{{ $json.address }}`, one output item per candidate).

## Development

```bash
npm ci
npm run lint
npm run test:coverage
npm run build
npm run dev
```

`npm run dev` starts a local n8n with the node linked. Tests use Vitest and mock the HTTP layer.

## Resources

- [Parcel GPS API documentation](https://www.parcelgps.com/developers)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/installation-and-management/)

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE.md) © The Hidden Panda
