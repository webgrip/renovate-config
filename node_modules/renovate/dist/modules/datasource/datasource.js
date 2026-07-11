import { ExternalHostError } from "../../types/errors/external-host-error.js";
import { RequestError } from "../../util/http/got.js";
import { Http } from "../../util/http/index.js";
//#region lib/modules/datasource/datasource.ts
var Datasource = class {
	id;
	constructor(id) {
		this.id = id;
		this.http = new Http(id);
	}
	caching;
	customRegistrySupport = true;
	defaultConfig;
	defaultRegistryUrls;
	defaultVersioning;
	registryStrategy = "first";
	releaseTimestampSupport = false;
	releaseTimestampNote;
	sourceUrlSupport = "none";
	sourceUrlNote;
	http;
	handleHttpErrors(_err) {}
	handleGenericErrors(err) {
		if (err instanceof ExternalHostError) throw err;
		if (err instanceof RequestError) {
			this.handleHttpErrors(err);
			const statusCode = err.response?.statusCode;
			if (statusCode) {
				if (statusCode === 429 || statusCode >= 500 && statusCode < 600) throw new ExternalHostError(err);
			}
		}
		throw err;
	}
	// istanbul ignore next: no-op implementation, never called
	postprocessRelease(_config, release) {
		return Promise.resolve(release);
	}
};
//#endregion
export { Datasource };

//# sourceMappingURL=datasource.js.map