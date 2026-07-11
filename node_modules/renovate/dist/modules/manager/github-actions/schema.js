import { LooseArray, LooseRecord, Yaml, withDebugMessage } from "../../../util/schema-utils/index.js";
import { z } from "zod/v4";
//#region lib/modules/manager/github-actions/schema.ts
const Steps = z.object({
	uses: z.string(),
	with: LooseRecord(z.union([z.string(), z.number().transform((s) => s.toString())]))
});
const WorkFlowJobs = z.object({ jobs: LooseRecord(z.object({
	container: z.union([z.string(), z.object({ image: z.string() }).transform((v) => v.image)]).optional().catch(void 0),
	services: LooseRecord(z.union([z.object({ image: z.string() }).transform((v) => v.image), z.string()])).catch({}).transform((services) => Object.values(services)),
	"runs-on": z.union([z.string().transform((v) => [v]), z.array(z.string())]).catch([]),
	steps: LooseArray(Steps).catch([])
})) });
const Actions = z.object({ runs: z.object({
	using: z.string(),
	steps: LooseArray(Steps).optional().catch([])
}) });
const Workflow = Yaml.pipe(z.union([
	WorkFlowJobs,
	Actions,
	z.null()
])).catch(withDebugMessage(null, "Does not match schema"));
//#endregion
export { Workflow };

//# sourceMappingURL=schema.js.map