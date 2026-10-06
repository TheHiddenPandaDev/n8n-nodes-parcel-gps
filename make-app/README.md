# Parcel GPS

Official cadastral parcels from 29 European countries (including the Basque Country and Navarre foral cadastres): by cadastral reference in 27 countries and by coordinates in all 29.

## Connection

Create a free API key at [parcelgps.com/developers](https://www.parcelgps.com/developers) (250 requests a month, forever) and paste it into the Parcel GPS connection. Paid plans: 19, 49 and 99 EUR a month. Failed lookups are not charged.

## Modules

- **Get a Parcel by Reference**: reference, country, latitude, longitude, area, address, municipality and, optionally, the outline.
- **Get a Parcel at Coordinates**: the parcel that contains a WGS84 point.
- **Get a Parcel Geometry**: the outline as GeoJSON with its centroid and area.
- **Resolve Text**: tells whether a text is a cadastral reference, coordinates or a place name, and its country.
- **Search Parcels by Address**: candidate parcels for a postal address in 27 countries.
- **Make an API Call**: any other endpoint of the [Parcel GPS API](https://www.parcelgps.com/developers).

## Deploying the app

`make-app/` holds the Make custom app in the layout of the [Make Apps VS Code extension](https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk/local-development-for-apps): `makecomapp.json` is the manifest, `general/` has the base (base URL, `X-API-Key` header, error handling, log sanitization), `connections/parcelGps/` the API key connection and `modules/` six modules: Get a Parcel by Reference, Get a Parcel at Coordinates, Get a Parcel Geometry, Resolve Text, Search Parcels by Address and Make an API Call (universal module). The app icon is `make-app/assets/icon.png` (512×512).

To create it in Make:

1. In Make, open **Custom Apps** (left menu, or `https://eu1.make.com/apps`, matching your zone) and click **Create a new app**: name `parcel-gps`, label `Parcel GPS`, description "Official cadastral parcels from 29 European countries", theme `#1E40AF`, language English, audience Global. Upload `make-app/assets/icon.png` as the logo.
2. In Make, open your profile → **API access** → **Add token** with the scopes `apps:read` and `apps:write`.
3. In VS Code, install the **Make Apps Editor** extension, run **Make: Add environment** with your zone URL (for example `eu1.make.com`) and paste the token.
4. Open the repository in VS Code. If the app ID Make gave you is not `parcel-gps`, or your zone is not `eu1`, edit `origins[0].appId` and `origins[0].baseUrl` in `make-app/makecomapp.json`.
5. Save the token in `.secrets/apikey` at the repository root (the path is ignored by git), right-click `make-app/makecomapp.json` and choose **Deploy to Make**. Pair each local component with "create new" when asked.
6. In a scenario, create a Parcel GPS connection with a real API key and run every module once (including one that fails, for example a non-existent reference) so the execution logs exist for the reviewer.

Without the extension, each file can be pasted into the matching tab of the online editor: `general/base.iml.json` → Base; `connections/parcelGps/communication.iml.json` and `params.iml.json` → Connection (type: API key) → Communication and Parameters; for each module, `communication`, `static-params`, `mappable-params`, `interface` and `samples` into the tabs with the same names.

To publish it for every Make user, follow [Request app review](https://developers.make.com/custom-apps-documentation/app-review/request-app-review): click **Publish** in the app (it cannot be unpublished), make every module visible, open the **Review** tab, add the API documentation link (`https://www.parcelgps.com/developers`) and the links to the test scenarios, and click **Request review**. Make answers by email with an automatic review (PDF) and then a manual one.
