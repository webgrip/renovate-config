//#region lib/workers/repository/update/pr/changelog/types.d.ts
interface ChangeLogNotes {
  body?: string;
  id?: number;
  name?: string;
  tag?: string;
  notesSourceUrl: string;
  url: string;
}
interface ChangeLogChange {
  date: Date;
  message: string;
  sha: string;
}
interface ChangeLogRelease {
  changes: ChangeLogChange[];
  compare: {
    url?: string;
  };
  date: string | Date;
  releaseNotes?: ChangeLogNotes;
  version: string;
  gitRef: string;
}
type ChangeLogPlatform = 'bitbucket' | 'bitbucket-server' | 'forgejo' | 'gitea' | 'github' | 'gitlab';
interface ChangeLogProject {
  packageName?: string;
  depName?: string;
  type: ChangeLogPlatform;
  apiBaseUrl: string;
  baseUrl: string;
  repository: string;
  sourceUrl: string;
  sourceDirectory?: string;
}
type ChangeLogError = 'MissingBitbucketToken' | 'MissingGithubToken' | 'MissingGitlabToken';
interface ChangeLogResult {
  hasReleaseNotes?: boolean;
  project?: ChangeLogProject;
  versions?: ChangeLogRelease[];
  error?: ChangeLogError;
}
//#endregion
export { ChangeLogRelease, ChangeLogResult };
//# sourceMappingURL=types.d.ts.map