import { HatchProcessor } from "./hatch.js";
import { PdmProcessor } from "./pdm.js";
import { UvProcessor } from "./uv.js";
//#region lib/modules/manager/pep621/processors/index.ts
const processors = [
	new HatchProcessor(),
	new PdmProcessor(),
	new UvProcessor()
];
//#endregion
export { processors };

//# sourceMappingURL=index.js.map