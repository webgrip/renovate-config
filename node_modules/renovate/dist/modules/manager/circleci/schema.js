import { LooseArray, LooseRecord, NotCircular } from "../../../util/schema-utils/index.js";
import { z } from "zod/v4";
//#region lib/modules/manager/circleci/schema.ts
const CircleCiDocker = z.object({ image: z.string() }).transform(({ image }) => image);
const CircleCiJobList = LooseRecord(z.object({ docker: LooseArray(CircleCiDocker).catch([]) }).transform(({ docker }) => docker)).transform((x) => Object.values(x).flat()).catch([]);
const BaseOrb = z.object({
	executors: CircleCiJobList,
	jobs: CircleCiJobList
});
const CircleCiOrb = BaseOrb.extend({ orbs: LooseRecord(z.union([z.string(), z.lazy(() => CircleCiOrb)])).catch({}) });
const CircleCiFile = NotCircular.pipe(BaseOrb.extend({
	aliases: LooseArray(CircleCiDocker).catch([]),
	orbs: LooseRecord(z.union([z.string(), CircleCiOrb])).catch({})
}));
//#endregion
export { CircleCiFile };

//# sourceMappingURL=schema.js.map