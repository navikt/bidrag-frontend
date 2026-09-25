import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

const configFile = resolve(import.meta.dirname, "../../e2e.config");
const localEnvFile = resolve(import.meta.dirname, "../../.env");

if (existsSync(configFile)) {
    loadEnvFile(configFile);
}
if (existsSync(localEnvFile)) {
    loadEnvFile(localEnvFile);
}

const environments = {
    local: "http://localhost:4000",
    q2: "https://bidrag-q2.intern.dev.nav.no",
} as const;

type TestEnvironment = keyof typeof environments;

function readEnvironment(): TestEnvironment {
    const value = process.env.TEST_ENV ?? "local";
    if (value === "local" || value === "q2") {
        return value;
    }
    throw new Error("TEST_ENV må være local eller q2.");
}

export function requireEnvironmentVariable(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Mangler påkrevd miljøvariabel: ${name}. Se e2e/README.md.`);
    }
    return value;
}

const name = readEnvironment();

export const environment = {
    name,
    baseUrl: environments[name],
    username: requireEnvironmentVariable("E2E_USERNAME"),
    password: requireEnvironmentVariable("E2E_PASSWORD"),
} as const;
