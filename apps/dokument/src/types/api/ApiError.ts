import CustomError from "./CustomError";

export default class ApiError extends CustomError {
    public declare status: number;
    // biome-ignore lint/suspicious/noExplicitAny: Hjelpetype
    public data: any;
    public ok = false;

    constructor(message: string, stack: string, correlationId: string, status: number) {
        super("ApiException", correlationId, message, stack);
        this.status = status;
    }
}
