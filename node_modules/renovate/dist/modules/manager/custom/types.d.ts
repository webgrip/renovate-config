import { JSONataManagerConfig } from "./jsonata/types.js";
import { RegexManagerConfig } from "./regex/types.js";

//#region lib/modules/manager/custom/types.d.ts
interface CustomExtractConfig extends Partial<RegexManagerConfig>, Partial<JSONataManagerConfig> {}
type CustomManagerName = 'jsonata' | 'regex';
interface CustomManager extends Partial<RegexManagerConfig>, Partial<JSONataManagerConfig> {
  customType: CustomManagerName;
  managerFilePatterns: string[];
}
//#endregion
export { CustomExtractConfig, CustomManager };
//# sourceMappingURL=types.d.ts.map