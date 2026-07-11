import { BranchConfig } from "../../types.js";
import { PackageFile } from "../../../modules/manager/types.js";
//#region lib/workers/repository/process/extract-update.d.ts
interface ExtractResult {
  branches: BranchConfig[];
  branchList: string[];
  packageFiles: Record<string, PackageFile[]>;
}
//#endregion
export { ExtractResult };
//# sourceMappingURL=extract-update.d.ts.map