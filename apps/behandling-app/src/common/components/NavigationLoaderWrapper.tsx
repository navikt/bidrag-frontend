import type { PropsWithChildren } from "react";
import { useBehandlingProvider } from "../context/BehandlingContext";
import { NavigationLoader } from "./OverlayLoader";

export const NavigationLoaderWrapper = ({ children }: PropsWithChildren) => {
    const { pendingTransitionState } = useBehandlingProvider();
    return (
        <div className={`${pendingTransitionState ? "relative overflow-hidden block whitespace-nowrap" : "inherit"}`}>
            <NavigationLoader loading={pendingTransitionState} />
            {children}
        </div>
    );
};
