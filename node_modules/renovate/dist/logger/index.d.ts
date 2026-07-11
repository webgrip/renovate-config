import { BunyanLogLevel, BunyanRecord, BunyanStream, Logger } from "./types.js";

//#region lib/logger/index.d.ts
declare function logLevel(): BunyanLogLevel;
declare const logger: Logger;
declare function init(): Promise<void>;
declare function setContext(value: string): void;
declare function getContext(): any;
declare function setMeta(obj: Record<string, unknown>): void;
declare function addMeta(obj: Record<string, unknown>): void;
declare function removeMeta(fields: string[]): void;
declare function withMeta<T>(obj: Record<string, unknown>, cb: () => T): T;
declare function addStream(stream: BunyanStream): void;
/**
 * For testing purposes only
 * @param name stream name
 * @param level log level
 * @private
 */
declare function levels(name: 'stdout' | 'logfile', level: BunyanLogLevel): void;
declare function getProblems(): BunyanRecord[];
declare function clearProblems(): void;
//#endregion
export { addMeta, addStream, clearProblems, getContext, getProblems, init, levels, logLevel, logger, removeMeta, setContext, setMeta, withMeta };
//# sourceMappingURL=index.d.ts.map