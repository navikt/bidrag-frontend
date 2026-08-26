import { proxy } from "@bidrag/api";
import type { AxiosInstance } from "axios";

interface AxiosClient {
    instance: AxiosInstance;
}

interface UseApiOptions {
    app: string;
    cluster: string;
    env?: string;
    scope?: string;
    showAlertOnNetworkError?: boolean;
}

// @deprecated bruk @bidrag/api/proxy i stedet
export function useApi<T extends AxiosClient>(api: T, options: UseApiOptions): T {
    const { app } = options;
    return proxy(api, { app: app });
}
