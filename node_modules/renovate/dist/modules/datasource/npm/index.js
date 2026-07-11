import "../../versioning/npm/index.js";
import { Datasource } from "../datasource.js";
import { defaultRegistryUrl } from "./common.js";
import { getDependency } from "./get.js";
import "./npmrc.js";
//#region lib/modules/datasource/npm/index.ts
var NpmDatasource = class NpmDatasource extends Datasource {
	static id = "npm";
	customRegistrySupport = true;
	registryStrategy = "first";
	defaultVersioning = "npm";
	defaultRegistryUrls = [defaultRegistryUrl];
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `time` field in the results.";
	sourceUrlSupport = "release";
	sourceUrlNote = "The source URL is determined from the `repository` field in the results.";
	constructor() {
		super(NpmDatasource.id);
	}
	async getReleases({ packageName, registryUrl }) {
		/* v8 ignore next 3 -- should never happen */
		if (!registryUrl) return null;
		return await getDependency(this.http, registryUrl, packageName);
	}
};
//#endregion
export { NpmDatasource };

//# sourceMappingURL=index.js.map