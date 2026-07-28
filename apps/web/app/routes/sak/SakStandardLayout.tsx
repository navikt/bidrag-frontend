// routes/sak/SakStandardLayout.tsx
import { Loader, Page } from "@navikt/ds-react";
import { Suspense } from "react";
import { Outlet } from "react-router";

export default function SakStandardLayout() {
    return (
        <Page.Block width="xl">
            <Suspense fallback={<Loader size="medium" />}>
                <Outlet />
            </Suspense>
        </Page.Block>
    );
}
