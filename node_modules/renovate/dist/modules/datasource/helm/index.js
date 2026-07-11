import { logger } from "../../../logger/index.js";
import { ensureTrailingSlash } from "../../../util/url.js";
import { id } from "../../versioning/helm/index.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { Datasource } from "../datasource.js";
import { HelmRepository } from "./schema.js";
//#region lib/modules/datasource/helm/index.ts
var HelmDatasource = class HelmDatasource extends Datasource {
	static id = "helm";
	constructor() {
		super(HelmDatasource.id);
	}
	defaultRegistryUrls = ["https://charts.helm.sh/stable"];
	defaultConfig = { commitMessageTopic: "Helm release {{depName}}" };
	defaultVersioning = id;
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timstamp is determined from the `created` field in the results.";
	sourceUrlSupport = "package";
	sourceUrlNote = "The source URL is determined from the `home` field or the `sources` field in the results.";
	async _getRepositoryData(helmRepository) {
		const { val, err } = await this.http.getYamlSafe("index.yaml", { baseUrl: ensureTrailingSlash(helmRepository) }, HelmRepository).unwrap();
		if (err) this.handleGenericErrors(err);
		return val;
	}
	getRepositoryData(helmRepository) {
		return withCache({
			namespace: `datasource-${HelmDatasource.id}`,
			key: `repository-data:${helmRepository}`
		}, () => this._getRepositoryData(helmRepository));
	}
	async getReleases({ packageName, registryUrl: helmRepository }) {
		/* v8 ignore next 3 -- should never happen */
		if (!helmRepository) return null;
		const releases = (await this.getRepositoryData(helmRepository))[packageName];
		if (!releases) {
			logger.debug({ dependency: packageName }, `Entry ${packageName} doesn't exist in index.yaml from ${helmRepository}`);
			return null;
		}
		return releases;
	}
};
//#endregion
export { HelmDatasource };

//# sourceMappingURL=index.js.map