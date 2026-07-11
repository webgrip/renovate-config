//#region lib/constants/platforms.d.ts
declare const PLATFORM_HOST_TYPES: readonly ["azure", "bitbucket", "bitbucket-server", "codecommit", "forgejo", "gerrit", "gitea", "github", "gitlab", "local", "scm-manager"];
type PlatformId = (typeof PLATFORM_HOST_TYPES)[number];
//#endregion
export { PlatformId };
//# sourceMappingURL=platforms.d.ts.map