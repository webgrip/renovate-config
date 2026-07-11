import { fromBase64 } from "../../../util/string.js";
import { logger } from "../../../logger/index.js";
import { getQueryString } from "../../../util/url.js";
import { GiteaHttp } from "../../../util/http/gitea.js";
import { API_PATH } from "./utils.js";
//#region lib/modules/platform/gitea/gitea-helper.ts
const giteaHttp = new GiteaHttp();
const urlEscape = (raw) => encodeURIComponent(raw);
const commitStatusStates = [
	"unknown",
	"success",
	"pending",
	"warning",
	"failure",
	"error"
];
async function getCurrentUser(options) {
	const url = `${API_PATH}/user`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body;
}
async function getVersion(options) {
	const url = `${API_PATH}/version`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body.version;
}
async function searchRepos(params, options) {
	const url = `${API_PATH}/repos/search?${getQueryString(params)}`;
	const res = await giteaHttp.getJsonUnchecked(url, {
		...options,
		paginate: true
	});
	if (!res.body.ok) throw new Error("Unable to search for repositories, ok flag has not been set");
	return res.body.data;
}
async function orgListRepos(organization, options) {
	const url = `${API_PATH}/orgs/${organization}/repos`;
	return (await giteaHttp.getJsonUnchecked(url, {
		...options,
		paginate: true
	})).body;
}
async function getRepo(repoPath, options) {
	const url = `${API_PATH}/repos/${repoPath}`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body;
}
async function getRepoContents(repoPath, filePath, ref, options) {
	const query = getQueryString(ref ? { ref } : {});
	const url = `${API_PATH}/repos/${repoPath}/contents/${urlEscape(filePath)}?${query}`;
	const res = await giteaHttp.getJsonUnchecked(url, options);
	if (res.body.content) res.body.contentString = fromBase64(res.body.content);
	return res.body;
}
async function createPR(repoPath, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/pulls`;
	return (await giteaHttp.postJson(url, {
		...options,
		body: params
	})).body;
}
async function updatePR(repoPath, idx, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/pulls/${idx}`;
	return (await giteaHttp.patchJson(url, {
		...options,
		body: params
	})).body;
}
async function mergePR(repoPath, idx, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/pulls/${idx}/merge`;
	await giteaHttp.postJson(url, {
		...options,
		body: params
	});
}
async function getPR(repoPath, idx, options) {
	const url = `${API_PATH}/repos/${repoPath}/pulls/${idx}`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body;
}
async function getPRByBranch(repoPath, base, head, options) {
	const url = `${API_PATH}/repos/${repoPath}/pulls/${base}/${head}`;
	try {
		return (await giteaHttp.getJsonUnchecked(url, options)).body;
	} catch (err) {
		logger.trace({ err }, "Error while fetching PR");
		if (err.statusCode !== 404) logger.debug({ err }, "Error while fetching PR");
		return null;
	}
}
async function requestPrReviewers(repoPath, idx, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/pulls/${idx}/requested_reviewers`;
	await giteaHttp.postJson(url, {
		...options,
		body: params
	});
}
async function createIssue(repoPath, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues`;
	return (await giteaHttp.postJson(url, {
		...options,
		body: params
	})).body;
}
async function updateIssue(repoPath, idx, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues/${idx}`;
	return (await giteaHttp.patchJson(url, {
		...options,
		body: params
	})).body;
}
async function updateIssueLabels(repoPath, idx, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues/${idx}/labels`;
	return (await giteaHttp.putJson(url, {
		...options,
		body: params
	})).body;
}
async function closeIssue(repoPath, idx, options) {
	await updateIssue(repoPath, idx, {
		...options,
		state: "closed"
	});
}
async function searchIssues(repoPath, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues?${getQueryString({
		...params,
		type: "issues"
	})}`;
	return (await giteaHttp.getJsonUnchecked(url, {
		...options,
		paginate: true
	})).body;
}
async function getIssue(repoPath, idx, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues/${idx}`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body;
}
async function getRepoLabels(repoPath, options) {
	const url = `${API_PATH}/repos/${repoPath}/labels`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body;
}
async function getOrgLabels(orgName, options) {
	const url = `${API_PATH}/orgs/${orgName}/labels`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body;
}
async function unassignLabel(repoPath, issue, label, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues/${issue}/labels/${label}`;
	await giteaHttp.deleteJson(url, options);
}
async function createComment(repoPath, issue, body, options) {
	const params = { body };
	const url = `${API_PATH}/repos/${repoPath}/issues/${issue}/comments`;
	return (await giteaHttp.postJson(url, {
		...options,
		body: params
	})).body;
}
async function updateComment(repoPath, idx, body, options) {
	const params = { body };
	const url = `${API_PATH}/repos/${repoPath}/issues/comments/${idx}`;
	return (await giteaHttp.patchJson(url, {
		...options,
		body: params
	})).body;
}
async function deleteComment(repoPath, idx, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues/comments/${idx}`;
	await giteaHttp.deleteJson(url, options);
}
async function getComments(repoPath, issue, options) {
	const url = `${API_PATH}/repos/${repoPath}/issues/${issue}/comments`;
	return (await giteaHttp.getJsonUnchecked(url, options)).body;
}
async function createCommitStatus(repoPath, branchCommit, params, options) {
	const url = `${API_PATH}/repos/${repoPath}/statuses/${branchCommit}`;
	return (await giteaHttp.postJson(url, {
		...options,
		body: params
	})).body;
}
const giteaToRenovateStatusMapping = {
	unknown: "yellow",
	success: "green",
	pending: "yellow",
	warning: "red",
	failure: "red",
	error: "red"
};
const renovateToGiteaStatusMapping = {
	green: "success",
	yellow: "pending",
	red: "failure"
};
function filterStatus(data) {
	const ret = {};
	for (const i of data) if (!ret[i.context] || ret[i.context].id < i.id) ret[i.context] = i;
	return Object.values(ret);
}
async function getCombinedCommitStatus(repoPath, branchName, options) {
	const url = `${API_PATH}/repos/${repoPath}/commits/${urlEscape(branchName)}/statuses`;
	const res = await giteaHttp.getJsonUnchecked(url, {
		...options,
		paginate: true
	});
	let worstState = 0;
	const statuses = filterStatus(res.body);
	for (const cs of statuses) worstState = Math.max(worstState, commitStatusStates.indexOf(cs.status));
	return {
		worstStatus: commitStatusStates[worstState],
		statuses
	};
}
//#endregion
export { closeIssue, createComment, createCommitStatus, createIssue, createPR, deleteComment, getCombinedCommitStatus, getComments, getCurrentUser, getIssue, getOrgLabels, getPR, getPRByBranch, getRepo, getRepoContents, getRepoLabels, getVersion, giteaHttp, giteaToRenovateStatusMapping, mergePR, orgListRepos, renovateToGiteaStatusMapping, requestPrReviewers, searchIssues, searchRepos, unassignLabel, updateComment, updateIssue, updateIssueLabels, updatePR };

//# sourceMappingURL=gitea-helper.js.map