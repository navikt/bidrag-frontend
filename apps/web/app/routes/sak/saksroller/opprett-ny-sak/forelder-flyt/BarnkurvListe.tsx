import { PersonIdent } from "@bidrag/common";
import { BodyShort, Checkbox, CheckboxGroup } from "@navikt/ds-react";
import type { UseFormReturn } from "react-hook-form";

import DiskresjonAlert from "../../components/DiskresjonAlert";
import PersonInfo from "../../components/PersonInfo";
import ReellMottakerInline from "../components/ReellMottakerInline";
import type { Barnkurv, ForelderMedBarnSkjemaData } from "../opprett-sak-schema";
import { erKurvDeaktivert } from "../utils";

type Props = {
    barnkurver: Barnkurv[];
    aktivKurvId: string | null;
    form: UseFormReturn<ForelderMedBarnSkjemaData>;
    visReellMottaker: boolean;
    bidragsmottakerErUkjent: boolean;
    reellMottakerAlltidPåkrevd: boolean;
    kunSamhandlerSomReellMottaker: boolean;
};

export default function BarnkurvListe({
    barnkurver,
    aktivKurvId,
    form,
    visReellMottaker,
    bidragsmottakerErUkjent,
    reellMottakerAlltidPåkrevd,
    kunSamhandlerSomReellMottaker,
}: Props) {
    const valgteBarn = form.watch("valgteBarn") || [];
    const harValgteBarn = valgteBarn.length > 0;

    const erBarnValgt = (barnIdent: string | string[]) => {
        if (Array.isArray(barnIdent)) {
            return barnIdent.some((id) => valgteBarn.some((b) => b.ident === id));
        }

        return valgteBarn.some((b) => b.ident === barnIdent);
    };

    const håndterBarnKlikk = (valgteIdenter: string[], kurvId: string) => {
        const kurv = barnkurver.find((k) => k.id === kurvId);
        if (!kurv) {
            return;
        }

        // Read current form values synchronously (avoid stale render-time closure).
        const currentValgteBarn = form.getValues("valgteBarn") || [];

        const identerIPar = kurv.barn.map((b) => b.ident);

        // STABLE-INDEX STRATEGY: never reorder existing selections.
        // Rebuilding the array ordered by kurv.barn causes existing children to shift indices,
        // which makes react-hook-form Controllers momentarily subscribe to wrong array paths
        // and pick up neighbouring children's values (e.g. "ingen" from the newly added child).
        //
        // Instead:
        //  1. Keep all children that remain selected, in their current positions.
        //  2. Remove children from this kurv that were deselected.
        //  3. Append brand-new selections at the end.

        // Step 1 + 2: keep existing entries that are still wanted
        const forblirValgt = currentValgteBarn.filter(
            (b) => !identerIPar.includes(b.ident) || valgteIdenter.includes(b.ident),
        );

        // Step 3: add children that are newly selected (not already in the array)
        const nyeBarn = kurv.barn
            .filter((b) => valgteIdenter.includes(b.ident) && !currentValgteBarn.some((cb) => cb.ident === b.ident))
            .map((kurvBarn) => ({
                ...kurvBarn,
                reellMottakerType: "ingen" as const,
                reellMottaker: "",
                reellMottakerNavn: "",
                manuellLagtTil: false,
            }));

        const oppdaterteBarn = [...forblirValgt, ...nyeBarn];
        form.setValue("valgteBarn", oppdaterteBarn);

        if (oppdaterteBarn.length === 0) {
            form.setValue("motpart", {
                ident: "",
                navn: "",
                erKjent: undefined,
                rolle: form.getValues("motpart.rolle"),
                diskresjonskode: undefined,
            });
            return;
        }

        if (currentValgteBarn.length === 0 && oppdaterteBarn.length > 0) {
            const erMotpartUkjent = kurv.id.toLowerCase().includes("ukjent");

            if (!erMotpartUkjent && kurv.motpart) {
                form.setValue("motpart", {
                    ident: kurv.motpart.ident,
                    navn: kurv.motpart.visningsnavn ?? kurv.id,
                    erKjent: true,
                    rolle: form.getValues("motpart.rolle"),
                    diskresjonskode: kurv.motpart.diskresjonskode,
                });
            } else {
                form.setValue("motpart", {
                    ident: "",
                    navn: "",
                    erKjent: false,
                    rolle: form.getValues("motpart.rolle"),
                    diskresjonskode: undefined,
                });
            }
        }
    };

    return (
        <div className="space-y-4">
            {barnkurver.map((kurv, index) => {
                const erDeaktivert = erKurvDeaktivert(kurv.id, aktivKurvId, harValgteBarn);
                const erMotpartUkjent = kurv.id.toLowerCase().includes("ukjent");
                const motpartNavn = kurv.motpart?.visningsnavn ?? "ukjent forelder";
                const motpartIdent = kurv.motpart?.ident;

                return (
                    <div key={index} className="p-4 border border-solid border-ax-neutral-300 rounded-lg">
                        <BodyShort
                            size="small"
                            className="font-semibold text-ax-neutral-800 mb-2 px-2 flex flex-row gap-1"
                        >
                            Med {motpartNavn}{" "}
                            <PersonIdent
                                ident={`${erMotpartUkjent ? index + 1 : motpartIdent ? `(${motpartIdent})` : ""}`}
                            />
                        </BodyShort>
                        <CheckboxGroup
                            legend={`Velg barn med ${motpartNavn}`}
                            hideLegend
                            onChange={(valgteIdenter) => håndterBarnKlikk(valgteIdenter, kurv.id)}
                            size="small"
                        >
                            <div className="grid grid-cols-1 gap-3 rounded-lg p-2">
                                {kurv.barn.map((barn, j) => {
                                    const barnIndex = valgteBarn.findIndex((b) => b.ident === barn.ident);
                                    const erValgt = erBarnValgt(barn.ident);
                                    const kanVelges = !erDeaktivert || erValgt;
                                    const erReellMottakerPåkrevd =
                                        reellMottakerAlltidPåkrevd || barn.erMyndig || bidragsmottakerErUkjent;

                                    return (
                                        <div key={j} className="rounded-lg bg-ax-neutral-100 p-3">
                                            <Checkbox value={barn.ident} disabled={!kanVelges}>
                                                <div className="flex flex-col">
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
                                            </Checkbox>
                                            {erValgt && visReellMottaker && barnIndex !== -1 && (
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
                        </CheckboxGroup>

                        {erDeaktivert && (
                            <p className="text-xs text-ax-neutral-600 italic mt-1 px-2">
                                Deaktivert (barn valgt fra annen kurv)
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
