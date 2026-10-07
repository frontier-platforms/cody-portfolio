// Copies the Python model module to public/ml so the in-browser trainer (Pyodide)
// runs the exact file the weekly pipeline uses. Runs before dev and build.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/ml", { recursive: true });
copyFileSync("ml/housing_model.py", "public/ml/housing_model.py");
