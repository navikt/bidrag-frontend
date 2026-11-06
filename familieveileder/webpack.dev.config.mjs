import HtmlWebpackPlugin from "html-webpack-plugin";
import { merge } from "webpack-merge";

import webpackCommon from "./webpack.common.config.mjs";

const DEV_SERVER_PORT = 5252;

export default merge(webpackCommon, {
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
    ],
});
