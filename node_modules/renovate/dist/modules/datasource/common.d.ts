import { DatasourceApi, GetPkgReleasesConfig, ReleaseResult } from "./types.js";

//#region lib/modules/datasource/common.d.ts
declare function getDatasourceFor(datasource: string): DatasourceApi | null;
declare function getDefaultVersioning(datasourceName: string | undefined): string;
declare function isGetPkgReleasesConfig(input: unknown): input is GetPkgReleasesConfig;
declare function applyVersionCompatibility(releaseResult: ReleaseResult, versionCompatibility: string | undefined, currentCompatibility: string | undefined): ReleaseResult;
declare function applyExtractVersion(releaseResult: ReleaseResult, extractVersion: string | undefined): ReleaseResult;
declare function filterValidVersions<Config extends Pick<GetPkgReleasesConfig, 'versioning' | 'datasource'>>(releaseResult: ReleaseResult, config: Config): ReleaseResult;
declare function sortAndRemoveDuplicates<Config extends Pick<GetPkgReleasesConfig, 'versioning' | 'datasource'>>(releaseResult: ReleaseResult, config: Config): ReleaseResult;
declare function applyConstraintsFiltering<Config extends Pick<GetPkgReleasesConfig, 'constraintsFiltering' | 'constraintsVersioning' | 'versioning' | 'datasource' | 'constraints' | 'packageName'>>(releaseResult: ReleaseResult, config: Config): ReleaseResult;
//#endregion
export { applyConstraintsFiltering, applyExtractVersion, applyVersionCompatibility, filterValidVersions, getDatasourceFor, getDefaultVersioning, isGetPkgReleasesConfig, sortAndRemoveDuplicates };
//# sourceMappingURL=common.d.ts.map