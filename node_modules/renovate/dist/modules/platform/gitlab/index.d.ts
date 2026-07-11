import { AutodiscoverConfig, BranchStatusConfig, CreatePRConfig, EnsureCommentConfig, EnsureCommentRemovalConfig, EnsureIssueConfig, FindPRConfig, Issue, MergePRConfig, PlatformParams, PlatformResult, Pr, ReattemptPlatformAutomergeConfig, RepoParams, RepoResult, UpdatePrConfig } from "../types.js";
import { BranchStatus } from "../../../types/branch-status.js";
import { GitlabIssue, GitlabPr } from "./types.js";
import { extractRulesFromCodeOwnersLines } from "./code-owners.js";

//#region lib/modules/platform/gitlab/index.d.ts
declare function resetPlatform(): void;
declare const id = "gitlab";
declare function initPlatform({
  endpoint,
  username,
  token,
  gitAuthor
}: PlatformParams): Promise<PlatformResult>;
declare function getRepos(config?: AutodiscoverConfig): Promise<string[]>;
declare function getRawFile(fileName: string, repoName?: string, branchOrTag?: string): Promise<string | null>;
declare function getJsonFile(fileName: string, repoName?: string, branchOrTag?: string): Promise<any>;
declare function initRepo({
  repository,
  cloneSubmodules,
  cloneSubmodulesFilter,
  gitUrl
}: RepoParams): Promise<RepoResult>;
declare function getBranchForceRebase(): Promise<boolean>;
declare function getBranchStatus(branchName: string, internalChecksAsSuccess: boolean): Promise<BranchStatus>;
declare function getPrList(): Promise<Pr[]>;
declare function createPr({
  sourceBranch,
  targetBranch,
  prTitle,
  prBody: rawDescription,
  draftPR,
  labels,
  platformPrOptions
}: CreatePRConfig): Promise<Pr>;
declare function getPr(iid: number): Promise<GitlabPr>;
declare function updatePr({
  number: iid,
  prTitle,
  prBody: description,
  addLabels,
  removeLabels,
  state,
  platformPrOptions,
  targetBranch
}: UpdatePrConfig): Promise<void>;
declare function reattemptPlatformAutomerge({
  number: iid,
  platformPrOptions
}: ReattemptPlatformAutomergeConfig): Promise<void>;
declare function mergePr({
  id
}: MergePRConfig): Promise<boolean>;
declare function massageMarkdown(input: string): string;
declare function maxBodyLength(): number;
declare function labelCharLimit(): number;
declare function findPr({
  branchName,
  prTitle,
  state,
  includeOtherAuthors
}: FindPRConfig): Promise<Pr | null>;
declare function getBranchPr(branchName: string): Promise<GitlabPr | null>;
declare function getBranchStatusCheck(branchName: string, context: string): Promise<BranchStatus | null>;
declare function setBranchStatus({
  branchName,
  context,
  description,
  state: renovateState,
  url: targetUrl
}: BranchStatusConfig): Promise<void>;
declare function getIssueList(): Promise<GitlabIssue[]>;
declare function getIssue(number: number, useCache?: boolean): Promise<Issue | null>;
declare function findIssue(title: string): Promise<Issue | null>;
declare function ensureIssue({
  title,
  reuseTitle,
  body,
  labels,
  confidential
}: EnsureIssueConfig): Promise<'updated' | 'created' | null>;
declare function ensureIssueClosing(title: string): Promise<void>;
declare function addAssignees(iid: number, assignees: string[]): Promise<void>;
declare function addReviewers(iid: number, reviewers: string[]): Promise<void>;
declare function deleteLabel(issueNo: number, label: string): Promise<void>;
declare function ensureComment({
  number,
  topic,
  content
}: EnsureCommentConfig): Promise<boolean>;
declare function ensureCommentRemoval(deleteConfig: EnsureCommentRemovalConfig): Promise<void>;
declare function filterUnavailableUsers(users: string[]): Promise<string[]>;
declare function expandGroupMembers(reviewersOrAssignees: string[]): Promise<string[]>;
//#endregion
export { addAssignees, addReviewers, createPr, deleteLabel, ensureComment, ensureCommentRemoval, ensureIssue, ensureIssueClosing, expandGroupMembers, extractRulesFromCodeOwnersLines, filterUnavailableUsers, findIssue, findPr, getBranchForceRebase, getBranchPr, getBranchStatus, getBranchStatusCheck, getIssue, getIssueList, getJsonFile, getPr, getPrList, getRawFile, getRepos, id, initPlatform, initRepo, labelCharLimit, massageMarkdown, maxBodyLength, mergePr, reattemptPlatformAutomerge, resetPlatform, setBranchStatus, updatePr };
//# sourceMappingURL=index.d.ts.map