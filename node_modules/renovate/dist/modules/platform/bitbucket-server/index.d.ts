import { BranchStatusConfig, CreatePRConfig, EnsureCommentConfig, EnsureCommentRemovalConfig, EnsureIssueConfig, EnsureIssueResult, FileOwnerRule, FindPRConfig, Issue, MergePRConfig, PlatformParams, PlatformResult, Pr, ReattemptPlatformAutomergeConfig, RepoParams, RepoResult, UpdatePrConfig } from "../types.js";
import { BranchStatus } from "../../../types/branch-status.js";
import { BbsPr } from "./types.js";

//#region lib/modules/platform/bitbucket-server/index.d.ts
declare const id = "bitbucket-server";
declare function initPlatform({
  endpoint,
  token,
  username,
  password,
  gitAuthor
}: PlatformParams): Promise<PlatformResult>;
declare function getRepos(): Promise<string[]>;
declare function getRawFile(fileName: string, repoName?: string, branchOrTag?: string): Promise<string | null>;
declare function getJsonFile(fileName: string, repoName?: string, branchOrTag?: string): Promise<any>;
declare function initRepo({
  repository,
  cloneSubmodules,
  cloneSubmodulesFilter,
  gitUrl
}: RepoParams): Promise<RepoResult>;
declare function getBranchForceRebase(_branchName: string): Promise<boolean>;
declare function getPr(prNo: number, refreshCache?: boolean): Promise<BbsPr | null>;
declare function getPrList(): Promise<Pr[]>;
declare function findPr({
  branchName,
  prTitle,
  state,
  includeOtherAuthors
}: FindPRConfig): Promise<Pr | null>;
declare function getBranchPr(branchName: string): Promise<BbsPr | null>;
declare function refreshPr(number: number): Promise<void>;
declare function getBranchStatus(branchName: string): Promise<BranchStatus>;
declare function getBranchStatusCheck(branchName: string, context: string): Promise<BranchStatus | null>;
declare function setBranchStatus({
  branchName,
  context,
  description,
  state,
  url: targetUrl
}: BranchStatusConfig): Promise<void>;
declare function findIssue(title: string): Promise<Issue | null>;
declare function ensureIssue({
  title
}: EnsureIssueConfig): Promise<EnsureIssueResult | null>;
declare function getIssueList(): Promise<Issue[]>;
declare function ensureIssueClosing(title: string): Promise<void>;
declare function addAssignees(iid: number, assignees: string[]): Promise<void>;
declare function addReviewers(prNo: number, reviewers: string[]): Promise<void>;
/**
 * Resolves Bitbucket users by email address,
 * restricted to users who have REPO_READ permission on the target repository.
 *
 * @param emailAddress - A string that could be the user's email address.
 * @returns List of usernames for active, matched users.
 */
declare function getUsernamesByEmail(emailAddress: string): Promise<string[]>;
declare function deleteLabel(issueNo: number, label: string): Promise<void>;
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
  prBody: rawDescription,
  platformPrOptions
}: CreatePRConfig): Promise<Pr>;
declare function reattemptPlatformAutomerge({
  number,
  platformPrOptions
}: ReattemptPlatformAutomergeConfig): Promise<void>;
declare function updatePr({
  number: prNo,
  prTitle: title,
  prBody: rawDescription,
  state,
  bitbucketInvalidReviewers,
  targetBranch
}: UpdatePrConfig & {
  bitbucketInvalidReviewers?: string[] | undefined;
}): Promise<void>;
declare function mergePr({
  branchName,
  id: prNo
}: MergePRConfig): Promise<boolean>;
declare function expandGroupMembers(reviewers: string[]): Promise<string[]>;
declare function extractRulesFromCodeOwnersLines(cleanedLines: string[]): FileOwnerRule[];
declare function massageMarkdown(input: string): string;
declare function maxBodyLength(): number;
//#endregion
export { addAssignees, addReviewers, createPr, deleteLabel, ensureComment, ensureCommentRemoval, ensureIssue, ensureIssueClosing, expandGroupMembers, extractRulesFromCodeOwnersLines, findIssue, findPr, getBranchForceRebase, getBranchPr, getBranchStatus, getBranchStatusCheck, getIssueList, getJsonFile, getPr, getPrList, getRawFile, getRepos, getUsernamesByEmail, id, initPlatform, initRepo, massageMarkdown, maxBodyLength, mergePr, reattemptPlatformAutomerge, refreshPr, setBranchStatus, updatePr };
//# sourceMappingURL=index.d.ts.map