import { Pr } from "../types.js";

//#region lib/modules/platform/gitlab/types.d.ts
interface GitlabIssue {
  iid: number;
  labels?: string[];
  title: string;
}
interface GitlabPr extends Pr {
  headPipelineStatus?: string;
  headPipelineSha?: string;
}
//#endregion
export { GitlabIssue, GitlabPr };
//# sourceMappingURL=types.d.ts.map