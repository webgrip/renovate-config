import { withCache } from "../../../util/cache/package/with-cache.js";
import { Datasource } from "../datasource.js";
import { Lazy } from "../../../util/lazy.js";
import { DescribeDBEngineVersionsCommand, RDSClient } from "@aws-sdk/client-rds";
//#region lib/modules/datasource/aws-rds/index.ts
var AwsRdsDatasource = class AwsRdsDatasource extends Datasource {
	static id = "aws-rds";
	caching = true;
	rds;
	constructor() {
		super(AwsRdsDatasource.id);
		this.rds = new Lazy(() => new RDSClient({}));
	}
	async _getReleases({ packageName: serializedFilter }) {
		const cmd = new DescribeDBEngineVersionsCommand({ Filters: JSON.parse(serializedFilter) });
		return { releases: ((await this.rds.getValue().send(cmd)).DBEngineVersions ?? []).filter((version) => version.EngineVersion).map((version) => ({
			version: version.EngineVersion,
			isDeprecated: version.Status === "deprecated"
		})) };
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${AwsRdsDatasource.id}`,
			key: `getReleases:${config.packageName}`,
			fallback: true
		}, () => this._getReleases(config));
	}
};
//#endregion
export { AwsRdsDatasource };

//# sourceMappingURL=index.js.map