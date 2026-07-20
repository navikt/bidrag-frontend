export type NaisConfig = {
    telemetryCollectorURL: string;
    app: {
        name: string;
        namespace: string;
        version: string;
    };
};

declare const nais: NaisConfig;
export default nais;
