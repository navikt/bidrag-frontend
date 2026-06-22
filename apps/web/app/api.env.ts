import * as process from "node:process";

type ApiConfig = {
    url: string
    audience: string

}

const APIS: Record<string, ApiConfig> = {
    "bidrag-sak": {
        url: process.env.BIDRAG_SAK_URL || "",
        audience: process.env.BIDRAG_SAK_AUDIENCE || ""
    }
}

export type ApiAppName = keyof typeof APIS | string

export function getApiConfig(app: ApiAppName ): ApiConfig {
    const api = APIS[app]
    process.env.NODE_ENV = process.env.NODE_ENV || "development"
    if (!api) {
        throw new Error(`API config not found for app: ${app}`)
    }
    return api
}
