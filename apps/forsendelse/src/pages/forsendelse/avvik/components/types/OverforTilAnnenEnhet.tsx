import type { JournalforendeEnhetDto } from "@bidrag/api/OrganisasjonApi";
import { BodyShort, Checkbox, Loader, Select } from "@navikt/ds-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import SelectGroup, { type SelectOption } from "../../../../../components/select/SelectGroup";
import { useHentJournalforendeEnheter } from "../../../../../hooks/useOrganisasjonApi";
import { type Avvik, AvvikType, type OverforTilAnnenEnhet as InitialAvvik } from "../../../../../types/AvvikTypes";
import { EnhetType } from "../../../../../types/EnhetTypes";
import { FAGOMRADE } from "../../../../../types/Journalpost";
import { useAvvikModalContext } from "../../AvvikshandteringButton";
import AvvikModalButtons from "../AvvikModalButtons";
import Bekreftelse from "../Bekreftelse";
import { type AvvikTypeCommonProps, handleSubmitPreventPropagation, registerToSelectProps } from "./AvvikTypes";

const enhetTypeByGroupPriority = new Set([
    EnhetType.FORVALTNING,
    EnhetType.KLAGE,
    EnhetType.SPESIALENHETER,
    ...Object.values(EnhetType),
]);

function OverforTilAnnenEnhet(props: AvvikTypeCommonProps) {
    const initialAvvik = props.initialAvvik as InitialAvvik;
    const { forsendelse, paloggetEnhet } = useAvvikModalContext();
    const { data: journalforendeEnhetList } = useHentJournalforendeEnheter();
    const [nyEnhet, setNyEnhet] = useState<string | undefined>(undefined);
    const currentEnhetsnummer = useRef<string>(initialAvvik?.nyttEnhetsnummer ?? forsendelse.enhet ?? paloggetEnhet);
    const handleSubmit = async (values: OverforTilAnnenEnhetStepValues) => {
        if (values.endreFagomradeTilBID) {
            await props.sendAvvik({
                type: AvvikType.ENDRE_FAGOMRADE,
                fagomrade: FAGOMRADE.BID,
            });
        }
        const gammeltEnhetsnummer = forsendelse.enhet ?? paloggetEnhet;
        const avvik: Avvik = {
            type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
            nyttEnhetsnummer: values.enhetsnummer,
            gammeltEnhetsnummer: gammeltEnhetsnummer,
        };
        props.sendAvvik(avvik);
        props.setActiveStep(2);
        const selectedEnhet = journalforendeEnhetList.find((enhet) => enhet.enhetIdent === values.enhetsnummer);
        setNyEnhet(selectedEnhet?.enhetNavn ?? " ");
    };

    if (journalforendeEnhetList.length === 0) {
        return (
            <div className="AvvikshandteringModal__spinner-wrapper">
                <Loader size="medium" />
            </div>
        );
    }

    return (
        <>
            <OverforTilAnnenEnhetFirstStep
                isActive={props.activeStep === 1}
                defaultEnhetsnummer={currentEnhetsnummer.current}
                enhetlist={journalforendeEnhetList}
                onSubmit={handleSubmit}
            />
            {props.activeStep === 2 && (
                <Bekreftelse>
                    <BodyShort>Forsendelsen er nå overført til enhet {nyEnhet}</BodyShort>
                </Bekreftelse>
            )}
        </>
    );
}

interface OverforTilAnnenEnhetFirstStepProps {
    isActive: boolean;
    defaultEnhetsnummer: string;
    enhetlist?: JournalforendeEnhetDto[];
    onSubmit: (values: OverforTilAnnenEnhetStepValues) => void;
}

interface OverforTilAnnenEnhetStepValues {
    enhetsnummer: string;
    personIdent?: string;
    endreFagomradeTilBID?: boolean;
}

function mapEnhetListToEnhetOptions(enhetList?: JournalforendeEnhetDto[]) {
    return (
        enhetList
            ?.sort((a, b) => a.enhetIdent.localeCompare(b.enhetIdent))
            .map((enhet) => {
                return {
                    label: `${enhet.enhetIdent} ${enhet.enhetNavn}`,
                    value: enhet.enhetIdent,
                };
            }) ?? []
    );
}

function filterEnhetByType(enhetType: EnhetType) {
    return (enhet: JournalforendeEnhetDto) => enhet.enhetType === enhetType;
}

function mapEnhetListToEnhetGroupMap(enhetList?: JournalforendeEnhetDto[]): Map<EnhetType, SelectOption[]> {
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
    const { forsendelse } = useAvvikModalContext();

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
        const erFagomradeFAR = forsendelse.tema === FAGOMRADE.FAR;
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
                label="Velg enhet forsendelsen skal overføres til:"
                {...registerToSelectProps("enhetsnummer", register)}
            >
                {Array.from(enhetGroupMap.entries()).map(([enhetType, enhetOptions]) => (
                    <SelectGroup key={enhetType} options={enhetOptions} groupLabel={enhetType} />
                ))}
            </Select>
            <AvvikModalButtons submitButtonLabel={"Overfør"} />
        </form>
    );
}

export default OverforTilAnnenEnhet;
