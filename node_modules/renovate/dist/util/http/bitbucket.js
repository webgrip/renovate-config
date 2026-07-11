import { HttpBase } from "./http.js";
import { isNonEmptyObject, isNullOrUndefined } from "@sindresorhus/is";
//#region lib/util/http/bitbucket.ts
const MAX_PAGES = 100;
const MAX_PAGELEN = 100;
let baseUrl = "https://api.bitbucket.org/";
function setBaseUrl(url) {
	baseUrl = url;
}
var BitbucketHttp = class extends HttpBase {
	get baseUrl() {
		return baseUrl;
	}
	constructor(type = "bitbucket", options) {
		super(type, options);
	}
	extraOptions() {
		return super.extraOptions().concat(["paginate", "pagelen"]);
	}
	async requestJsonUnsafe(method, options) {
		const resolvedUrl = this.resolveUrl(options.url, options.httpOptions);
		const opts = {
			...options,
			url: resolvedUrl
		};
		const paginate = opts.httpOptions?.paginate;
		if (paginate && !hasPagelen(resolvedUrl)) {
			const pagelen = opts.httpOptions.pagelen ?? MAX_PAGELEN;
			resolvedUrl.searchParams.set("pagelen", pagelen.toString());
		}
		const result = await super.requestJsonUnsafe(method, opts);
		if (paginate && isPagedResult(result.body)) {
			// v8 ignore else -- TODO: add test #40625
			if (opts.httpOptions) opts.httpOptions.memCache = false;
			const resultBody = result.body;
			let nextURL = result.body.next;
			let page = 1;
			for (; nextURL && page <= MAX_PAGES; page++) {
				opts.url = nextURL;
				const nextResult = await super.requestJsonUnsafe(method, opts);
				resultBody.values.push(...nextResult.body.values);
				nextURL = nextResult.body.next;
			}
			resultBody.pagelen = resultBody.values.length;
			/* v8 ignore next -- hard to test all branches */
			resultBody.size = page <= MAX_PAGES ? resultBody.values.length : void 0;
			// v8 ignore next -- hard to test all branches
			resultBody.next = page <= MAX_PAGES ? nextURL : void 0;
		}
		return result;
	}
};
function hasPagelen(url) {
	return !isNullOrUndefined(url.searchParams.get("pagelen"));
}
function isPagedResult(obj) {
	return isNonEmptyObject(obj) && Array.isArray(obj.values);
}
//#endregion
export { BitbucketHttp, setBaseUrl };

//# sourceMappingURL=bitbucket.js.map