import { AutodiscoverConfig, BranchStatusConfig, CreatePRConfig, EnsureCommentConfig, EnsureCommentRemovalConfig, EnsureIssueConfig, EnsureIssueResult, FindPRConfig, Issue, MergePRConfig, PlatformParams, PlatformResult, Pr, RepoParams, RepoResult, UpdatePrConfig } from "../types.js";
import { BranchStatus } from "../../../types/branch-status.js";
//#region lib/modules/platform/bitbucket/index.d.ts
declare const id = "bitbucket";
declare function resetPlatform(): void;
declare function initPlatform({
  endpoint,
  username,
  password,
  token
}: PlatformParams): Promise<PlatformResult>;
declare function getRepos(config: AutodiscoverConfig): Promise<string[]>;
declare function getRawFile(fileName: string, repoName?: string, branchOrTag?: string): Promise<string | null>;
declare function getJsonFile(fileName: string, repoName?: string, branchOrTag?: string): Promise<any>;
declare function initRepo({
  repository,
  cloneSubmodules,
  cloneSubmodulesFilter
}: RepoParams): Promise<RepoResult>;
declare function getPrList(): Promise<Pr[]>;
declare function findPr({
  branchName,
  prTitle,
  state,
  includeOtherAuthors
}: FindPRConfig): Promise<Pr | null>;
declare function getPr(prNo: number): Promise<Pr | null>;
declare function getBranchPr(branchName: string): Promise<Pr | null>;
declare function getBranchStatus(branchName: string, internalChecksAsSuccess: boolean): Promise<BranchStatus>;
declare function getBranchStatusCheck(branchName: string, context: string): Promise<BranchStatus | null>;
declare function setBranchStatus({
  branchName,
  context,
  description,
  state,
  url: targetUrl
}: BranchStatusConfig): Promise<void>;
declare function findIssue(title: string): Promise<Issue | null>;
/**
 * Remove or transform markdown into Bitbucket supported syntax.
 *
 * See https://bitbucket.org/tutorials/markdowndemo/src for supported markdown syntax
 */
/**
 * Remove or transform markdown into Bitbucket supported syntax.
 *
 * See https://bitbucket.org/tutorials/markdowndemo/src for supported markdown syntax
 */
declare function massageMarkdown(input: string): string;
declare function maxBodyLength(): number;
declare function ensureIssue({
  title,
  reuseTitle,
  body
}: EnsureIssueConfig): Promise<EnsureIssueResult | null>;
declare function getIssueList(): Promise<Issue[]>;
declare function ensureIssueClosing(title: string): Promise<void>;
declare function addAssignees(_prNr: number, _assignees: string[]): Promise<void>;
declare function addReviewers(prId: number, reviewers: string[]): Promise<void>;
declare function deleteLabel(): never;
declare function ensureComment({
  number,
  topic,
  content
}: EnsureCommentConfig): Promise<boolean>;
declare function ensureCommentRemoval(deleteConfig: EnsureCommentRemovalConfig): Promise<void>;
declare function createPr({
  sourceBranch,
  targetBranch,
  prTitle: title,
  prBody: description,
  platformPrOptions
}: CreatePRConfig): Promise<Pr>;
declare function updatePr({
  number: prNo,
  prTitle: title,
  prBody: description,
  state,
  targetBranch
}: UpdatePrConfig): Promise<void>;
declare function mergePr({
  branchName,
  id: prNo,
  strategy: mergeStrategy
}: MergePRConfig): Promise<boolean>;
//#endregion
export { addAssignees, addReviewers, createPr, deleteLabel, ensureComment, ensureCommentRemoval, ensureIssue, ensureIssueClosing, findIssue, findPr, getBranchPr, getBranchStatus, getBranchStatusCheck, getIssueList, getJsonFile, getPr, getPrList, getRawFile, getRepos, id, initPlatform, initRepo, massageMarkdown, maxBodyLength, mergePr, resetPlatform, setBranchStatus, updatePr };
//# sourceMappingURL=index.d.ts.map