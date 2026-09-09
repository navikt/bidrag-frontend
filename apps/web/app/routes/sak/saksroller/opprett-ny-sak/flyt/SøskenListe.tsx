import { PersonNavn } from "@bidrag/common";
import { CheckmarkHeavyIcon, PersonGroupIcon } from "@navikt/aksel-icons";
import { Alert, BodyShort, Button, Heading } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";
import DiskresjonAlert from "../../components/DiskresjonAlert";
import AlderTag from "../components/AlderTag";
import type { BarnMedAlder, ForelderUtenBarnSkjemaData } from "../opprett-sak-schema";

type Props = {
    form: UseFormReturn<ForelderUtenBarnSkjemaData>;
    søsken: BarnMedAlder[];
};
export default function SøskenListe({ form, søsken }: Props) {
    const motpart = form.watch("motpart");
    const valgteBarn = form.watch("valgteBarn");

    if (søsken.length === 0) {
        return;
    }

    const leggTilSøsken = (barn: BarnMedAlder) => {
        const currentValgteBarn = form.getValues("valgteBarn") || [];
        if (!currentValgteBarn.some((b) => b.ident === barn.ident)) {
            form.setValue("valgteBarn", [...currentValgteBarn, barn]);
        }
    };
    return (
        <Alert variant="info">
            <div className="space-y-3">
                <div>
                    <Heading level="3" size="small" spacing className="flex gap-2">
                        <PersonGroupIcon aria-hidden fontSize="1.5rem" />
                        Søsken funnet ({søsken.length})
                    </Heading>
                    <BodyShort size="small">
                        Vi fant barn som har samme forelder (
                        <PersonNavn bareFornavn={false} navn={motpart.navn || "ukjent"} />
                        ). Disse kan legges til i samme sak.
                    </BodyShort>
                </div>
                <div className="space-y-2">
                    {søsken.map((barn, i) => {
                        const erAlleredeValgt = valgteBarn.some((b) => b.ident === barn.ident);
                        return (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-[white] rounded border border-ax-neutral-300"
                            >
                                <div className="flex flex-col">
                                    <BodyShort size="small" className="flex gap-2">
                                        {barn.navn} ({barn.ident})
                                        <AlderTag {...barn} deaktivert={false} />
                                    </BodyShort>
                                    {barn?.diskresjonskode && (
                                        <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />
                                    )}
                                </div>
                                {erAlleredeValgt ? (
                                    <BodyShort
                                        size="small"
                                        className="text-ax-success-700 font-semibold flex items-center"
                                    >
                                        <CheckmarkHeavyIcon aria-hidden fontSize="1.5rem" /> Valgt
                                    </BodyShort>
                                ) : (
                                    <Button type="button" size="xsmall" onClick={() => leggTilSøsken(barn)}>
                                        Legg til
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Alert>
    );
}
