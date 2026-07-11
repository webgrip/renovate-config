import { AllConfig } from "../../../config/types.js";
import { PackageCacheNamespace } from "./namespaces.js";

//#region lib/util/cache/package/backend.d.ts
declare let cacheType: 'redis' | 'sqlite' | 'file' | undefined;
declare function getCacheType(): typeof cacheType;
declare function init(config: AllConfig): Promise<void>;
declare function get<T = unknown>(namespace: PackageCacheNamespace, key: string): Promise<T | undefined>;
declare function set(namespace: PackageCacheNamespace, key: string, value: unknown, hardTtlMinutes: number): Promise<void>;
declare function destroy(): Promise<void>;
//#endregion
export { destroy, get, getCacheType, init, set };
//# sourceMappingURL=backend.d.ts.map