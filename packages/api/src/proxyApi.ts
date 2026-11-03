import type { AxiosError, AxiosInstance } from "axios";

const ENHET_HEADER = "X-Enhet";

interface AxiosClient {
    instance: AxiosInstance;
}

interface UseApiOptions {
    app: string;
}

export function proxy<T extends AxiosClient>(api: T, options: UseApiOptions): T {
    api.instance.defaults.baseURL = `/proxy/${options.app}`;
    api.instance.interceptors.request.use((config) => {
        // Leses per kall siden saksbehandler kan bytte enhet uten full reload.
        // Legg til header for at Unleash i backend kan hente ut hvilken enhet SB tilhører. Da kan det toggle også styres basert på enhet
        const enhet =
            typeof window !== "undefined"
                ? (new URLSearchParams(window.location.search).get("enhet") ?? window.sessionStorage.getItem("bisys.enhet"))
                : null;
        if (enhet && !config.headers.has(ENHET_HEADER)) {
            config.headers.set(ENHET_HEADER, enhet);
        }
        return config;
    });
    api.instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const headers = error.response?.headers;
            const warningMessage = headers?.["warning"];
            error.message = warningMessage ? warningMessage : error.message;
            return Promise.reject(error);
        },
    );
    return api;
}
