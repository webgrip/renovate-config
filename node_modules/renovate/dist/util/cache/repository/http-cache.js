import { GlobalConfig } from "../../../config/global.js";
import { logger } from "../../../logger/index.js";
import { HttpCache } from "../../http/cache/schema.js";
import { DateTime } from "luxon";
//#region lib/util/cache/repository/http-cache.ts
function cleanupHttpCache(cacheData) {
	const { httpCache } = cacheData;
	if (!httpCache) {
		logger.trace("cleanupHttpCache: no http cache to clean up");
		return;
	}
	const ttlDays = GlobalConfig.get("httpCacheTtlDays");
	if (ttlDays === 0) {
		logger.trace("cleanupHttpCache: zero value received, removing the cache");
		delete cacheData.httpCache;
		return;
	}
	const now = DateTime.now();
	for (const [url, item] of Object.entries(httpCache)) {
		const parsed = HttpCache.safeParse(item);
		// v8 ignore else -- TODO: add test #40625
		if (parsed.success && parsed.data) {
			const item = parsed.data;
			if (DateTime.fromISO(item.timestamp).plus({ days: ttlDays }) < now) {
				logger.debug(`http cache: removing expired cache for ${url}`);
				delete httpCache[url];
			}
		}
	}
}
//#endregion
export { cleanupHttpCache };

//# sourceMappingURL=http-cache.js.map