import { VersioningApi } from "../types.js";

//#region lib/modules/versioning/semver-coerced/index.d.ts
declare namespace index_d_exports {
  export { api, api as default, displayName, getSatisfyingVersion, id, isVersion as isValid, isVersion, supportsRanges, urls };
}
declare const id = "semver-coerced";
declare const displayName = "Coerced Semantic Versioning";
declare const urls: string[];
declare const supportsRanges = false;
declare function getSatisfyingVersion(versions: string[], range: string): string | null;
declare const isVersion: (input: string) => boolean;
declare const api: VersioningApi;
//#endregion
export { index_d_exports };
//# sourceMappingURL=index.d.ts.map