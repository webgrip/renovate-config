import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { joinUrlParts } from "../../../util/url.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { parse } from "../../../util/html.js";
import { RequestError } from "../../../util/http/got.js";
import "../../../util/http/index.js";
import { asTimestamp } from "../../../util/timestamp.js";
import { Datasource } from "../datasource.js";
import { datasource } from "./common.js";
//#region lib/modules/datasource/artifactory/index.ts
var ArtifactoryDatasource = class extends Datasource {
	static id = datasource;
	constructor() {
		super(datasource);
	}
	customRegistrySupport = true;
	caching = true;
	registryStrategy = "merge";
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the date-like text, next to the version hyperlink tag in the results.";
	async _getReleases({ packageName, registryUrl }) {
		if (!registryUrl) {
			logger.warn({ packageName }, "artifactory datasource requires custom registryUrl. Skipping datasource");
			return null;
		}
		const url = joinUrlParts(registryUrl, packageName);
		const result = { releases: [] };
		try {
			parse((await this.http.getText(url)).body, { blockTextElements: {
				script: true,
				noscript: true,
				style: true
			} }).querySelectorAll("a").filter((node) => node.innerHTML !== "../" && node.innerHTML !== "..").forEach((node) => {
				const thisRelease = {
					version: node.innerHTML.endsWith("/") ? node.innerHTML.slice(0, -1) : node.innerHTML,
					releaseTimestamp: asTimestamp(node.nextSibling?.text?.trimStart()?.split(regEx(/\s{2,}/))?.[0])
				};
				result.releases.push(thisRelease);
			});
			if (result.releases.length) logger.trace({
				registryUrl,
				packageName,
				versions: result.releases.length
			}, "artifactory: Found versions");
			else logger.trace({
				registryUrl,
				packageName
			}, "artifactory: No versions found");
		} catch (err) {
			if (err instanceof RequestError) {
				if (err.response?.statusCode === 404) {
					logger.warn({
						registryUrl,
						packageName
					}, "artifactory: `Not Found` error");
					return null;
				}
			}
			this.handleGenericErrors(err);
		}
		return result.releases.length ? result : null;
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${datasource}`,
			key: `${config.registryUrl}:${config.packageName}`,
			fallback: true
		}, () => this._getReleases(config));
	}
};
//#endregion
export { ArtifactoryDatasource };

//# sourceMappingURL=index.js.map