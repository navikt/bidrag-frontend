import { VStack } from "@navikt/ds-react";
import type { ComponentProps, ReactNode } from "react";
import EksisterendeSakStatus, { type EksisterendeSakStatusProps } from "../sections/EksisterendeSakStatus";
import EnhetOgSubmitSection, { type EnhetOgSubmitSectionProps } from "../sections/EnhetOgSubmitSection";
import Oppsummering from "../sections/Oppsummering";
import FlytSkjema from "./FlytSkjema";

type Props = {
    onSubmit: ComponentProps<typeof FlytSkjema>["onSubmit"];
    status: EksisterendeSakStatusProps;
    innledning?: ReactNode;
    children: ReactNode;
    meldinger?: ReactNode;
    innsending: EnhetOgSubmitSectionProps;
};

export default function RolleFlytSide({ onSubmit, status, innledning, children, meldinger, innsending }: Props) {
    const visStatus = status.infoMelding || status.isLoading || (status.harEksisterendeSak && status.eksisterendeSak);

    return (
        <FlytSkjema onSubmit={onSubmit}>
            <VStack gap="space-24" aria-busy={status.isLoading}>
                {innledning && <VStack gap="space-12">{innledning}</VStack>}
                {children}
                {innsending.oppsummering && <Oppsummering {...innsending.oppsummering} />}
                {/* Info, advarsler og feil samles rett over knappene. */}
                <VStack gap="space-12">
                    {visStatus && <EksisterendeSakStatus {...status} />}
                    {meldinger}
                    <EnhetOgSubmitSection {...innsending} />
                </VStack>
            </VStack>
        </FlytSkjema>
    );
}
