import { Page, VStack } from "@navikt/ds-react";
import { Outlet } from "react-router";

export function AdminLayout() {
    return (
        <VStack gap={"space-32"}>
            <Page.Block width="xl">
                <Outlet />
            </Page.Block>
        </VStack>
    );
}
