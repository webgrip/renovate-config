import { z } from "zod/v4";
//#region lib/modules/platform/gitea/schema.ts
const ContentsResponse = z.object({
	name: z.string(),
	path: z.string(),
	type: z.union([z.literal("file"), z.literal("dir")]),
	content: z.string().nullable()
});
const ContentsListResponse = z.array(ContentsResponse);
//#endregion
export { ContentsListResponse, ContentsResponse };

//# sourceMappingURL=schema.js.map