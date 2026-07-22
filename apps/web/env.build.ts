import * as process from "node:process";
import { z } from "zod";

type BuildEnvContext = {
    command: "build" | "serve";
    mode: string;
};

const ProdBuildSchema = z.object({
    CDN_BASE_URL: z.url(),
});

const DevTestSchema = z.object({
    CDN_BASE_URL: z.url().optional(),
});

export function readBuildEnv({ command, mode }: BuildEnvContext) {
    const isReactRouterBuildRequest = process.env.IS_RR_BUILD_REQUEST === "yes";
    const isTypegenInvocation = process.argv.some((arg) => arg.includes("typegen"));
    const isCiBuild = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
    if (
        command === "build" &&
        mode === "production" &&
        isCiBuild &&
        !isReactRouterBuildRequest &&
        !isTypegenInvocation
    ) {
        return ProdBuildSchema.parse(process.env);
    }

    return DevTestSchema.parse(process.env);
}
