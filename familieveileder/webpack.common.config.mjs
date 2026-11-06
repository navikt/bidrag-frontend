import path from "node:path";
import { fileURLToPath } from "node:url";

import { EsbuildPlugin } from "esbuild-loader";
import webpack from "webpack";

import deps from "./package.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { ModuleFederationPlugin } = webpack.container;

// Bisys loads this app as a module federation remote. The remote name and exposed module are a
// contract with Bisys and must not change without a coordinated change there.
const FEDERATION_NAME = "bidrag_sak_ui";

export default {
    entry: "./src/index.tsx",
    output: {
        filename: "[name].[fullhash].js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    experiments: {
        topLevelAwait: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".jsx"],
    },
    optimization: {
        minimizer: [
            new EsbuildPlugin({
                target: "ESNext",
                minify: false,
                format: "esm",
                sourcemap: true,
                minifyIdentifiers: false,
                minifyWhitespace: true,
                minifySyntax: true,
                globalName: FEDERATION_NAME,
                css: true,
                keepNames: true,
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader",
                        options: {
                            insert: path.resolve(__dirname, "src/styleLoader.js"),
                        },
                    },
                    "css-loader",
                    "postcss-loader",
                ],
            },
            {
                test: /\.(png|jpg|gif|svg)$/i,
                type: "asset/inline",
            },
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                loader: "esbuild-loader",
                options: {
                    target: "ESNext",
                },
            },
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
        ],
    },
    plugins: [
        new ModuleFederationPlugin({
            name: FEDERATION_NAME,
            filename: "remoteEntry.js",
            exposes: {
                "./Familieveileder": "./src/pages/familieveileder/FamilieveilederShadow.tsx",
            },
            shared: {
                react: {
                    singleton: true,
                    eager: false,
                    requiredVersion: deps.dependencies.react,
                    strictVersion: false,
                },
                "react-dom": {
                    singleton: true,
                    eager: false,
                    requiredVersion: deps.dependencies["react-dom"],
                    strictVersion: false,
                },
            },
        }),
    ],
};
