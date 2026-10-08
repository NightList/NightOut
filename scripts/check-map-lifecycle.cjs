// Run: node --test scripts/check-map-lifecycle.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

test('map resizes, falls back on runtime failures, and cancels work after unmount', async () => {
  const source = readFileSync(
    resolve(__dirname, '../apps/frontend/src/ui/components/mapBaseLayer.tsx'),
    'utf8',
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  for (const failure of ['error', 'webglcontextlost', 'timeout', 'cancelled']) {
    const cleanups = [];
    const handlers = new Map();
    const frames = new Map();
    const timers = new Map();
    const updates = [];
    let resizeCallback;
    let nextId = 0;
    let invalidations = 0;
    let glResizes = 0;
    let removed = 0;
    let disconnected = false;
    let added = false;
    const container = { clientWidth: 425, clientHeight: 876 };
    const gl = {
      on: (event, callback) => handlers.set(event, callback),
      off: (event) => handlers.delete(event),
      resize: () => glResizes++,
    };
    const layer = {
      addTo: () => {
        added = true;
      },
      getMaplibreMap: () => gl,
    };
    const map = {
      getContainer: () => container,
      invalidateSize: () => invalidations++,
      hasLayer: () => added,
      removeLayer: () => removed++,
      on: (event, callback) => handlers.set(`map:${event}`, callback),
      off: (event) => handlers.delete(`map:${event}`),
    };
    const modules = {
      react: {
        useState: () => [false, (value) => updates.push(value)],
        useEffect: (callback) => cleanups.push(callback()),
      },
      'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
      'react-dom': { createPortal: () => null },
      leaflet: { maplibreGL: () => layer },
      'react-leaflet': { useMap: () => map },
      '@/ui/utils/mapStyle': { loadGoogleStyle: async () => ({}) },
      '@/ui/utils/mapTiles': { MAP_LOAD_TIMEOUT_MS: 15000, MAP_USE_RASTER: false },
      'maplibre-gl': { setWorkerUrl: () => {} },
      '@maplibre/maplibre-gl-leaflet': {},
      'maplibre-gl/dist/maplibre-gl.css': {},
      'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url': '/worker.js',
    };
    const exports = {};
    runInNewContext(outputText, {
      exports,
      require: (id) => {
        assert.ok(id in modules, `Unexpected import: ${id}`);
        return modules[id];
      },
      console: { warn: () => {} },
      window: {
        setTimeout: (callback) => {
          timers.set(++nextId, callback);
          return nextId;
        },
        clearTimeout: (id) => timers.delete(id),
      },
      requestAnimationFrame: (callback) => {
        frames.set(++nextId, callback);
        return nextId;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
      ResizeObserver: class {
        constructor(callback) {
          resizeCallback = callback;
        }
        observe() {}
        disconnect() {
          disconnected = true;
        }
      },
    });
    exports.MapBaseLayer({ theme: 'dark' });
    if (failure === 'cancelled') cleanups.forEach((cleanup) => cleanup?.());
    await new Promise(setImmediate);
    if (failure === 'cancelled') {
      assert.equal(added, false);
      assert.deepEqual(updates, []);
      assert.equal(timers.size, 0);
      continue;
    }
    resizeCallback();
    resizeCallback();
    for (const callback of frames.values()) callback();
    frames.clear();
    assert.equal(invalidations, 1, 'Resize notifications must coalesce');
    assert.equal(glResizes, 1);
    if (failure === 'timeout') [...timers.values()][0]();
    else {
      handlers.get('load')();
      assert.equal(timers.size, 0, 'A loaded map must not time out');
      handlers.get(failure)();
    }
    assert.deepEqual(updates, [true], 'Runtime failure must activate raster');
    cleanups.forEach((cleanup) => cleanup?.());
    assert.equal(removed, 1);
    assert.equal(handlers.size, 0);
    assert.equal(frames.size, 0);
    assert.equal(timers.size, 0);
    assert.equal(disconnected, true);
  }
});
