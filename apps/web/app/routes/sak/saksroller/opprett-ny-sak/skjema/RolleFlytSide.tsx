import { useNyOpprettSakModal } from "@bidrag/common";
import { VStack } from "@navikt/ds-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import EksisterendeSakStatus, { type EksisterendeSakStatusProps } from "../eksisterende-sak/EksisterendeSakStatus";
import EnhetOgSubmitSection, { type EnhetOgSubmitSectionProps } from "../innsending/EnhetOgSubmitSection";
import Oppsummering from "../innsending/Oppsummering";
import FlytSkjema from "./FlytSkjema";
import SakskategoriVelger from "./SakskategoriVelger";
import SkjemaSeksjon, { SkjemaSeksjonKort } from "./SkjemaSeksjon";
import type { Sakskategori } from "./saksrolleroversiktContext";

type Props = {
    onSubmit: ComponentProps<typeof FlytSkjema>["onSubmit"];
    status: EksisterendeSakStatusProps;
    children: ReactNode;
    meldinger?: ReactNode;
    innsending: EnhetOgSubmitSectionProps;
};

export default function RolleFlytSide({ onSubmit, status, children, meldinger, innsending }: Props) {
    const visStatus = status.infoMelding || status.isLoading || (status.harEksisterendeSak && status.eksisterendeSak);
    const formId = useId();
    const modal = useNyOpprettSakModal();

    return (
        <FlytSkjema id={modal?.formId ?? formId} onSubmit={onSubmit} disabled={innsending.isLoading}>
            <VStack gap="space-24" aria-busy={status.isLoading}>
                <KategoriSeksjon />
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
