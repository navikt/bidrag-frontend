import CustomError from "./CustomError";

export default class ApiError extends CustomError {
    public override status: number;
    // @ts-ignore
    public data: any;
    public ok = false;

    constructor(message: string, stack: string, correlationId: string, status: number) {
        super("ApiException", correlationId, message, stack);
        this.status = status;
    }
}
