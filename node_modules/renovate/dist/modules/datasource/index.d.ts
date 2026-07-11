import { DatasourceApi, DigestConfig, GetDigestInputConfig, GetPkgReleasesConfig, GetReleasesConfig, PostprocessReleaseConfig, PostprocessReleaseResult, RegistryStrategy, Release, ReleaseResult, ReleaseTags, SourceUrlSupport } from "./types.js";
import { AsyncResult } from "../../util/result.js";
import { isGetPkgReleasesConfig } from "./common.js";

//#region lib/modules/datasource/index.d.ts
declare const getDatasources: () => Map<string, DatasourceApi>;
declare const getDatasourceList: () => string[];
declare function getRawPkgReleases(config: GetPkgReleasesConfig): AsyncResult<ReleaseResult, Error | 'no-datasource' | 'no-package-name' | 'no-result'>;
declare function applyDatasourceFilters(releaseResult: ReleaseResult, config: GetPkgReleasesConfig): ReleaseResult;
declare function getPkgReleases(config: GetPkgReleasesConfig): Promise<ReleaseResult | null>;
declare function supportsDigests(datasource: string | undefined): boolean;
declare function getDigest(config: GetDigestInputConfig, value?: string): Promise<string | null>;
declare function getDefaultConfig(datasource: string): Promise<Record<string, unknown>>;
//#endregion
export { DatasourceApi, DigestConfig, GetDigestInputConfig, GetPkgReleasesConfig, GetReleasesConfig, PostprocessReleaseConfig, PostprocessReleaseResult, RegistryStrategy, Release, ReleaseResult, ReleaseTags, SourceUrlSupport, applyDatasourceFilters, getDatasourceList, getDatasources, getDefaultConfig, getDigest, getPkgReleases, getRawPkgReleases, isGetPkgReleasesConfig, supportsDigests };
//# sourceMappingURL=index.d.ts.map