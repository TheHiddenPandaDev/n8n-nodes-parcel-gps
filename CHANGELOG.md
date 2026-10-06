# Changelog

## 0.1.2

- Simplify option (on by default) for Parcel → Get by Reference, Parcel → Get at Coordinates and Address → Search: returns at most ten fields, following the n8n UX guidelines.
- Operation action names without articles (for example "Get parcel by cadastral reference").
- The npm package ships only the n8n node: the Make app asset and the TypeScript build info are no longer included.
- Package author matches the npm maintainer.
- README: compatibility, usage and an example workflow; the Make app setup moved to `make-app/README.md`.

## 0.1.1

- Published from GitHub Actions with npm provenance (trusted publishing).

## 0.1.0

- First release: Parcel GPS API credential and the Parcel GPS node (parcel by reference, at coordinates, geometry; resolve free text; address search; building units in Spain; terrain and ground motion).
- Make custom app definition in `make-app/`.
