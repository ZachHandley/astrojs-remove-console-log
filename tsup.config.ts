import { defineConfig } from "tsup";
import { peerDependencies } from "./package.json";

const finalDependencies = {
  ...peerDependencies,
  "@vue/compiler-sfc": "^3.0.0",
};

export default defineConfig((options) => {
  const dev = !!options.watch;
  return {
    entry: ["src/**/*.(ts|js)"],
    format: ["esm"],
    target: "node16",
    bundle: true,
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: !dev,
    external: [...Object.keys(finalDependencies)],
    tsconfig: "tsconfig.json",
  };
});
