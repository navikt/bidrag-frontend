export type FormErrors<T> = {
    [key in keyof T]?: string;
};

export type AllBoolean<T> = {
    [key in keyof T]?: boolean;
};

export declare type Path<T> = {
    [K in keyof T]-?: K;
}[keyof T];
