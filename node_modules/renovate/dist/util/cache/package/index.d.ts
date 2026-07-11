import { AllConfig } from "../../../config/types.js";
import { PackageCacheNamespace } from "./namespaces.js";
import { getCacheType as getCacheType$1 } from "./backend.js";

//#region lib/util/cache/package/index.d.ts
declare function getCacheType(): ReturnType<typeof getCacheType$1>;
declare function get<T = any>(namespace: PackageCacheNamespace, key: string): Promise<T | undefined>;
/**
 * Set cache value with user-defined TTL overrides.
 */
declare function set(namespace: PackageCacheNamespace, key: string, value: unknown, hardTtlMinutes: number): Promise<void>;
/**
 * Set cache value ignoring user-defined TTL overrides.
 * This MUST NOT be used outside of cache implementation
 */
declare function setWithRawTtl(namespace: PackageCacheNamespace, key: string, value: unknown, hardTtlMinutes: number): Promise<void>;
declare function init(config: AllConfig): Promise<void>;
declare function cleanup(_config: AllConfig): Promise<void>;
//#endregion
export { cleanup, get, getCacheType, init, set, setWithRawTtl };
//# sourceMappingURL=index.d.ts.map