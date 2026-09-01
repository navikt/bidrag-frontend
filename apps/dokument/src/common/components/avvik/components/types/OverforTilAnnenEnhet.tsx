import { BodyShort, Checkbox, Loader, Select } from "@navikt/ds-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useHentJournalpost } from "../../../../../hooks/useDokumentApi";
import { useHentJournalforendeEnheter } from "../../../../../hooks/useOrganisasjonApi";
import { useHentGjelder } from "../../../../../hooks/usePersonApi";
import { AvvikType } from "../../../../../types/api/AvvikTypes";
import type { Avvik, OverforTilAnnenEnhet as OverforTilAnnenEnhetAvvik } from "../../../../../types/avvik";
import { type Enhet, EnhetType } from "../../../../../types/enhet";
import { FAGOMRADE } from "../../../../../types/enum/Fagomrade";
import type { Journalpost } from "../../../../../types/journalpost";
import type { Person } from "../../../../../types/person";
import { handleSubmitPreventPropagation } from "../../../form/FormUtils";
import SelectGroup, { type SelectOption } from "../../../select/SelectGroup";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import type { AvvikTypeCommonProps } from "./AvvikTypes";

const enhetTypeByGroupPriority = new Set([
    EnhetType.FORVALTNING,
    EnhetType.KLAGE,
    EnhetType.SPESIALENHETER,
    ...Object.values(EnhetType),
]);

interface OverforTilAnnenEnhetProps extends AvvikTypeCommonProps {
    paloggetEnhet: string;
    journalpost: Journalpost;
}

