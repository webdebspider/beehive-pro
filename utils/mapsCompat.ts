/**
 * utils/mapsCompat.ts
 *
 * Base type declarations for mapsCompat.
 * Metro uses mapsCompat.native.ts on iOS/Android and mapsCompat.web.ts on web.
 * This file exists only so TypeScript can resolve the module and its types.
 */

export { default as MapView, Callout, Marker } from "react-native-maps";
