import type { MottakerAdresseTo } from "@bidrag/api/BidragForsendelseApi";
import { IdentUtils, ObjectUtils } from "@bidrag/common";
import { PencilIcon as Edit, MagnifyingGlassIcon, PersonIcon, PersonPencilIcon } from "@navikt/aksel-icons";
import { Alert, Button, Heading, Loader, Panel, Tabs, TextField } from "@navikt/ds-react";
import React, { useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import AdresseInfo from "../../components/AdresseInfo";
import { EditAddress, validerMaks128Tegn } from "../../components/EditAddress";
import InfoKnapp from "../../components/InfoKnapp";
import PersonDetaljer from "../../components/person/PersonDetaljer";
import MottakerInfo from "../../docs/Mottaker.mdx";
import { useHentRoller } from "../../hooks/useForsendelseApi";
import { useHentSamhandlerEllerPersonForIdent } from "../../hooks/usePersonApi";
import { hasOnlyNullValues } from "../../utils/ObjectUtils";
import {
    type MottakerFormProps,
    type OpprettForsendelseFormProps,
    useOpprettForsendelseFormContext,
} from "./OpprettForsendelsePage";
import PersonSok from "./PersonSok";

type RADIO_OPTIONS = "SAMME_SOM_GJELDER" | "ANNEN_MOTTAKER" | "FRITEKST";
export default function MottakerSelect() {
    const roller = useHentRoller();
    const {
        register,
        setValue,
        watch,
        getValues,
        formState: { errors },
    } = useOpprettForsendelseFormContext();
    const gjelderIdent: string = useWatch<OpprettForsendelseFormProps>({ name: "gjelderIdent" }) as string;
    const gjelder = roller.find((rolle) => rolle.ident === gjelderIdent);
    const [selectedRadioOption, setSelectedRadioOption] = useState<RADIO_OPTIONS>("SAMME_SOM_GJELDER");
    const selectedTabOption = useRef<RADIO_OPTIONS>(selectedRadioOption);

    const mottakerCache = useRef<Map<string, MottakerFormProps>>(new Map());
    useEffect(() => {
        register("mottaker", {
            validate: () => {
                if (selectedTabOption.current === "FRITEKST") {
                    return getValues("mottaker.navn") === undefined ? "Mottaker må settes" : true;
                }
                return getValues("mottaker.ident") === undefined ? "Mottaker må settes" : true;
            },
        });
    }, []);

    useEffect(() => {
        if (selectedTabOption.current === "SAMME_SOM_GJELDER") {
            setValue("mottaker.ident", gjelderIdent);
        }
    }, [gjelderIdent]);

    function onTabChange(val: RADIO_OPTIONS) {
        setSelectedRadioOption(val);
        mottakerCache.current.set(selectedTabOption.current, getValues("mottaker"));
        selectedTabOption.current = val;
        setValue("mottaker", null);
        if (val === "SAMME_SOM_GJELDER") {
            setValue("mottaker.ident", gjelderIdent);
        } else {
            const mottakerCacheValue = mottakerCache.current.get(val) ?? null;
            if (val === "FRITEKST" && !mottakerCacheValue) {
                setValue("mottaker.adresse.land", "NO");
            } else {
                setValue("mottaker", mottakerCacheValue);
            }
        }
    }

    const errorMessage = errors.mottaker?.message;
    const borderColor = errorMessage ? "border-2 border-solid border-ax-border-danger" : "";

    return (
        <div className="pt-2">
            <div className="flex flex-row gap-[2px]">
                <Heading size="small">Mottaker</Heading>
                <InfoKnapp>
                    <MottakerInfo />
                </InfoKnapp>
            </div>
            <Tabs defaultValue={"SAMME_SOM_GJELDER"} onChange={onTabChange} size="small" className="w-max h-max">
                <Tabs.List>
                    <Tabs.Tab
                        value="SAMME_SOM_GJELDER"
                        label="Samme som gjelder"
                        icon={<PersonIcon title="Samme som gjelder" />}
                    />
                    <Tabs.Tab
                        value="ANNEN_MOTTAKER"
                        label="Søk annen mottaker"
                        icon={<MagnifyingGlassIcon title="Søk annen mottaker" />}
                    />
                    <Tabs.Tab value="FRITEKST" label="Fritekst" icon={<PersonPencilIcon title="Fritekst" />} />
                </Tabs.List>

                <Tabs.Panel value="SAMME_SOM_GJELDER" className={`h-max w-full bg-ax-neutral-100 p-4 ${borderColor}`}>
                    <PersonDetaljer copy={false} spacing={false} ident={gjelderIdent} navn={gjelder?.navn} />
                </Tabs.Panel>
                <Tabs.Panel
                    value="ANNEN_MOTTAKER"
                    className={`h-max min-h-[100px] w-full bg-ax-neutral-100 p-4 ${borderColor}`}
                >
                    <div className="flex flex-col gap-4 w-max gap-[5px]">
                        <PersonSok
                            defaultValue={watch("mottaker.ident")}
                            onChange={(ident) => setValue("mottaker.ident", ObjectUtils.isEmpty(ident) ? null : ident)}
                        />
                        <MottakerNavnOgAdresse />
                    </div>
                </Tabs.Panel>
                <Tabs.Panel value="FRITEKST" className={`h-max w-full bg-ax-neutral-100 p-4 ${borderColor}`}>
                    <MottakerFritekst />
                </Tabs.Panel>
            </Tabs>
            {errors.mottaker?.message && (
                <Alert inline size="small" variant="error">
                    {errors.mottaker?.message}
                </Alert>
            )}
        </div>
    );
}

function MottakerFritekst() {
    const {
        register,
        formState: { errors },
    } = useOpprettForsendelseFormContext();

    return (
        <div className="w-[400px] h-max">
            <TextField
                className="mb-2"
                size="small"
                label="Navn"
                {...register("mottaker.navn", {
                    validate: validerMaks128Tegn(
                        "Navn kan ikke være lengre enn 128 tegn. Vennligst benytt adressefeltet for å skrive resten av adressen.",
                    ),
                })}
                error={errors?.mottaker?.navn?.message}
            />
            <React.Suspense fallback={<Loader />}>
                <EditAddress formPrefix="mottaker.adresse" />
            </React.Suspense>
        </div>
    );
}

function MottakerNavnOgAdresse() {
    const { setValue } = useOpprettForsendelseFormContext();
    const mottakerIdent: string = useWatch<OpprettForsendelseFormProps>({ name: "mottaker.ident" }) as string;
    const { data, isFetching, isError } = useHentSamhandlerEllerPersonForIdent(mottakerIdent);
    const roller = useHentRoller();
    function hentRolle(ident: string) {
        return roller.find((rolle) => rolle.ident === ident)?.rolleType;
    }

    useEffect(() => {
        if (mottakerIdent === null) {
            setValue("mottaker", null);
        }
    }, [mottakerIdent]);
    useEffect(() => {
        if (data?.adresse) {
            setValue("mottaker.adresse", {
                ...data.adresse,
            });
        }
        if (data?.navn) {
            setValue("mottaker.navn", data.navn);
        }
    }, [data?.adresse, data?.navn]);

    if (isFetching) {
        return <Loader size="xsmall" />;
    }
    if (isError) {
        return (
            <Alert variant="info" inline>
                Fant ikke {IdentUtils.isFnr(mottakerIdent) ? "Person" : "Samhandler"} med ident {mottakerIdent}
            </Alert>
        );
    }

    if (!data?.valid) return null;

    return (
        <Panel>
            <PersonDetaljer
                copy={false}
                spacing={false}
                navn={data.navn ?? "UKJENT NAVN"}
                // ident={data.ident}
                rolle={hentRolle(data.ident)}
            />

            <div className="pt-3">
                <MottakerAdresse adresse={data.adresse} />
            </div>
        </Panel>
    );
}

type MottakerAdresseProps = {
    adresse?: MottakerAdresseTo;
};

function MottakerAdresse({ adresse: mottakerAdresse }: MottakerAdresseProps) {
    const [inEditMode, setInEditMode] = useState(false);
    const { watch } = useOpprettForsendelseFormContext();
    const manglerAdresse = mottakerAdresse == null;
    const adresse = mottakerAdresse ?? watch("mottaker.adresse");

    const hasAdresse = !ObjectUtils.isEmpty(adresse) && !hasOnlyNullValues(adresse);
    const editAdresse = inEditMode || hasAdresse;

    function onInitEditMode() {
        setInEditMode(true);
    }

    function renderAdresse() {
        if (!manglerAdresse) {
            return <AdresseInfo adresse={adresse} />;
        }

        if (!editAdresse) {
            return (
                <div>
                    <Alert size="small" variant="warning" className="mb-2">
                        Fant ingen adresse til mottaker
                    </Alert>
                    <Button
                        id={"endre_adresse_knapp"}
                        variant="tertiary"
                        size="xsmall"
                        onClick={onInitEditMode}
                        icon={<Edit fr="true" />}
                    >
                        Legg til
                    </Button>
                </div>
            );
        }

        return (
            <React.Suspense fallback={<Loader />}>
                <EditAddress formPrefix="mottaker.adresse" />
            </React.Suspense>
        );
    }

    return (
        <>
            {!editAdresse && <Heading size="xsmall">Adresse:</Heading>}
            {renderAdresse()}
        </>
    );
}
