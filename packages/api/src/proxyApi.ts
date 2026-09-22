import type { AxiosError, AxiosInstance } from "axios";

interface AxiosClient {
    instance: AxiosInstance;
}

interface UseApiOptions {
    app: string;
}

export function proxy<T extends AxiosClient>(api: T, options: UseApiOptions): T {
    api.instance.defaults.baseURL = `/proxy/${options.app}`;
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
