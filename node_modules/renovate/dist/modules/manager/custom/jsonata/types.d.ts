//#region lib/modules/manager/custom/jsonata/types.d.ts
interface JSONataManagerTemplates {
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
interface JSONataManagerConfig extends JSONataManagerTemplates {
  fileFormat: string;
  matchStrings: string[];
}
//#endregion
export { JSONataManagerConfig };
//# sourceMappingURL=types.d.ts.map