// Architecture fitness function (Demo D1).
// Turns the boundary rule in CLAUDE.md into an executable check the agent and CI
// run on every change: the web app must talk to the backend over HTTP only and
// must never import from apps/api, nor deep-import core internals.
module.exports = {
  forbidden: [
    {
      name: "web-not-to-api",
      comment:
        "apps/web must use the HTTP API, never import from apps/api. Move shared code to @helpdesk/core.",
      severity: "error",
      from: { path: "^apps/web" },
      to: { path: "^apps/api" },
    },
    {
      name: "no-core-internals",
      comment: "Import @helpdesk/core via its public entry, not deep internal files.",
      severity: "error",
      from: { path: "^apps/web" },
      to: { path: "^packages/core/src/(?!index\\.ts$)" },
    },
    {
      name: "no-circular",
      comment: "Circular dependencies make code hard to reason about and test.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: { extensions: [".ts", ".tsx", ".js", ".jsx", ".json"] },
  },
};
