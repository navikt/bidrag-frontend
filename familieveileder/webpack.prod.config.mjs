import { merge } from "webpack-merge";

import webpackCommon from "./webpack.common.config.mjs";

export default merge(webpackCommon, {
    mode: "production",
    devtool: "source-map",
});
