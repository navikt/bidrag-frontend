import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonIdent } from "@bidrag/common";
import { beregnAlder, beregnAlderFraFnr } from "@bidrag/utils/personUtils";
import { BodyShort, Heading, Radio, RadioGroup, Tag } from "@navikt/ds-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import DiskresjonAlert from "../../components/DiskresjonAlert";
import AlderTag from "../components/AlderTag";
import type { BarnBeggForeldreSkjemaData } from "../opprett-sak-schema";

type Props = {
    form: UseFormReturn<BarnBeggForeldreSkjemaData>;
    foreldre: PersonDto[];
};

export default function RolleVelger({ form, foreldre }: Props) {
    const valgteRoller = form.watch("foreldre");

    const håndterValg = (bidragspliktigIdent: string) => {
        valgteRoller.forEach((_person, index) => {
            form.clearErrors(`foreldre.${index}`);
        });

        const bidragspliktigIndex = foreldre.findIndex((f) => f.ident === bidragspliktigIdent);
        const bidragsmottakerIndex = bidragspliktigIndex === 0 ? 1 : 0;

        form.setValue(`foreldre.${bidragspliktigIndex}.rolle`, "bidragspliktig");
        form.setValue(`foreldre.${bidragsmottakerIndex}.rolle`, "bidragsmottaker");
    };

    const bidragspliktigIdent = valgteRoller.find((f) => f.rolle === "bidragspliktig")?.ident || "";

    return (
        <div className="space-y-4">
            <div>
                <Heading level="2" size="medium" spacing>
                    Velg bidragspliktig
                </Heading>
                <BodyShort size="small" className="text-ax-neutral-700">
                    Den andre forelderen blir automatisk bidragsmottaker.
                </BodyShort>
            </div>

            <Controller
                name="foreldre"
                control={form.control}
                render={({ formState }) => (
                    <RadioGroup
                        legend="Velg bidragspliktig"
                        hideLegend
                        size="small"
                        value={bidragspliktigIdent}
                        onChange={(value) => håndterValg(value)}
                        error={formState?.errors?.foreldre?.[0]?.rolle?.message}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {foreldre.map((forelder, index) => {
                                const person = valgteRoller[index];
                                const erBidragspliktig = person?.erKjent && person.rolle === "bidragspliktig";
                                const erBidragsmottaker = person?.erKjent && person.rolle === "bidragsmottaker";
                                const alder = forelder?.fødselsdato
                                    ? beregnAlder(forelder.fødselsdato)
                                    : beregnAlderFraFnr(forelder.ident);

                                return (
                                    <div
                                        key={index}
                                        className={`flex justify-between p-4 rounded-lg transition-all ${
                                            erBidragspliktig
                                                ? "bg-ax-warning-100"
                                                : erBidragsmottaker
                                                  ? "bg-ax-success-100"
                                                  : "border border-solid border-ax-neutral-400 bg-[white]"
                                        }`}
                                    >
                                        <Radio value={forelder.ident}>
                                            <div>
                                                {forelder.visningsnavn}{" "}
                                                <AlderTag
                                                    erMyndig={false}
                                                    alder={alder ?? 0}
                                                    deaktivert={!person?.erKjent}
                                                />
                                                <BodyShort className="text-ax-neutral-800" size="small">
                                                    <PersonIdent ident={`${forelder.ident}`} />
                                                </BodyShort>
                                            </div>
                                            {forelder?.diskresjonskode && (
                                                <DiskresjonAlert diskresjonskode={forelder.diskresjonskode} />
                                            )}
                                        </Radio>

                                        {erBidragspliktig && (
                                            <div>
                                                <Tag size="small" variant="warning">
                                                    Bidragspliktig
                                                </Tag>
                                            </div>
                                        )}

                                        {erBidragsmottaker && (
                                            <div>
                                                <Tag size="small" variant="success">
                                                    Bidragsmottaker
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </RadioGroup>
                )}
            />
        </div>
    );
}
