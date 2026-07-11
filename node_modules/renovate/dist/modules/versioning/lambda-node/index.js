import api$1 from "../node/index.js";
import { findLambdaScheduleForVersion } from "./schedule.js";
import { DateTime } from "luxon";
//#region lib/modules/versioning/lambda-node/index.ts
const id = "lambda-node";
function isStable(version) {
	const schedule = findLambdaScheduleForVersion(version);
	if (schedule === null) return false;
	if (typeof schedule.support === "string") return DateTime.local() < DateTime.fromISO(schedule.support);
	return true;
}
const api = {
	...api$1,
	isStable
};
//#endregion
export { api as default, id };

//# sourceMappingURL=index.js.map