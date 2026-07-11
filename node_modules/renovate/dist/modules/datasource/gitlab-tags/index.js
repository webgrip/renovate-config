import { logger } from "../../../logger/index.js";
import { joinUrlParts } from "../../../util/url.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { asTimestamp } from "../../../util/timestamp.js";
import { Datasource } from "../datasource.js";
import { GitlabHttp } from "../../../util/http/gitlab.js";
import { defaultRegistryUrl, getDepHost, getSourceUrl } from "./util.js";
//#region lib/modules/datasource/gitlab-tags/index.ts
var GitlabTagsDatasource = class GitlabTagsDatasource extends Datasource {
	static id = "gitlab-tags";
	http;
	releaseTimestampSupport = true;
	releaseTimestampNote = "To get release timestamp we use the `created_at` field from the response.";
	sourceUrlSupport = "package";
	sourceUrlNote = "The source URL is determined by using the `packageName` and `registryUrl`.";
	constructor() {
		super(GitlabTagsDatasource.id);
		this.http = new GitlabHttp(GitlabTagsDatasource.id);
	}
	defaultRegistryUrls = [defaultRegistryUrl];
	async _getReleases({ registryUrl, packageName: repo }) {
		const url = joinUrlParts(getDepHost(registryUrl), `api/v4/projects`, encodeURIComponent(repo), `repository/tags?per_page=100`);
		const gitlabTags = (await this.http.getJsonUnchecked(url, { paginate: true })).body;
		const dependency = {
			sourceUrl: getSourceUrl(repo, registryUrl),
			releases: []
		};
		dependency.releases = gitlabTags.map(({ name, commit }) => ({
			version: name,
			gitRef: name,
			releaseTimestamp: asTimestamp(commit?.created_at)
		}));
		return dependency;
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${GitlabTagsDatasource.id}`,
			key: `getReleases:${getDepHost(config.registryUrl)}:${config.packageName}`,
			fallback: true
		}, () => this._getReleases(config));
	}
	/**
	* gitlab.getDigest
	*
	* Returs the latest commit hash of the repository.
	*/
	async _getDigest({ packageName: repo, registryUrl }, newValue) {
		const depHost = getDepHost(registryUrl);
		const urlEncodedRepo = encodeURIComponent(repo);
		let digest = null;
		try {
			if (newValue) {
				const url = joinUrlParts(depHost, `api/v4/projects`, urlEncodedRepo, `repository/commits/`, newValue);
				digest = (await this.http.getJsonUnchecked(url)).body.id;
			} else {
				const url = joinUrlParts(depHost, `api/v4/projects`, urlEncodedRepo, `repository/commits?per_page=1`);
				digest = (await this.http.getJsonUnchecked(url)).body[0].id;
			}
		} catch (err) {
			logger.debug({
				gitlabRepo: repo,
				err,
				registryUrl
			}, "Error getting latest commit from Gitlab repo");
		}
		if (!digest) return null;
		return digest;
	}
	getDigest(config, newValue) {
		return withCache({
			namespace: `datasource-${GitlabTagsDatasource.id}`,
			key: `getDigest:${getDepHost(config.registryUrl)}:${config.packageName}`,
			fallback: true
		}, () => this._getDigest(config, newValue));
	}
};
//#endregion
export { GitlabTagsDatasource };

//# sourceMappingURL=index.js.map