function OverforTilAnnenEnhet(props: OverforTilAnnenEnhetProps) {
    const initialAvvik = props.initialAvvik as OverforTilAnnenEnhetAvvik;
    const journalforendeEnhetList = useHentJournalforendeEnheter();
    const person = useHentGjelder();
    const [nyEnhet, setNyEnhet] = useState<string | undefined>(undefined);
    const currentEnhetsnummer = useRef<string>(
        initialAvvik?.nyttEnhetsnummer ?? props.journalpost.journalforendeEnhet ?? props.paloggetEnhet,
    );
    const handleSubmit = async (values: OverforTilAnnenEnhetStepValues) => {
        if (values.endreFagomradeTilBID) {
            await props.sendAvvik({
                type: AvvikType.ENDRE_FAGOMRADE,
                fagomrade: FAGOMRADE.BID,
            });
        }
        const gammeltEnhetsnummer = props.journalpost.journalforendeEnhet ?? props.paloggetEnhet;
        const avvik: Avvik = {
            type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
            nyttEnhetsnummer: values.enhetsnummer,
            gammeltEnhetsnummer: gammeltEnhetsnummer,
        };
        props.sendAvvik(avvik, person?.ident);
        props.setActiveStep(2);
        const selectedEnhet = journalforendeEnhetList.find((enhet) => enhet.enhetIdent === values.enhetsnummer);
        setNyEnhet(selectedEnhet?.enhetNavn ?? " ");
    };

    if (journalforendeEnhetList.length === 0) {
        return (
            <div className="AvvikshandteringModal__spinner-wrapper">
                <Loader transparent={true} type="XL" aria-label="Henter enhetsliste" />
            </div>
        );
    }

    return (
        <>
            <OverforTilAnnenEnhetFirstStep
                isActive={props.activeStep === 1}
                defaultEnhetsnummer={currentEnhetsnummer.current}
                enhetlist={journalforendeEnhetList as unknown as Enhet[]}
                person={person}
                onSubmit={handleSubmit}
            />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Dokument er nå overført til enhet {nyEnhet}</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface OverforTilAnnenEnhetFirstStepProps {
    isActive: boolean;
    defaultEnhetsnummer: string;
    enhetlist?: Enhet[];
    person: Person;
    onSubmit: (values: OverforTilAnnenEnhetStepValues) => void;
}

interface OverforTilAnnenEnhetStepValues {
    enhetsnummer: string;
    personIdent?: string;
    endreFagomradeTilBID?: boolean;
}

function mapEnhetListToEnhetOptions(enhetList?: Enhet[]) {
    return enhetList
        ? enhetList
              .sort((a, b) => a.enhetIdent.localeCompare(b.enhetIdent))
              .map((enhet) => ({
                  label: `${enhet.enhetIdent} ${enhet.enhetNavn}`,
                  value: enhet.enhetIdent,
              }))
        : [];
}

function filterEnhetByType(enhetType: EnhetType) {
    return (enhet: Enhet) => enhet.enhetType === enhetType;
}

function mapEnhetListToEnhetGroupMap(enhetList?: Enhet[]): Map<EnhetType, SelectOption[]> {
    if (!enhetList) {
        return new Map();
    }
    const enhetGroupMap: Map<EnhetType, SelectOption[]> = new Map();
    enhetTypeByGroupPriority.forEach((enhetType) => {
        const enhetListByType = enhetList.filter(filterEnhetByType(enhetType));
        enhetGroupMap.set(enhetType, mapEnhetListToEnhetOptions(enhetListByType));
    });
    return enhetGroupMap;
}

function OverforTilAnnenEnhetFirstStep(props: OverforTilAnnenEnhetFirstStepProps) {
    const personIdentExists = () => props.person?.ident && props.person.ident.length > 0;
    const journalpost = useHentJournalpost();

    const enhetGroupMap = useMemo(() => mapEnhetListToEnhetGroupMap(props.enhetlist), [props.enhetlist]);
    const { register, handleSubmit } = useForm<OverforTilAnnenEnhetStepValues>({
        defaultValues: {
            enhetsnummer: props.defaultEnhetsnummer,
            endreFagomradeTilBID: false,
        },
    });

    if (!props.isActive) {
        return null;
    }

    const renderEndreFagomradeTilBidrag = () => {
        return (
            <div>
                <br />
                Hvis du overfører til en enhet som ikke behandler farskapsdokumenter bør du endre fagområdet til Bidrag.
                Dette vil sørge for at enheten får tilgang til å behandle journalposten. <br />
                Husk at hvis du endrer fagområde på journalposten til Bidrag vil journalposten (tittel og dokument) være
                synlig for den dokumentet gjelder.
                <br />
                <Checkbox
                    data-testid={"endre_fagomrade_til_bidrag"}
                    size={"small"}
                    {...register("endreFagomradeTilBID")}
                >
                    Endre fagområde til Bidrag
                </Checkbox>
            </div>
        );
    };
    const renderInfoText = () => {
        const erFagomradeFAR = journalpost.fagomrade === FAGOMRADE.FAR;
        if (personIdentExists()) {
            return (
                <BodyShort>
                    Her kan du lagre dokumentet med fødselsnummer {props.person.ident} og overføre til en annen enhet
                    {erFagomradeFAR && renderEndreFagomradeTilBidrag()}
                </BodyShort>
            );
        }
        return (
            <BodyShort>
                Her kan du overføre oppgaven til en annen enhet
                {erFagomradeFAR && renderEndreFagomradeTilBidrag()}
            </BodyShort>
        );
    };

    return (
        <form onSubmit={handleSubmitPreventPropagation(handleSubmit(props.onSubmit))}>
            {renderInfoText()}
            <Select
                name="enhetsnummer"
                size="small"
                label="Velg enhet dokumentet skal overføres til:"
                {...register("enhetsnummer")}
            >
                {Array.from(enhetGroupMap.entries()).map(([enhetType, enhetOptions]) => (
                    <SelectGroup key={enhetType} options={enhetOptions} groupLabel={enhetType} />
                ))}
            </Select>
            <input hidden name="personIdent" {...register("personIdent")} defaultValue={props.person?.ident} />
            <AvvikModalButtons
                onSubmit={handleSubmit(props.onSubmit)}
                submitButtonLabel={personIdentExists() ? "Lagre og overfør" : "Overfør"}
            />
        </form>
    );
}

export default OverforTilAnnenEnhet;
