import { MatchStringsStrategy } from "../../../../config/types.js";

//#region lib/modules/manager/custom/regex/types.d.ts
interface RegexManagerTemplates {
  depNameTemplate?: string;
  packageNameTemplate?: string;
  datasourceTemplate?: string;
  versioningTemplate?: string;
  depTypeTemplate?: string;
  currentValueTemplate?: string;
  currentDigestTemplate?: string;
  extractVersionTemplate?: string;
  registryUrlTemplate?: string;
}
interface RegexManagerConfig extends RegexManagerTemplates {
  matchStrings: string[];
  matchStringsStrategy?: MatchStringsStrategy;
  autoReplaceStringTemplate?: string;
}
//#endregion
export { RegexManagerConfig };
//# sourceMappingURL=types.d.ts.map