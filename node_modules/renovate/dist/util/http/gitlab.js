import { getEnv } from "../env.js";
import { logger } from "../../logger/index.js";
import { parseLinkHeader, parseUrl } from "../url.js";
import { ExternalHostError } from "../../types/errors/external-host-error.js";
import { HttpBase } from "./http.js";
import { isArray, isString } from "@sindresorhus/is";
import { RequestError } from "got";
//#region lib/util/http/gitlab.ts
let baseUrl = "https://gitlab.com/api/v4/";
const setBaseUrl = (url) => {
	baseUrl = url;
};
var GitlabHttp = class extends HttpBase {
	get baseUrl() {
		return baseUrl;
	}
	constructor(type = "gitlab", options) {
		super(type, options);
	}
	extraOptions() {
		return super.extraOptions().concat(["paginate"]);
	}
	async requestJsonUnsafe(method, options) {
		const resolvedUrl = this.resolveUrl(options.url, options.httpOptions);
		const opts = {
			...options,
			url: resolvedUrl
		};
		opts.httpOptions ??= {};
		opts.httpOptions.throwHttpErrors = true;
		const result = await super.requestJsonUnsafe(method, opts);
		if (opts.httpOptions.paginate && isArray(result.body)) {
			opts.httpOptions.memCache = false;
			try {
				const linkHeader = parseLinkHeader(result.headers.link);
				const nextUrl = linkHeader?.next?.url ? parseUrl(linkHeader.next.url) : null;
				if (nextUrl) {
					if (getEnv().GITLAB_IGNORE_REPO_URL) {
						const defaultEndpoint = parseUrl(baseUrl);
						nextUrl.protocol = defaultEndpoint.protocol;
						nextUrl.host = defaultEndpoint.host;
					}
					opts.url = nextUrl;
					const nextResult = await this.requestJsonUnsafe(method, opts);
					// v8 ignore else -- TODO: add test #40625
					if (isArray(nextResult.body)) result.body.push(...nextResult.body);
				}
			} catch (err) {
				logger.warn({ err }, "Pagination error");
			}
		}
		return result;
	}
	handleError(url, _httpOptions, err) {
		if (err instanceof RequestError && err.response?.statusCode) {
			if (err.response.statusCode === 404) {
				logger.trace({ err }, "GitLab 404");
				logger.debug({ url }, "GitLab API 404");
				throw err;
			}
			logger.debug({ err }, "Gitlab API error");
			if (err.response.statusCode === 429 || err.response.statusCode >= 500 && err.response.statusCode < 600) throw new ExternalHostError(err, "gitlab");
		}
		if ("code" in err && isString(err.code) && [
			"EAI_AGAIN",
			"ECONNRESET",
			"ETIMEDOUT",
			"UNABLE_TO_VERIFY_LEAF_SIGNATURE"
		].includes(err.code)) throw new ExternalHostError(err, "gitlab");
		if (err.name === "ParseError") throw new ExternalHostError(err, "gitlab");
		throw err;
	}
	calculateRetryDelay(retryObject) {
		const { error, attemptCount, retryOptions } = retryObject;
		if (attemptCount <= retryOptions.limit && error.options.method === "POST" && error.response?.statusCode === 409 && error.response.rawBody.toString().includes("Resource lock")) {
			const noise = Math.random() * 100;
			return 2 ** (attemptCount - 1) * 1e3 + noise;
		}
		return super.calculateRetryDelay(retryObject);
	}
};
//#endregion
export { GitlabHttp, setBaseUrl };

//# sourceMappingURL=gitlab.js.map