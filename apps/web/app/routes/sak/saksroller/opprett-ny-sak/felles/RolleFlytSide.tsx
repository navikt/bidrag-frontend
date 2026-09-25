import { VStack } from "@navikt/ds-react";
import type { ComponentProps, ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import SakskategoriVelger from "../SakskategoriVelger";
import type { Sakskategori } from "../saksrolleroversiktContext";
import EksisterendeSakStatus, { type EksisterendeSakStatusProps } from "../sections/EksisterendeSakStatus";
import EnhetOgSubmitSection, { type EnhetOgSubmitSectionProps } from "../sections/EnhetOgSubmitSection";
import Oppsummering from "../sections/Oppsummering";
import FlytSkjema from "./FlytSkjema";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "./SkjemaSeksjon";

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
                <KategoriSeksjon />
                {innledning && <VStack gap="space-12">{innledning}</VStack>}
                {children}
                {innsending.oppsummering && <Oppsummering {...innsending.oppsummering} />}
                <VStack gap="space-12">
                    {visStatus && <EksisterendeSakStatus {...status} />}
                    {meldinger}
                    <EnhetOgSubmitSection {...innsending} />
                </VStack>
            </VStack>
        </FlytSkjema>
    );
}

function KategoriSeksjon() {
    const { control } = useFormContext<{ kategori: Sakskategori }>();
    return (
        <SkjemaSeksjon tittel="Kategori">
            <SkjemaSeksjonKort>
                <Controller
                    control={control}
                    name="kategori"
                    render={({ field }) => <SakskategoriVelger value={field.value} onChange={field.onChange} />}
                />
            </SkjemaSeksjonKort>
        </SkjemaSeksjon>
    );
}
