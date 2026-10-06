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
