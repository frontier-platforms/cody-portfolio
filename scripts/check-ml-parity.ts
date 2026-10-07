/**
 * Cross-language check: the site's TypeScript inference must predict exactly
 * what the Python model predicts. ml/tests writes the fixture (rows, the
 * exported model and Python's predictions); this replays it in TypeScript.
 *
 *   uv run pytest ml && npm run test:parity
 */
import { readFileSync } from "node:fs";
import { predict } from "../lib/ml/gbm";
import { toFeatureRow, type HomeInput, type HousingModel } from "../lib/ml/housing";

const fixture = JSON.parse(readFileSync("ml/tests/fixtures/parity.json", "utf8")) as {
  model: Pick<HousingModel, "encoders" | "gbm">;
  rows: HomeInput[];
  expected: number[];
};

let worst = 0;
fixture.rows.forEach((row, i) => {
  const ours = predict(fixture.model.gbm, toFeatureRow(fixture.model.encoders, row));
  worst = Math.max(worst, Math.abs(ours - fixture.expected[i]));
});

console.log(`ML parity: ${fixture.rows.length} rows, max difference ${worst.toExponential(2)}`);
if (worst > 1e-9) {
  console.error("TypeScript and Python predictions differ.");
  process.exit(1);
}
