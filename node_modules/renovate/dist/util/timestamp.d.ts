import { z } from "zod/v4";

//#region lib/util/timestamp.d.ts
type Timestamp = string & {
  __timestamp: never;
};
declare function asTimestamp(input: unknown): Timestamp | null;
declare const Timestamp: z.ZodPipe<z.ZodUnknown, z.ZodTransform<Timestamp, unknown>>;
declare const MaybeTimestamp: z.ZodCatch<z.ZodNullable<z.ZodPipe<z.ZodUnknown, z.ZodTransform<Timestamp, unknown>>>>;
//#endregion
export { MaybeTimestamp, Timestamp, asTimestamp };
//# sourceMappingURL=timestamp.d.ts.map