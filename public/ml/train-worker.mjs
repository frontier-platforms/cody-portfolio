/*
  Web Worker: trains the home value model in Python, in the browser. It must
  be a module worker: Pyodide 314 refuses to run in classic workers.

  Loads Pyodide (CPython compiled to WebAssembly) with numpy, pandas and
  XGBoost, then runs ml/housing_model.py, the same module the weekly
  Airflow run uses. Progress is posted back after each batch of trees, so the
  page can draw the learning curve while Python trains.

  Messages in:  { type: "train", columns: { name: values[] }, params }
  Messages out: { type: "status", text } | { type: "progress", tree, train, valid }
                | { type: "done", model } | { type: "error", message }
*/
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
let ready = null;

function boot() {
  ready ??= (async () => {
    postMessage({ type: "status", text: "Downloading Python (Pyodide)…" });
    const { loadPyodide } = await import(`${PYODIDE}pyodide.mjs`);
    const py = await loadPyodide({ indexURL: PYODIDE });
    postMessage({ type: "status", text: "Installing numpy, pandas and XGBoost…" });
    await py.loadPackage(["numpy", "pandas", "xgboost"]);
    const source = await (await fetch("/ml/housing_model.py")).text();
    py.FS.mkdirTree("/home/pyodide/ml");
    py.FS.writeFile("/home/pyodide/ml/__init__.py", "");
    py.FS.writeFile("/home/pyodide/ml/housing_model.py", source);
    py.runPython("import sys; sys.path.insert(0, '/home/pyodide')");
    return py;
  })();
  return ready;
}

onmessage = async (event) => {
  const { type, columns, params } = event.data;
  if (type !== "train") return;
  try {
    const py = await boot();
    postMessage({ type: "status", text: "Training in Python…" });
    const hm = py.pyimport("ml.housing_model");
    const json = py.pyimport("json");
    const progress = (tree, train, valid) => postMessage({ type: "progress", tree, train, valid });
    const result = hm.train_from_columns(py.toPy(columns), py.toPy(params), progress);
    postMessage({ type: "done", model: JSON.parse(json.dumps(result)) });
    result.destroy();
  } catch (error) {
    postMessage({ type: "error", message: String(error && error.message ? error.message : error) });
  }
};
