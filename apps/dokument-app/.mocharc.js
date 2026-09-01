module.exports = {
    require: [
        "src/tests/resources/env.init.js",
        "@swc/register",
        "esm",
        "global-jsdom/register",
        "ts-node/register/transpile-only",
        "ignore-styles",
        "src/tests/resources/mocha.init.tsx",
    ],
    extension: ["js", "ts", "tsx"],
    package: "./package.json",
    include: ["src/tests/*"],
    ignore: ["/node_modules/"],
};
