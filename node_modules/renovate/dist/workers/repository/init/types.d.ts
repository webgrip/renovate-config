//#region lib/workers/repository/init/types.d.ts
interface RepoConfigError {
  validationError: string;
  validationMessage: string;
}
interface RepoFileConfig {
  configFileName?: string;
  configFileParsed?: any;
  configFileParseError?: RepoConfigError;
}
interface RepoInitConfig {
  defaultBranchSha?: string;
  repoConfig?: RepoFileConfig;
}
//#endregion
export { RepoInitConfig };
//# sourceMappingURL=types.d.ts.map