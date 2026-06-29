import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { initFaro } from "./faro.client";
import { persistBisysParams } from "~/common/bisys/bisys-params.ts";

// clientMiddleware kjører ikke på den første SSR-hydreringen — håndter her
persistBisysParams(new URL(window.location.href));

initFaro();

startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <HydratedRouter />
        </StrictMode>,
    );
});
