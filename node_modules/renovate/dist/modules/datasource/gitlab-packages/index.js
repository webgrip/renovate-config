import { joinUrlParts } from "../../../util/url.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { asTimestamp } from "../../../util/timestamp.js";
import { Datasource } from "../datasource.js";
import { GitlabHttp } from "../../../util/http/gitlab.js";
import { datasource } from "./common.js";
//#region lib/modules/datasource/gitlab-packages/index.ts
var GitlabPackagesDatasource = class GitlabPackagesDatasource extends Datasource {
	static id = datasource;
	http;
	caching = true;
	customRegistrySupport = true;
	defaultRegistryUrls = ["https://gitlab.com"];
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `created_at` field in the results.";
	constructor() {
		super(datasource);
		this.http = new GitlabHttp(datasource);
	}
	static getGitlabPackageApiUrl(registryUrl, projectName, packageName) {
		return joinUrlParts(registryUrl, `api/v4/projects`, encodeURIComponent(projectName), `packages?package_name=${encodeURIComponent(packageName)}&per_page=100`);
	}
	async _getReleases({ registryUrl, packageName }) {
		/* v8 ignore next 3 -- should never happen */
		if (!registryUrl) return null;
		const [projectPart, packagePart] = packageName.split(":", 2);
		const apiUrl = GitlabPackagesDatasource.getGitlabPackageApiUrl(registryUrl, projectPart, packagePart);
		const result = { releases: [] };
		let response;
		try {
			response = (await this.http.getJsonUnchecked(apiUrl, { paginate: true })).body;
			result.releases = response.filter((r) => (r.conan_package_name ?? r.name) === packagePart).map(({ version, created_at }) => ({
				version,
				releaseTimestamp: asTimestamp(created_at)
			}));
		} catch (err) {
			this.handleGenericErrors(err);
		}
		return result.releases?.length ? result : null;
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${datasource}`,
			key: `${config.registryUrl}-${config.packageName}`,
			fallback: true
		}, () => this._getReleases(config));
	}
};
//#endregion
export { GitlabPackagesDatasource };

//# sourceMappingURL=index.js.map