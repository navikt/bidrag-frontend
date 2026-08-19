export abstract class BaseDtoMapper<T> {
    abstract map(): T;
}

export interface BaseViewObject {
    error?: string;
}
