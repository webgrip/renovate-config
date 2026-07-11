import { CommandWithOptions, ExecResult, RawExecOptions } from "./types.js";

//#region lib/util/exec/common.d.ts
declare function exec(commandArgument: string | CommandWithOptions, opts: RawExecOptions): Promise<ExecResult>;
declare const rawExec: (cmd: string | CommandWithOptions, opts: RawExecOptions) => Promise<ExecResult>;
//#endregion
export { exec, rawExec };
//# sourceMappingURL=common.d.ts.map