import { NewValueConfig, VersioningApi, VersioningApiConstructor } from "./types.js";
import { index_d_exports } from "./semver-coerced/index.js";

//#region lib/modules/versioning/index.d.ts
declare const defaultVersioning: typeof index_d_exports;
declare const getVersioningList: () => string[];
/**
 * Get versioning map. Can be used to dynamically add new versioning type
 */
declare const getVersionings: () => Map<string, VersioningApi | VersioningApiConstructor>;
declare function get(versioning: string | null | undefined): VersioningApi;
//#endregion
export { NewValueConfig, VersioningApi, VersioningApiConstructor, defaultVersioning, get, getVersioningList, getVersionings };
//# sourceMappingURL=index.d.ts.map