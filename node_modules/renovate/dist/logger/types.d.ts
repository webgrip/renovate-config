import { Stream } from "node:stream";
import { LogLevel, LogLevelString, LogLevelString as BunyanLogLevel, Serializers as BunyanSerializers, Stream as BunyanStream } from "bunyan";

//#region lib/logger/types.d.ts
interface LogError {
  level: LogLevel;
  meta: any;
  msg?: string;
}
interface Logger {
  trace(msg: string): void;
  trace(meta: Record<string, any>, msg?: string): void;
  debug(msg: string): void;
  debug(meta: Record<string, any>, msg?: string): void;
  info(msg: string): void;
  info(meta: Record<string, any>, msg?: string): void;
  warn(msg: string): void;
  warn(meta: Record<string, any>, msg?: string): void;
  error(msg: string): void;
  error(meta: Record<string, any>, msg?: string): void;
  fatal(msg: string): void;
  fatal(meta: Record<string, any>, msg?: string): void;
  once: Logger & {
    reset: () => void;
  };
}
interface BunyanRecord extends Record<string, any> {
  level: number;
  msg: string;
  module?: string;
}
type BunyanNodeStream = (NodeJS.WritableStream | Stream) & {
  writable?: boolean;
  write: (chunk: BunyanRecord, enc: BufferEncoding, cb: (err?: Error | null) => void) => void;
};
type BunyanLogger = ReturnType<typeof import('bunyan').createLogger>;
interface LogLevelRemap {
  matchMessage: string;
  newLogLevel: LogLevelString;
}
//#endregion
export { type BunyanLogLevel, BunyanLogger, BunyanNodeStream, BunyanRecord, type BunyanSerializers, type BunyanStream, LogError, LogLevelRemap, Logger };
//# sourceMappingURL=types.d.ts.map