import { withCache } from "../../../util/cache/package/with-cache.js";
import { Datasource } from "../datasource.js";
import { GiteaHttp } from "../../../util/http/gitea.js";
import { Commits, Tag } from "../gitea-tags/schema.js";
import { GiteaTagsDatasource } from "../gitea-tags/index.js";
import { Releases } from "./schema.js";
//#region lib/modules/datasource/gitea-releases/index.ts
var GiteaReleasesDatasource = class GiteaReleasesDatasource extends Datasource {
	static id = "gitea-releases";
	http = new GiteaHttp(GiteaReleasesDatasource.id);
	static defaultRegistryUrls = ["https://gitea.com"];
	static cacheNamespace = `datasource-${GiteaReleasesDatasource.id}`;
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `published_at` field in the results.";
	sourceUrlSupport = "package";
	sourceUrlNote = "The source URL is determined by using the `packageName` and `registryUrl`.";
	constructor() {
		super(GiteaReleasesDatasource.id);
	}
	async _getReleases({ registryUrl, packageName: repo }) {
		const url = `${GiteaTagsDatasource.getApiUrl(registryUrl)}repos/${repo}/releases?draft=false`;
		const tags = (await this.http.getJson(url, { paginate: true }, Releases)).body;
		return {
			sourceUrl: GiteaTagsDatasource.getSourceUrl(repo, registryUrl),
			registryUrl: GiteaTagsDatasource.getRegistryURL(registryUrl),
			releases: tags.map(({ tag_name, published_at, prerelease }) => ({
				version: tag_name,
				gitRef: tag_name,
				releaseTimestamp: published_at,
				isStable: !prerelease
			}))
		};
	}
	getReleases(config) {
		return withCache({
			namespace: GiteaReleasesDatasource.cacheNamespace,
			key: GiteaTagsDatasource.getCacheKey(config.registryUrl, config.packageName, "releases"),
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
			namespace: GiteaReleasesDatasource.cacheNamespace,
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
			namespace: GiteaReleasesDatasource.cacheNamespace,
			key: GiteaTagsDatasource.getCacheKey(config.registryUrl, config.packageName, "digest"),
			fallback: true
		}, () => this._getDigest(config, newValue));
	}
};
//#endregion
export { GiteaReleasesDatasource };

//# sourceMappingURL=index.js.map