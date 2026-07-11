import { newlineRegex, regEx } from "../../../util/regex.js";
import { GlobalConfig } from "../../../config/global.js";
import { logger, withMeta } from "../../../logger/index.js";
import { parseUrl } from "../../../util/url.js";
import { detectPlatform } from "../../../util/common.js";
import "../../versioning/npm/index.js";
import api from "../../versioning/docker/index.js";
import { id } from "../../versioning/exact/index.js";
import { id as id$1 } from "../../versioning/github-actions/index.js";
import { id as id$2 } from "../../versioning/node/index.js";
import { ForgejoTagsDatasource } from "../../datasource/forgejo-tags/index.js";
import { GiteaTagsDatasource } from "../../datasource/gitea-tags/index.js";
import { GithubDigestDatasource } from "../../datasource/github-digest/index.js";
import { GithubReleasesDatasource } from "../../datasource/github-releases/index.js";
import { GithubRunnersDatasource } from "../../datasource/github-runners/index.js";
import { GithubTagsDatasource } from "../../datasource/github-tags/index.js";
import { getDep } from "../dockerfile/extract.js";
import { CommunityActions } from "./community.js";
import { isSha, isShortSha, parseUsesLine, versionLikeRe } from "./parse.js";
import { Workflow } from "./schema.js";
import is from "@sindresorhus/is";
//#region lib/modules/manager/github-actions/extract.ts
function detectCustomGitHubRegistryUrlsForActions() {
	const endpoint = GlobalConfig.get("endpoint");
	const registryUrls = ["https://github.com"];
	if (endpoint && GlobalConfig.get("platform") === "github") {
		const parsedEndpoint = parseUrl(endpoint);
		if (!parsedEndpoint) {
			logger.warn({ endpoint }, "Failed to parse endpoint url");
			return {};
		}
		if (parsedEndpoint.host !== "github.com" && parsedEndpoint.host !== "api.github.com") {
			registryUrls.unshift(`${parsedEndpoint.protocol}//${parsedEndpoint.host}`);
			return { registryUrls };
		}
	}
	return {};
}
function extractDockerAction(actionRef, config) {
	const dep = getDep(actionRef.originalRef, true, config.registryAliases);
	dep.depType = "docker";
	dep.replaceString = actionRef.originalRef;
	return dep;
}
function extractRepositoryAction(actionRef, parsed, customRegistryUrlsPackageDependency) {
	const { replaceString: valueString, quote, commentData, commentPrecedingWhitespace } = parsed;
	const { owner, repo, path: subPath, ref, hostname, isExplicitHostname } = actionRef;
	const registryUrl = isExplicitHostname ? `https://${hostname}/` : "";
	const packageName = `${owner}/${repo}`;
	const depName = `${registryUrl}${packageName}`;
	const dep = {
		depName,
		commitMessageTopic: "{{{depName}}} action",
		versioning: id$1,
		depType: "action",
		replaceString: valueString,
		autoReplaceStringTemplate: `${quote}{{depName}}${subPath ? `/${subPath}` : ""}@{{#if newDigest}}{{newDigest}}${quote}{{#if newValue}}${commentPrecedingWhitespace || " "}# {{newValue}}{{/if}}{{/if}}{{#unless newDigest}}{{newValue}}${quote}{{/unless}}`,
		...isExplicitHostname ? detectDatasource(registryUrl) : customRegistryUrlsPackageDependency
	};
	if (packageName !== depName) dep.packageName = packageName;
	if ((commentData.pinnedVersion ?? (isSha(ref) || isShortSha(ref) ? commentData.ref : void 0)) && !is.undefined(commentData.index) && !is.undefined(commentData.matchedString)) {
		const cleanComment = parsed.commentString.slice(1);
		const matchEndIndex = commentData.index + commentData.matchedString.length;
		dep.replaceString = `${valueString}${commentPrecedingWhitespace}#${cleanComment.slice(0, matchEndIndex)}`;
	} else if (commentData.ratchetExclude) dep.replaceString = valueString + commentPrecedingWhitespace + parsed.commentString;
	if (isSha(ref)) {
		dep.currentValue = commentData.pinnedVersion ?? commentData.ref;
		dep.currentDigest = ref;
	} else if (isShortSha(ref)) {
		dep.currentValue = commentData.pinnedVersion ?? commentData.ref;
		dep.currentDigestShort = ref;
	} else dep.currentValue = ref;
	if (!dep.currentValue) {
		dep.enabled = false;
		dep.skipReason = "unversioned-reference";
	}
	const isVersionLike = dep.currentValue && versionLikeRe.test(dep.currentValue);
	if (!dep.datasource && dep.currentValue && !isVersionLike) {
		dep.datasource = GithubDigestDatasource.id;
		dep.versioning = id;
	}
	dep.datasource ??= GithubTagsDatasource.id;
	return dep;
}
function extractWithRegex(content, config) {
	const customRegistryUrlsPackageDependency = detectCustomGitHubRegistryUrlsForActions();
	logger.trace("github-actions.extractWithRegex()");
	const deps = [];
	for (const line of content.split(newlineRegex)) {
		if (line.trim().startsWith("#")) continue;
		const parsed = parseUsesLine(line);
		if (!parsed?.actionRef) continue;
		const { actionRef } = parsed;
		if (actionRef.kind === "docker") {
			deps.push(extractDockerAction(actionRef, config));
			continue;
		}
		if (actionRef.kind === "repository") deps.push(extractRepositoryAction(actionRef, parsed, customRegistryUrlsPackageDependency));
	}
	return deps;
}
function detectDatasource(registryUrl) {
	switch (detectPlatform(registryUrl)) {
		case "forgejo": return {
			registryUrls: [registryUrl],
			datasource: ForgejoTagsDatasource.id
		};
		case "gitea": return {
			registryUrls: [registryUrl],
			datasource: GiteaTagsDatasource.id
		};
		case "github": return { registryUrls: [registryUrl] };
	}
	return { skipReason: "unsupported-url" };
}
const runnerVersionRegex = regEx(/^\s*(?<depName>[a-zA-Z]+)-(?<currentValue>[^\s]+)/);
function extractRunner(runner) {
	const runnerVersionGroups = runnerVersionRegex.exec(runner)?.groups;
	if (!runnerVersionGroups) return null;
	const { depName, currentValue } = runnerVersionGroups;
	if (!GithubRunnersDatasource.isValidRunner(depName, currentValue)) return null;
	const dependency = {
		depName,
		currentValue,
		replaceString: `${depName}-${currentValue}`,
		depType: "github-runner",
		datasource: GithubRunnersDatasource.id,
		autoReplaceStringTemplate: "{{depName}}-{{newValue}}"
	};
	if (!api.isValid(currentValue)) dependency.skipReason = "invalid-version";
	return dependency;
}
const versionedActions = {
	go: "npm",
	node: id$2,
	python: "npm"
};
function extractVersionedAction(step) {
	for (const [action, versioning] of Object.entries(versionedActions)) {
		const actionName = `actions/setup-${action}`;
		if (step.uses !== actionName && !step.uses?.startsWith(`${actionName}@`)) continue;
		const fieldName = `${action}-version`;
		const currentValue = step.with?.[fieldName];
		if (!currentValue) return null;
		return {
			datasource: GithubReleasesDatasource.id,
			depName: action,
			packageName: `actions/${action}-versions`,
			versioning,
			extractVersion: "^(?<version>\\d+\\.\\d+\\.\\d+)(-\\d+)?$",
			currentValue,
			depType: "uses-with"
		};
	}
	return null;
}
function extractSteps(steps) {
	const deps = [];
	for (const step of steps) {
		const res = CommunityActions.safeParse(step);
		if (res.success) {
			deps.push(res.data);
			continue;
		}
		const versionedDep = extractVersionedAction(step);
		if (versionedDep) deps.push(versionedDep);
	}
	return deps;
}
function extractWithYAMLParser(content, packageFile, config) {
	logger.trace("github-actions.extractWithYAMLParser()");
	const obj = withMeta({ packageFile }, () => Workflow.parse(content));
	if (!obj) return [];
	if ("runs" in obj && obj.runs.steps) return extractSteps(obj.runs.steps);
	if (!("jobs" in obj)) return [];
	const deps = [];
	for (const job of Object.values(obj.jobs)) {
		if (job.container) {
			const dep = getDep(job.container, true, config.registryAliases);
			if (dep) {
				dep.depType = "container";
				deps.push(dep);
			}
		}
		for (const service of job.services) {
			const dep = getDep(service, true, config.registryAliases);
			if (dep) {
				dep.depType = "service";
				deps.push(dep);
			}
		}
		for (const runner of job["runs-on"]) {
			const dep = extractRunner(runner);
			if (dep) deps.push(dep);
		}
		deps.push(...extractSteps(job.steps));
	}
	return deps;
}
function extractPackageFile(content, packageFile, config = {}) {
	logger.trace(`github-actions.extractPackageFile(${packageFile})`);
	const deps = [...extractWithRegex(content, config), ...extractWithYAMLParser(content, packageFile, config)];
	if (!deps.length) return null;
	return { deps };
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map