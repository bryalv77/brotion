import type { ComputedCell } from "./api-types.js";

/** Aggregate the related rows' target-property values for a rollup cell. */
export function aggregateRollup(aggregation: string, values: unknown[]): ComputedCell {
  const nums = values
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => a - b);
  switch (aggregation) {
    case "count":
      return { status: "ok", value: values.length };
    case "sum":
      return { status: "ok", value: nums.reduce((a, b) => a + b, 0) };
    case "avg":
      return nums.length === 0
        ? { status: "ok", value: null }
        : { status: "ok", value: nums.reduce((a, b) => a + b, 0) / nums.length };
    case "min":
      return nums.length === 0 ? { status: "ok", value: null } : { status: "ok", value: nums[0] };
    case "max":
      return nums.length === 0 ? { status: "ok", value: null } : { status: "ok", value: nums[nums.length - 1] };
    case "show_original":
      return { status: "ok", value: values };
    default:
      return {
        status: "error",
        error: { code: "type", message: `Unknown rollup aggregation: ${aggregation}` },
      };
  }
}
