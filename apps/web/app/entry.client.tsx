import { persistBisysParams } from "@bidrag/common";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// clientMiddleware kjører ikke på den første SSR-hydreringen — håndter her
persistBisysParams(new URL(window.location.href));

startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <HydratedRouter />
        </StrictMode>,
    );
});
