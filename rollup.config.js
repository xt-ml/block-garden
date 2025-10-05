import terser from "@rollup/plugin-terser";

export default {
  input: "index.mjs",
  output: {
    file: "dist/sprite-garden-bundle-min.mjs",
    format: "esm",
    sourcemap: false,
  },
  plugins: [terser()],
};
