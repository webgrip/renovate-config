import { withCache } from "../../../util/cache/package/with-cache.js";
import { asTimestamp } from "../../../util/timestamp.js";
import { Datasource } from "../datasource.js";
import { GitlabHttp } from "../../../util/http/gitlab.js";
//#region lib/modules/datasource/gitlab-releases/index.ts
var GitlabReleasesDatasource = class GitlabReleasesDatasource extends Datasource {
	static id = "gitlab-releases";
	defaultRegistryUrls = ["https://gitlab.com"];
	static registryStrategy = "first";
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `released_at` field in the results.";
	sourceUrlSupport = "package";
	sourceUrlNote = "The source URL is determined by using the `packageName` and `registryUrl`.";
	constructor() {
		super(GitlabReleasesDatasource.id);
		this.http = new GitlabHttp(GitlabReleasesDatasource.id);
	}
	async _getReleases({ registryUrl, packageName }) {
		/* v8 ignore next 3 -- should never happen */
		if (!registryUrl) return null;
		const apiUrl = `${registryUrl}/api/v4/projects/${encodeURIComponent(packageName)}/releases`;
		try {
			const gitlabReleasesResponse = (await this.http.getJsonUnchecked(apiUrl)).body;
			return {
				sourceUrl: `${registryUrl}/${packageName}`,
				releases: gitlabReleasesResponse.map(({ tag_name, released_at }) => {
					return {
						registryUrl,
						gitRef: tag_name,
						version: tag_name,
						releaseTimestamp: asTimestamp(released_at)
					};
				})
			};
		} catch (e) {
			this.handleGenericErrors(e);
		}
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${GitlabReleasesDatasource.id}`,
			key: `${config.registryUrl}/${config.packageName}`,
			fallback: true
		}, () => this._getReleases(config));
	}
};
//#endregion
export { GitlabReleasesDatasource };

//# sourceMappingURL=index.js.map