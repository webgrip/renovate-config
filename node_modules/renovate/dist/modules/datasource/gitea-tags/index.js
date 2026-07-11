import { regEx } from "../../../util/regex.js";
import { ensureTrailingSlash } from "../../../util/url.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { Datasource } from "../datasource.js";
import { GiteaHttp } from "../../../util/http/gitea.js";
import { Commits, Tag, Tags } from "./schema.js";
//#region lib/modules/datasource/gitea-tags/index.ts
var GiteaTagsDatasource = class GiteaTagsDatasource extends Datasource {
	static id = "gitea-tags";
	http = new GiteaHttp(GiteaTagsDatasource.id);
	static defaultRegistryUrls = ["https://gitea.com"];
	static cacheNamespace = `datasource-${GiteaTagsDatasource.id}`;
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `created` field in the results.";
	sourceUrlSupport = "package";
	sourceUrlNote = "The source URL is determined by using the `packageName` and `registryUrl`.";
	constructor() {
		super(GiteaTagsDatasource.id);
	}
	static getRegistryURL(registryUrl) {
		return registryUrl ?? this.defaultRegistryUrls[0];
	}
	static getApiUrl(registryUrl) {
		return `${ensureTrailingSlash(GiteaTagsDatasource.getRegistryURL(registryUrl).replace(regEx(/\/api\/v1$/), ""))}api/v1/`;
	}
	static getCacheKey(registryUrl, repo, type) {
		return `${GiteaTagsDatasource.getRegistryURL(registryUrl)}:${repo}:${type}`;
	}
	static getSourceUrl(packageName, registryUrl) {
		return `${ensureTrailingSlash(GiteaTagsDatasource.getRegistryURL(registryUrl))}${packageName}`;
	}
	async _getReleases({ registryUrl, packageName: repo }) {
		const url = `${GiteaTagsDatasource.getApiUrl(registryUrl)}repos/${repo}/tags`;
		const tags = (await this.http.getJson(url, { paginate: true }, Tags)).body;
		return {
			sourceUrl: GiteaTagsDatasource.getSourceUrl(repo, registryUrl),
			registryUrl: GiteaTagsDatasource.getRegistryURL(registryUrl),
			releases: tags.map(({ name, commit }) => ({
				version: name,
				gitRef: name,
				newDigest: commit.sha,
				releaseTimestamp: commit.created
			}))
		};
	}
	getReleases(config) {
		return withCache({
			namespace: GiteaTagsDatasource.cacheNamespace,
			key: GiteaTagsDatasource.getCacheKey(config.registryUrl, config.packageName, "tags"),
			fallback: true
		}, () => this._getReleases(config));
	}
	async _getTagCommit(registryUrl, repo, tag) {
		const url = `${GiteaTagsDatasource.getApiUrl(registryUrl)}repos/${repo}/tags/${tag}`;
		const { body } = await this.http.getJson(url, Tag);
		return body.commit.sha;
	}
	getTagCommit(registryUrl, repo, tag) {
		return withCache({
			namespace: GiteaTagsDatasource.cacheNamespace,
			key: GiteaTagsDatasource.getCacheKey(registryUrl, repo, `tag-${tag}`)
		}, () => this._getTagCommit(registryUrl, repo, tag));
	}
	async _getDigest({ packageName: repo, registryUrl }, newValue) {
		if (newValue?.length) return this.getTagCommit(registryUrl, repo, newValue);
		const url = `${GiteaTagsDatasource.getApiUrl(registryUrl)}repos/${repo}/commits?stat=false&verification=false&files=false&page=1&limit=1`;
		const { body } = await this.http.getJson(url, Commits);
		if (body.length === 0) return null;
		return body[0].sha;
	}
	getDigest(config, newValue) {
		return withCache({
			namespace: GiteaTagsDatasource.cacheNamespace,
			key: GiteaTagsDatasource.getCacheKey(config.registryUrl, config.packageName, "digest"),
			fallback: true
		}, () => this._getDigest(config, newValue));
	}
};
//#endregion
export { GiteaTagsDatasource };

//# sourceMappingURL=index.js.map