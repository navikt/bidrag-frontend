import CustomError from "./CustomError";

export default class ReactError extends CustomError {

    public componentStack?: string;

    constructor(message: string, componentStack: string, correlationId: string) {
        super("ReactException", correlationId, message, "");
        this.componentStack = componentStack;
    }
}
