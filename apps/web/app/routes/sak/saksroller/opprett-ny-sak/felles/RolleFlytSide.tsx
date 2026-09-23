import { VStack } from "@navikt/ds-react";
import type { ComponentProps, ReactNode } from "react";
import EksisterendeSakStatus, { type EksisterendeSakStatusProps } from "../sections/EksisterendeSakStatus";
import FlytSkjema from "./FlytSkjema";

type Props = {
    onSubmit: ComponentProps<typeof FlytSkjema>["onSubmit"];
    status: EksisterendeSakStatusProps;
    innledning?: ReactNode;
    children: ReactNode;
    meldinger?: ReactNode;
    submit: ReactNode;
};

export default function RolleFlytSide({ onSubmit, status, innledning, children, meldinger, submit }: Props) {
    const visStatus = status.infoMelding || status.isLoading || (status.harEksisterendeSak && status.eksisterendeSak);

    return (
        <FlytSkjema onSubmit={onSubmit}>
            <VStack gap="space-24" aria-busy={status.isLoading}>
                {innledning && <VStack gap="space-12">{innledning}</VStack>}
                {children}
                <VStack gap="space-12">
                    {visStatus && <EksisterendeSakStatus {...status} />}
                    {meldinger}
                    {submit}
                </VStack>
            </VStack>
        </FlytSkjema>
    );
}
