import { PackageJson } from "type-fest";

//#region lib/types/base.d.ts
interface ModuleApi {
  displayName?: string;
  url?: string;
  /** optional URLs to add to docs as references */
  urls?: string[];
}
type RenovatePackageJson = PackageJson & {
  version: string;
};
//#endregion
export { ModuleApi, RenovatePackageJson };
//# sourceMappingURL=base.d.ts.map