type DeployEnvironment = "q1" | "q2" | "prod"

type ApiConfig = {
    url: string
    audience: string
}

const APIS: Record<string, ApiConfig> = {
    bidrag_sak: {
        url: "https://bidrag-sak-q2.intern.dev.nav.no",
        audience: "api://dev-fss.bidrag.bidrag-sak-q2/.default"
    }
}

export type ApiAppName = keyof typeof APIS | string

export function getApiConfig(app: ApiAppName ): ApiConfig {
    const api = APIS[app]
    if (!api) {
        throw new Error(`API config not found for app: ${app}`)
    }
    return api
}
