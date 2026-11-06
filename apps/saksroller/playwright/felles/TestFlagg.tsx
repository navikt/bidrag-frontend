import { FlagProvider, UnleashClient } from "@unleash/proxy-client-react";
import { type ReactNode, useMemo } from "react";

export function TestFlagg({ flagg = [], children }: { flagg?: string[]; children: ReactNode }) {
    const nøkkel = flagg.join(",");
    const unleashClient = useMemo(
        () =>
            new UnleashClient({
                url: "http://localhost:3178/unleash/proxy",
                clientKey: "playwright",
                appName: "saksroller-ct",
                disableMetrics: true,
                bootstrap: nøkkel
                    .split(",")
                    .filter(Boolean)
                    .map((name) => ({
                        name,
                        enabled: true,
                        impressionData: false,
                        variant: { name: "disabled", enabled: false },
                    })),
            }),
        [nøkkel],
    );
    return (
        <FlagProvider unleashClient={unleashClient} startClient={false}>
            {children}
        </FlagProvider>
    );
}
