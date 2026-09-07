import { XMarkIcon } from "@navikt/aksel-icons";
import { BodyShort, Button, Heading, type HeadingProps } from "@navikt/ds-react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import ReellMottakerInline from "../components/ReellMottakerInline";
import type { BarnMedAlder } from "../opprett-sak-schema";

type Props<TFieldValues extends FieldValues & { valgteBarn: BarnMedAlder[] }> = {
    form: UseFormReturn<TFieldValues>;
    tittel: string;
    valgteBarn: BarnMedAlder[];
    alleBarn: BarnMedAlder[];
    fjernBarn: (ident: string) => void;
    heading: Omit<HeadingProps, "children">;
    visReellMottaker: boolean;
    bidragsmottakerErUkjent: boolean;
    reellMottakerAlltidPåkrevd: boolean;
    kunSamhandlerSomReellMottaker: boolean;
};

export default function ValgteBarnListe<TFieldValues extends FieldValues & { valgteBarn: BarnMedAlder[] }>({
    form,
    tittel,
    heading,
    valgteBarn,
    alleBarn,
    fjernBarn,
    visReellMottaker,
    bidragsmottakerErUkjent,
    reellMottakerAlltidPåkrevd,
    kunSamhandlerSomReellMottaker,
}: Props<TFieldValues>) {
    if (valgteBarn.length === 0) {
        return;
    }

    return (
        <div className="pt-6">
            <div className="flex items-center justify-between mb-3">
                <Heading {...heading}>{tittel}</Heading>
                <BodyShort
                    size="small"
                    className="bg-ax-accent-200 text-ax-accent-800 px-3 py-1 rounded-full font-semibold"
                >
                    {valgteBarn.length} valgt
                </BodyShort>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {valgteBarn.map((barn) => {
                    const barnIndex = alleBarn.findIndex((b) => b.ident === barn.ident);
                    const erReellMottakerPåkrevd =
                        reellMottakerAlltidPåkrevd || barn.erMyndig || bidragsmottakerErUkjent;

                    return (
                        <div key={barn.ident} className="p-4 bg-ax-neutral-100 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <PersonInfo
                                        ident={barn.ident}
                                        fødselsdato={barn.fødselsdato}
                                        alder={barn.alder}
                                        navn={barn.navn}
                                    />
                                    {barn?.diskresjonskode && (
                                        <DiskresjonAlert diskresjonskode={barn.diskresjonskode} />
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="tertiary-neutral"
                                    size="small"
                                    onClick={() => fjernBarn(barn.ident)}
                                    icon={<XMarkIcon aria-hidden />}
                                >
                                    Fjern
                                </Button>
                            </div>
                            {visReellMottaker && barnIndex !== -1 && (
                                <div className="mt-1 pt-1">
                                    <ReellMottakerInline
                                        form={form}
                                        fieldPath={`valgteBarn.${barnIndex}`}
                                        barnIdent={barn.ident}
                                        barnNavn={barn.navn}
                                        isRequired={erReellMottakerPåkrevd}
                                        kunSamhandlerSomReellMottaker={kunSamhandlerSomReellMottaker}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
