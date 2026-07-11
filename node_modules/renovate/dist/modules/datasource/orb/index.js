import { logger } from "../../../logger/index.js";
import { joinUrlParts } from "../../../util/url.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { asTimestamp } from "../../../util/timestamp.js";
import { Datasource } from "../datasource.js";
//#region lib/modules/datasource/orb/index.ts
const MAX_VERSIONS = 100;
const query = `
query($packageName: String!, $maxVersions: Int!) {
  orb(name: $packageName) {
    name,
    homeUrl,
    isPrivate,
    versions(count: $maxVersions) {
      version,
      createdAt
    }
  }
}
`;
var OrbDatasource = class OrbDatasource extends Datasource {
	static id = "orb";
	constructor() {
		super(OrbDatasource.id);
	}
	customRegistrySupport = true;
	defaultRegistryUrls = ["https://circleci.com/"];
	registryStrategy = "hunt";
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `createdAt` field in the results.";
	async _getReleases({ packageName, registryUrl }) {
		/* v8 ignore next 3 -- should never happen */
		if (!registryUrl) return null;
		const url = joinUrlParts(registryUrl, "graphql-unstable");
		const body = {
			query,
			variables: {
				packageName,
				maxVersions: MAX_VERSIONS
			}
		};
		const res = (await this.http.postJson(url, { body })).body;
		if (!res?.data?.orb) {
			logger.debug({ res }, `Failed to look up orb ${packageName}`);
			return null;
		}
		const { orb } = res.data;
		const homepage = orb.homeUrl?.length ? orb.homeUrl : `https://circleci.com/developer/orbs/orb/${packageName}`;
		const releases = orb.versions.map(({ version, createdAt }) => ({
			version,
			releaseTimestamp: asTimestamp(createdAt)
		}));
		const dep = {
			homepage,
			isPrivate: !!orb.isPrivate,
			releases
		};
		logger.trace({ dep }, "dep");
		return dep;
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${OrbDatasource.id}`,
			key: config.packageName,
			fallback: true
		}, () => this._getReleases(config));
	}
};
//#endregion
export { OrbDatasource };

//# sourceMappingURL=index.js.map