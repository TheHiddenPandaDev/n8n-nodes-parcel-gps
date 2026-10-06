# n8n-nodes-parcel-gps

This is an n8n community node for the [Parcel GPS API](https://www.parcelgps.com/developers). It returns official cadastral parcels from **29 European countries** (including the Basque Country and Navarre foral cadastres): by cadastral reference in 27 countries and by coordinates in all 29, with outline (GeoJSON), area, municipality and centroid.

The repository also contains the [Make (make.com) custom app](#make-custom-app) for the same API in `make-app/`.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
- [Output](#output)
- [Errors](#errors)
- [Make custom app](#make-custom-app)
- [Development](#development)

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

Parcel operations return flat JSON with English keys. **Include Geometry** adds the outline as a GeoJSON `Polygon` (`[lon, lat]` order) in `geometry`, or `null` when the official source has no outline.

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

## Make custom app

`make-app/` holds the Make custom app in the layout of the [Make Apps VS Code extension](https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk/local-development-for-apps): `makecomapp.json` is the manifest, `general/` has the base (base URL, `X-API-Key` header, error handling, log sanitization), `connections/parcelGps/` the API key connection and `modules/` six modules: Get a Parcel by Reference, Get a Parcel at Coordinates, Get a Parcel Geometry, Resolve Text, Search Parcels by Address and Make an API Call (universal module). The app icon is `make-app/assets/icon.png` (512×512).

To create it in Make:

1. In Make, open **Custom Apps** (left menu, or `https://eu1.make.com/apps`, matching your zone) and click **Create a new app**: name `parcel-gps`, label `Parcel GPS`, description "Official cadastral parcels from 29 European countries", theme `#1E40AF`, language English, audience Global. Upload `make-app/assets/icon.png` as the logo.
2. In Make, open your profile → **API access** → **Add token** with the scopes `apps:read` and `apps:write`.
3. In VS Code, install the **Make Apps Editor** extension, run **Make: Add environment** with your zone URL (for example `eu1.make.com`) and paste the token.
4. Open this repository in VS Code. If the app ID Make gave you is not `parcel-gps`, or your zone is not `eu1`, edit `origins[0].appId` and `origins[0].baseUrl` in `make-app/makecomapp.json`.
5. Save the token in `.secrets/apikey` at the repository root (the path is ignored by git), right-click `make-app/makecomapp.json` and choose **Deploy to Make**. Pair each local component with "create new" when asked.
6. In a scenario, create a Parcel GPS connection with a real API key and run every module once (including one that fails, for example a non-existent reference) so the execution logs exist for the reviewer.

Without the extension, each file can be pasted into the matching tab of the online editor: `general/base.iml.json` → Base; `connections/parcelGps/communication.iml.json` and `params.iml.json` → Connection (type: API key) → Communication and Parameters; for each module, `communication`, `static-params`, `mappable-params`, `interface` and `samples` into the tabs with the same names.

To publish it for every Make user, follow [Request app review](https://developers.make.com/custom-apps-documentation/app-review/request-app-review): click **Publish** in the app (it cannot be unpublished), make every module visible, open the **Review** tab, add the API documentation link (`https://www.parcelgps.com/developers`) and the links to the test scenarios, and click **Request review**. Make answers by email with an automatic review (PDF) and then a manual one.

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
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md) © The Hidden Panda
