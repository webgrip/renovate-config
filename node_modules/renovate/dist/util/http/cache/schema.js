import { z } from "zod/v4";
//#region lib/util/http/cache/schema.ts
const HttpCache = z.object({
	etag: z.string().optional(),
	lastModified: z.string().optional(),
	httpResponse: z.unknown(),
	timestamp: z.string()
}).nullable().catch(null);
//#endregion
export { HttpCache };

//# sourceMappingURL=schema.js.map