import { RenovateConfig, RepoGlobalConfig } from "./types.js";

//#region lib/config/global.d.ts
declare class GlobalConfig {
  static OPTIONS: readonly (keyof RepoGlobalConfig)[];
  private static config;
  static get(): RepoGlobalConfig;
  static get<Key extends keyof RepoGlobalConfig>(key: Key): Required<RepoGlobalConfig>[Key];
  static get<Key extends keyof RepoGlobalConfig>(key: Key): Required<RepoGlobalConfig>[Key];
  static set(config: RenovateConfig & RepoGlobalConfig): RenovateConfig;
  static reset(): void;
}
//#endregion
export { GlobalConfig };
//# sourceMappingURL=global.d.ts.map