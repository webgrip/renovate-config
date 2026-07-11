import { RangeStrategy } from "../../types/versioning.js";
import { MaybePromise } from "../../types/index.js";
import { ExtractConfig, GlobalManagerConfig, ManagerApi, PackageFile, PackageFileContent, RangeConfig } from "./types.js";
import { hashMap } from "./fingerprint.generated.js";

//#region lib/modules/manager/index.d.ts
declare const getManagerList: () => string[];
declare const getManagers: () => Map<string, ManagerApi>;
declare const allManagersList: string[];
declare function get<T extends keyof ManagerApi>(manager: string, name: T): ManagerApi[T] | undefined;
declare function detectAllGlobalConfig(): Promise<GlobalManagerConfig>;
declare function extractAllPackageFiles(manager: string, config: ExtractConfig, files: string[]): Promise<PackageFile[] | null>;
declare function extractPackageFile(manager: string, content: string, fileName: string, config: ExtractConfig): MaybePromise<PackageFileContent | null>;
declare function getRangeStrategy(config: RangeConfig): RangeStrategy | null;
declare function getPrettyDepType(manager: string, depType: string): string | undefined;
declare function isKnownManager(mgr: string): boolean;
/**
 * Filter a list of managers based on enabled managers.
 *
 * If enabledManagers is provided, this function returns a subset of allManagersList
 * that matches the enabled manager names, including custom managers. If enabledManagers
 * is not provided or is an empty array, it returns the full list of managers.
 */
declare function getEnabledManagersList(enabledManagers?: string[]): string[];
//#endregion
export { allManagersList, detectAllGlobalConfig, extractAllPackageFiles, extractPackageFile, get, getEnabledManagersList, getManagerList, getManagers, getPrettyDepType, getRangeStrategy, hashMap, isKnownManager };
//# sourceMappingURL=index.d.ts.map