import {AxiosInstance} from "axios";

interface AxiosClient {
    instance: AxiosInstance;
}

interface UseApiOptions {
    app: string;
    cluster?: string;
    env?: string;
    scope?: string;
    showAlertOnNetworkError?: boolean;
}

export function proxy<T extends AxiosClient>(api: T, options: UseApiOptions): T {
    api.instance.defaults.baseURL = `/proxy/${options.app}`
    console.debug("proxy", options, api.instance.defaults.baseURL);
    return api

}
