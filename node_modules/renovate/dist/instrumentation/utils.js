import { getEnv } from "../util/env.js";
import { isNullOrUndefined } from "@sindresorhus/is";
//#region lib/instrumentation/utils.ts
function isTracingEnabled() {
	return isTraceDebuggingEnabled() || isTraceSendingEnabled();
}
function isTraceDebuggingEnabled() {
	return !!getEnv().RENOVATE_TRACING_CONSOLE_EXPORTER;
}
function isTraceSendingEnabled() {
	return !!getEnv().OTEL_EXPORTER_OTLP_ENDPOINT;
}
function massageThrowable(e) {
	if (isNullOrUndefined(e)) return;
	if (e instanceof Error) return e.message;
	return String(e);
}
//#endregion
export { isTraceDebuggingEnabled, isTraceSendingEnabled, isTracingEnabled, massageThrowable };

//# sourceMappingURL=utils.js.map