import { merge } from "webpack-merge";

import webpackCommon from "./webpack.common.config.mjs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
import fs from "fs";

const { EnvironmentPlugin, DefinePlugin } = webpack;
const DEV_SERVER_PORT = 5252;

export default (env) => { return merge(webpackCommon, config(env)) };


const config = (env)=> {
    const customenvfile = `env/${env.envfile}`;
    const envfile = fs.existsSync(customenvfile) ? customenvfile : "env/.env.local";
    return {
        mode: "development",
        devtool: "eval-source-map",
        devServer: {
            historyApiFallback: true,
            devMiddleware: {
                writeToDisk: true,
            },
            port: DEV_SERVER_PORT,
            hot: true,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                publicPath: "/",
                template: "./src/index.html",
            }),
            new HtmlWebpackPlugin({
                publicPath: "/",
                template: "./src/index.html",
            }),
            new DefinePlugin({
                "process.env.NODE_ENV": JSON.stringify("development"),
            }),
            new EnvironmentPlugin({
                ENABLE_MOCK: "",
            }),
        ],
    }
    }
