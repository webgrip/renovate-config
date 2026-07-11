import { HttpCacheProvider } from "./cache/types.js";
import { EmptyResultError } from "./errors.js";
import { OptionsInit, OptionsOfBufferResponseBody, OptionsOfJSONResponseBody, OptionsOfTextResponseBody, RequestError } from "got";
import { ZodError } from "zod/v4";
import { IncomingHttpHeaders } from "node:http";

//#region lib/util/http/types.d.ts
type GotContextOptions = {
  authType?: string;
} & Record<string, unknown>;
type GotOptions = GotBufferOptions | GotTextOptions | GotJSONOptions;
type GotBufferOptions = OptionsOfBufferResponseBody & GotExtraOptions;
type GotTextOptions = OptionsOfTextResponseBody & GotExtraOptions;
type GotJSONOptions = OptionsOfJSONResponseBody & GotExtraOptions;
type GotStreamOptions = OptionsInit & GotExtraOptions;
/**
 * Renovate extra options.
 */
interface GotExtraOptions {
  abortOnError?: boolean;
  abortIgnoreStatusCodes?: number[];
  token?: string;
  hostType?: string;
  enabled?: boolean;
  memCache?: boolean;
  noAuth?: boolean;
  context?: GotContextOptions;
  /**
   * Got request timeout, overrides got interface.
   * Do not delete in `normalizeGotOptions`.
   */
  timeout?: number;
}
/**
 * Renovate extra options that are not part of `got` options.
 */
declare const GotExtraOptionKeys: (keyof GotExtraOptions)[];
type OutgoingHttpHeaders = Record<string, string | string[] | undefined>;
type GraphqlVariables = Record<string, unknown>;
interface GraphqlOptions {
  variables?: GraphqlVariables;
  paginate?: boolean;
  count?: number;
  limit?: number;
  cursor?: string | null;
  acceptHeader?: string;
  token?: string;
  readOnly?: boolean;
}
/**
 * Renovate http options that are partly not part of `got` options.
 * Remember to delete these in `normalizeGotOptions` before passing to `got`.
 */
interface HttpOptions {
  body?: any;
  username?: string;
  password?: string;
  baseUrl?: string;
  headers?: OutgoingHttpHeaders;
  /**
   * Do not use authentication
   */
  noAuth?: boolean;
  throwHttpErrors?: boolean;
  token?: string;
  memCache?: boolean;
  cacheProvider?: HttpCacheProvider;
  readOnly?: boolean;
}
interface HttpHeaders extends IncomingHttpHeaders {
  link?: string | undefined;
}
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';
interface HttpResponse<T = string> {
  statusCode: number;
  body: T;
  headers: HttpHeaders;
  authorization?: boolean;
  cached?: boolean;
}
type Task<T> = () => Promise<T>;
type GotTask<T = unknown> = Task<HttpResponse<T>>;
interface ThrottleLimitRule {
  matchHost: string;
  throttleMs: number;
}
interface ConcurrencyLimitRule {
  matchHost: string;
  concurrency: number;
}
type SafeJsonError = RequestError | ZodError | EmptyResultError;
//#endregion
export { ConcurrencyLimitRule, GotBufferOptions, GotContextOptions, GotExtraOptionKeys, GotExtraOptions, GotJSONOptions, GotOptions, GotStreamOptions, GotTask, GotTextOptions, GraphqlOptions, GraphqlVariables, HttpHeaders, HttpMethod, HttpOptions, HttpResponse, OutgoingHttpHeaders, SafeJsonError, Task, ThrottleLimitRule };
//# sourceMappingURL=types.d.ts.map