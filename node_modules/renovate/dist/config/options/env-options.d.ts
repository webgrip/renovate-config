//#region lib/config/options/env-options.d.ts
interface EnvOptionInfo {
  configName: string;
  globalOnly: boolean;
  inheritConfigSupport: boolean;
  type: string;
}
type EnvOptionsMap = Record<string, EnvOptionInfo>;
declare function getEnvOptionsMap(): EnvOptionsMap;
//#endregion
export { EnvOptionInfo, EnvOptionsMap, getEnvOptionsMap };
//# sourceMappingURL=env-options.d.ts.map