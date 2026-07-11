//#region lib/constants/platforms.ts
const PLATFORM_HOST_TYPES = [
	"azure",
	"bitbucket",
	"bitbucket-server",
	"codecommit",
	"forgejo",
	"gerrit",
	"gitea",
	"github",
	"gitlab",
	"local",
	"scm-manager"
];
const AZURE_API_USING_HOST_TYPES = ["azure", "azure-tags"];
const GITEA_API_USING_HOST_TYPES = [
	"gitea",
	"gitea-changelog",
	"gitea-releases",
	"gitea-tags"
];
const FORGEJO_API_USING_HOST_TYPES = [
	"forgejo",
	"forgejo-changelog",
	"forgejo-releases",
	"forgejo-tags"
];
const GITHUB_API_USING_HOST_TYPES = [
	"github",
	"github-releases",
	"github-release-attachments",
	"github-tags",
	"pod",
	"hermit",
	"github-changelog",
	"conan"
];
const GITLAB_API_USING_HOST_TYPES = [
	"gitlab",
	"gitlab-releases",
	"gitlab-tags",
	"gitlab-packages",
	"gitlab-changelog",
	"pypi"
];
const BITBUCKET_API_USING_HOST_TYPES = [
	"bitbucket",
	"bitbucket-changelog",
	"bitbucket-tags"
];
const BITBUCKET_SERVER_API_USING_HOST_TYPES = [
	"bitbucket-server",
	"bitbucket-server-changelog",
	"bitbucket-server-tags"
];
//#endregion
export { AZURE_API_USING_HOST_TYPES, BITBUCKET_API_USING_HOST_TYPES, BITBUCKET_SERVER_API_USING_HOST_TYPES, FORGEJO_API_USING_HOST_TYPES, GITEA_API_USING_HOST_TYPES, GITHUB_API_USING_HOST_TYPES, GITLAB_API_USING_HOST_TYPES, PLATFORM_HOST_TYPES };

//# sourceMappingURL=platforms.js.map