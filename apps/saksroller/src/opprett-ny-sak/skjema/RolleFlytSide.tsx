import { VStack } from "@navikt/ds-react";
import { type ComponentProps, type ReactNode, useEffect, useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import EksisterendeSakStatus, { type EksisterendeSakStatusProps } from "../eksisterende-sak/EksisterendeSakStatus";
import EnhetOgSubmitSection, { type EnhetOgSubmitSectionProps } from "../innsending/EnhetOgSubmitSection";
import { useNyOpprettSakModal } from "../start/opprettSakModalContext";
import FlytSkjema from "./FlytSkjema";
import { type Sakskategori, useOpprettSakStart } from "./OpprettSakStartContext";
import SakskategoriVelger from "./SakskategoriVelger";

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
    const { kategori } = useOpprettSakStart();

    return (
        <FlytSkjema id={modal?.formId ?? formId} onSubmit={onSubmit} disabled={innsending.isLoading}>
            <VStack gap="space-24" aria-busy={status.isLoading}>
                {kategori ? <SynkKategori kategori={kategori} /> : <KategoriVelger />}
                {children}
                <VStack gap="space-12">
                    {visStatus && <EksisterendeSakStatus {...status} />}
                    {meldinger}
                    <EnhetOgSubmitSection {...innsending} />
                </VStack>
            </VStack>
        </FlytSkjema>
    );
}

/** Kategori velges sammen med sakstypen på siden. Skjemaet holder verdien som sendes inn. */
function SynkKategori({ kategori }: { kategori: Sakskategori }) {
    const { setValue } = useFormContext<{ kategori: Sakskategori }>();
    useEffect(() => setValue("kategori", kategori, { shouldDirty: true }), [kategori, setValue]);
    return null;
}

/** Brukes i modalen, der det ikke finnes en egen seksjon for sakstype. Kompakt, uten egen seksjon. */
function KategoriVelger() {
    const { control } = useFormContext<{ kategori: Sakskategori }>();
    return (
        <Controller
            control={control}
            name="kategori"
            render={({ field }) => <SakskategoriVelger value={field.value} onChange={field.onChange} />}
        />
    );
}
