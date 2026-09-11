// biome-ignore lint/suspicious/noExplicitAny: Hjelpetype
export interface ApiResponse<T = any> {
    ok: boolean;
    status: number;
    headers?: Headers;
    data: T;
}
