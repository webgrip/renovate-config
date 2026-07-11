import { detectPlatform } from "../../util/common.js";
import { parseGitUrl } from "../../util/git/url.js";
import { GitRefsDatasource } from "../datasource/git-refs/index.js";
import { GitTagsDatasource } from "../datasource/git-tags/index.js";
import { GithubTagsDatasource } from "../datasource/github-tags/index.js";
import { GitlabTagsDatasource } from "../datasource/gitlab-tags/index.js";
//#region lib/modules/manager/util.ts
function applyGitSource(dep, git, rev, tag, branch) {
	if (tag) {
		const platform = detectPlatform(git);
		if (platform === "github" || platform === "gitlab") {
			dep.datasource = platform === "github" ? GithubTagsDatasource.id : GitlabTagsDatasource.id;
			const { host, full_name } = parseGitUrl(git);
			dep.registryUrls = [`https://${host}`];
			dep.packageName = full_name;
		} else {
			dep.datasource = GitTagsDatasource.id;
			dep.packageName = git;
		}
		dep.currentValue = tag;
		dep.skipReason = void 0;
	} else if (rev) {
		dep.datasource = GitRefsDatasource.id;
		dep.packageName = git;
		dep.currentDigest = rev;
		dep.replaceString = rev;
		dep.skipReason = void 0;
	} else {
		dep.datasource = GitRefsDatasource.id;
		dep.packageName = git;
		dep.currentValue = branch;
		dep.skipReason = branch ? "git-dependency" : "unspecified-version";
	}
}
//#endregion
export { applyGitSource };

//# sourceMappingURL=util.js.map