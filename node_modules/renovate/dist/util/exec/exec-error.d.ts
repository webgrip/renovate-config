import { RawExecOptions } from "./types.js";

//#region lib/util/exec/exec-error.d.ts
interface ExecErrorData {
  cmd: string;
  stderr: string;
  stdout: string;
  options: RawExecOptions;
  exitCode?: number;
  signal?: NodeJS.Signals;
}
declare class ExecError extends Error {
  cmd: string;
  stderr: string;
  stdout: string;
  options: RawExecOptions;
  exitCode?: number;
  signal?: NodeJS.Signals;
  err?: Error;
  constructor(message: string, data: ExecErrorData, err?: Error);
}
//#endregion
export { ExecError, ExecErrorData };
//# sourceMappingURL=exec-error.d.ts.map