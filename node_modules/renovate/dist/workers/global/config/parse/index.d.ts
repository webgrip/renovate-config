import { AllConfig } from "../../../../config/types.js";

//#region lib/workers/global/config/parse/index.d.ts
declare function resolveGlobalExtends(globalExtends: string[], ignorePresets?: string[]): Promise<AllConfig>;
declare function parseConfigs(env: NodeJS.ProcessEnv, argv: string[]): Promise<AllConfig>;
//#endregion
export { parseConfigs, resolveGlobalExtends };
//# sourceMappingURL=index.d.ts.map