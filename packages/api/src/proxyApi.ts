import type { AxiosInstance } from "axios";

interface AxiosClient {
    instance: AxiosInstance;
}

interface UseApiOptions {
    app: string;
}

export function proxy<T extends AxiosClient>(api: T, options: UseApiOptions): T {
    api.instance.defaults.baseURL = `/proxy/${options.app}`;
    return api;
}
