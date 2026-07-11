import { BitbucketTagsDatasource } from "../bitbucket-tags/index.js";
import { getSourceUrl as getSourceUrl$1 } from "../../../util/github/url.js";
import { ForgejoTagsDatasource } from "../forgejo-tags/index.js";
import { GiteaTagsDatasource } from "../gitea-tags/index.js";
import { GithubTagsDatasource } from "../github-tags/index.js";
import { getSourceUrl as getSourceUrl$2 } from "../gitlab-tags/util.js";
import { GitlabTagsDatasource } from "../gitlab-tags/index.js";
//#region lib/modules/datasource/go/common.ts
function getSourceUrl(dataSource) {
	if (dataSource) {
		const { datasource, registryUrl, packageName } = dataSource;
		switch (datasource) {
			case ForgejoTagsDatasource.id: return ForgejoTagsDatasource.getSourceUrl(packageName, registryUrl);
			case GiteaTagsDatasource.id: return GiteaTagsDatasource.getSourceUrl(packageName, registryUrl);
			case GithubTagsDatasource.id: return getSourceUrl$1(packageName, registryUrl);
			case GitlabTagsDatasource.id: return getSourceUrl$2(packageName, registryUrl);
			case BitbucketTagsDatasource.id: return BitbucketTagsDatasource.getSourceUrl(packageName, registryUrl);
		}
	}
}
//#endregion
export { getSourceUrl };

//# sourceMappingURL=common.js.map