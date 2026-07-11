import { withCache } from "../../../util/cache/package/with-cache.js";
import { Datasource } from "../datasource.js";
import { ForgejoHttp } from "../../../util/http/forgejo.js";
import { Commits, Tag } from "../forgejo-tags/schema.js";
import { ForgejoTagsDatasource } from "../forgejo-tags/index.js";
import { Releases } from "./schema.js";
//#region lib/modules/datasource/forgejo-releases/index.ts
var ForgejoReleasesDatasource = class ForgejoReleasesDatasource extends Datasource {
	static id = "forgejo-releases";
	http = new ForgejoHttp(ForgejoReleasesDatasource.id);
	static defaultRegistryUrls = ["https://code.forgejo.org"];
	static cacheNamespace = `datasource-${ForgejoReleasesDatasource.id}`;
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `published_at` field in the results.";
	sourceUrlSupport = "package";
	sourceUrlNote = "The source URL is determined by using the `packageName` and `registryUrl`.";
	constructor() {
		super(ForgejoReleasesDatasource.id);
	}
	async _getReleases({ registryUrl, packageName: repo }) {
		const url = `${ForgejoTagsDatasource.getApiUrl(registryUrl)}repos/${repo}/releases?draft=false`;
		const tags = (await this.http.getJson(url, { paginate: true }, Releases)).body;
		return {
			sourceUrl: ForgejoTagsDatasource.getSourceUrl(repo, registryUrl),
			registryUrl: ForgejoTagsDatasource.getRegistryURL(registryUrl),
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
			namespace: ForgejoReleasesDatasource.cacheNamespace,
			key: ForgejoTagsDatasource.getCacheKey(config.registryUrl, config.packageName, "releases"),
			fallback: true
		}, () => this._getReleases(config));
	}
	async _getTagCommit(registryUrl, repo, tag) {
		const url = `${ForgejoTagsDatasource.getApiUrl(registryUrl)}repos/${repo}/tags/${tag}`;
		const { body } = await this.http.getJson(url, Tag);
		return body.commit.sha;
	}
	getTagCommit(registryUrl, repo, tag) {
		return withCache({
			namespace: ForgejoReleasesDatasource.cacheNamespace,
			key: ForgejoTagsDatasource.getCacheKey(registryUrl, repo, `tag-${tag}`)
		}, () => this._getTagCommit(registryUrl, repo, tag));
	}
	async _getDigest({ packageName: repo, registryUrl }, newValue) {
		if (newValue?.length) return this.getTagCommit(registryUrl, repo, newValue);
		const url = `${ForgejoTagsDatasource.getApiUrl(registryUrl)}repos/${repo}/commits?stat=false&verification=false&files=false&page=1&limit=1`;
		const { body } = await this.http.getJson(url, Commits);
		if (body.length === 0) return null;
		return body[0].sha;
	}
	getDigest(config, newValue) {
		return withCache({
			namespace: ForgejoReleasesDatasource.cacheNamespace,
			key: ForgejoTagsDatasource.getCacheKey(config.registryUrl, config.packageName, "digest"),
			fallback: true
		}, () => this._getDigest(config, newValue));
	}
};
//#endregion
export { ForgejoReleasesDatasource };

//# sourceMappingURL=index.js.map