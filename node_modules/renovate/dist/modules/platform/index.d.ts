import { PlatformId } from "../../constants/platforms.js";
import { AutodiscoverConfig, BranchStatusConfig, CreatePRConfig, EnsureCommentConfig, EnsureCommentRemovalConfig, EnsureCommentRemovalConfigByContent, EnsureCommentRemovalConfigByTopic, EnsureIssueConfig, EnsureIssueResult, FileOwnerRule, FindPRConfig, GitUrlOption, Issue, MergePRConfig, Platform, PlatformParams, PlatformPrOptions, PlatformResult, PlatformScm, Pr, PrBodyStruct, PrDebugData, ReattemptPlatformAutomergeConfig, RepoParams, RepoResult, RepoSortMethod, SortMethod, StatusCheckConfig, UpdatePrConfig, VulnerabilityAlert } from "./types.js";
import { AllConfig } from "../../config/types.js";

//#region lib/modules/platform/index.d.ts
declare const getPlatformList: () => string[];
declare const platform: Platform;
declare function setPlatformApi(name: PlatformId): void;
declare function initPlatform(config: AllConfig): Promise<AllConfig>;
//#endregion
export { type AutodiscoverConfig, type BranchStatusConfig, type CreatePRConfig, type EnsureCommentConfig, type EnsureCommentRemovalConfig, type EnsureCommentRemovalConfigByContent, type EnsureCommentRemovalConfigByTopic, type EnsureIssueConfig, type EnsureIssueResult, type FileOwnerRule, type FindPRConfig, type GitUrlOption, type Issue, type MergePRConfig, type Platform, type PlatformParams, type PlatformPrOptions, type PlatformResult, type PlatformScm, type Pr, type PrBodyStruct, type PrDebugData, type ReattemptPlatformAutomergeConfig, type RepoParams, type RepoResult, type RepoSortMethod, type SortMethod, type StatusCheckConfig, type UpdatePrConfig, type VulnerabilityAlert, getPlatformList, initPlatform, platform, setPlatformApi };
//# sourceMappingURL=index.d.ts.map