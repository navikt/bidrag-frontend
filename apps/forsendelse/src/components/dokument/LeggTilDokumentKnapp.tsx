import "./LeggTilDokumentButton.css";

import { dateToDDMMYYYYString, PersonNavnIdent, type RolleType, RolleTypeAbbreviation } from "@bidrag/common";
import { PlusIcon as Add, ChevronUpIcon as Collapse, ChevronDownIcon as Expand } from "@navikt/aksel-icons";
import { Accordion, Button, Checkbox, Loader, Modal, Table, Tabs, Tag } from "@navikt/ds-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { DokumentStatus } from "../../constants/DokumentStatus";
import useIsDebugMode from "../../hooks/useDebugMode";
import {
    useHentForsendelseQuery,
    useHentJournalposterForPerson,
    useHentJournalposterForSak,
    useHentRoller,
} from "../../hooks/useForsendelseApi";
import { useDokumenterForm } from "../../pages/forsendelse/context/DokumenterFormContext";
import type { IDokument } from "../../types/Dokument";
import { type IDokumentJournalDto, type IJournalpost, IJournalpostStatus } from "../../types/Journalpost";
import { mapRolleToDisplayValue } from "../../types/RolleMapper";
import JournalpostStatusTag from "../journalpost/JournalpostStatusTag";
import DokumentStatusTag from "./DokumentStatusTag";
import { isSameDocument, JournalpostForsendelseRelasjoner } from "./JournalpostStatusMapper";
import OpenDokumentButton from "./OpenDokumentButton";

export default function LeggTilDokumentKnapp() {
    const { addDocuments } = useDokumenterForm();
    const [modalOpen, setModalOpen] = useState(false);

    const closeModal = () => {
        setModalOpen(false);
    };

    return (
        <div>
            <Button onClick={() => setModalOpen(true)} variant={"tertiary"} size={"small"} icon={<Add />}>
                Legg til dokument
            </Button>
            <LeggTilDokumentFraSakModal
                open={modalOpen}
                onClose={(selectedDocuments) => {
                    addDocuments(selectedDocuments);
                    closeModal();
                }}
            />
        </div>
    );
}

interface LeggTilDokumentFraSakModalProps {
    onClose: (selectedDocuments: IDokument[]) => void;
    open: boolean;
}
function LeggTilDokumentFraSakModal({ onClose, open }: LeggTilDokumentFraSakModalProps) {
    const [selectedDocuments, setSelectedDocuments] = useState<IDokument[]>([]);
    const forsendelse = useHentForsendelseQuery();
    const [hasOpened, setHasOpened] = useState(false);
    const ref = useRef<HTMLDialogElement>(null);

    const saksnummer = forsendelse.saksnummer;
    function selectDocument(document: IDokument, toggle = true) {
        const isSelected = (d: IDokument) => {
            if (document.dokumentreferanse) {
                return isSameDocument(d, document);
            }
            return d.journalpostId?.replace(/\D/g, "") === document.journalpostId?.replace(/\D/g, "");
        };

        setSelectedDocuments((selectedDocuments) => {
            const isDocumentSelected = selectedDocuments.some(isSelected);
            if (isDocumentSelected) {
                return toggle ? selectedDocuments.filter((d) => !isSelected(d)) : selectedDocuments;
            }
            const rolle = document.fraRolle ? mapRolleToDisplayValue(document.fraRolle)?.toLowerCase() : "";
            const title =
                saksnummer === document.fraSaksnummer
                    ? document.tittel
                    : `${fjernRollereferanseFraTittel(document.tittel)} (fra ${rolle} sak ${document.fraSaksnummer})`;
            return [...selectedDocuments, { ...document, tittel: title }];
        });
    }

    function fjernRollereferanseFraTittel(tittel: string): string {
        const hentFraRolleSakStartIndex = (rolletype: RolleType) =>
            tittel.indexOf(`(fra ${mapRolleToDisplayValue(rolletype)?.toLowerCase()}`);
        const fraRolleSakStartIndex = Math.max(
            hentFraRolleSakStartIndex(RolleTypeAbbreviation.BA),
            hentFraRolleSakStartIndex(RolleTypeAbbreviation.BM),
            hentFraRolleSakStartIndex(RolleTypeAbbreviation.BP),
        );
        if (fraRolleSakStartIndex > 0) {
            const fraRolleSakSluttIndex = tittel.indexOf(")", fraRolleSakStartIndex);
            return tittel.substring(0, fraRolleSakStartIndex - 1) + tittel.substring(fraRolleSakSluttIndex + 1);
        }
        return tittel;
    }

    function unselectDocument(document: IDokument) {
        const isSelected = (d) =>
            document.dokumentreferanse
                ? d.dokumentreferanse === document.dokumentreferanse
                : d.journalpostId === document.journalpostId;
        setSelectedDocuments((selectedDocuments) => selectedDocuments.filter((d) => !isSelected(d)));
    }

    useEffect(() => {
        setSelectedDocuments([]);
        if (open) {
            ref.current?.showModal();
            setHasOpened(true);
        } else ref.current?.close();
    }, [open]);

    return (
        <Modal
            ref={ref}
            onClose={() => onClose([])}
            header={{
                heading: "Legg til dokumenter",
            }}
            className="max-w-none"
        >
            <Modal.Body className="legg_til_dokument_modal">
                {hasOpened && (
                    <React.Suspense fallback={<Loader size={"medium"} />}>
                        <VelgDokumentTabs
                            selectDocument={selectDocument}
                            unselectDocument={unselectDocument}
                            selectedDocuments={selectedDocuments}
                        />
                    </React.Suspense>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button size="small" onClick={() => onClose(selectedDocuments)}>
                    Legg til valgte
                </Button>
                <Button size="small" variant={"tertiary"} onClick={() => onClose([])}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
interface VelgDokumentTabsProps {
    selectDocument: (documents: IDokument, toogle: boolean) => void;
    unselectDocument: (documents: IDokument) => void;
    selectedDocuments: IDokument[];
}
function VelgDokumentTabs({ selectDocument, selectedDocuments, unselectDocument }: VelgDokumentTabsProps) {
    const [tabState, setTabState] = useState("fra_samme_sak");
    const forsendelse = useHentForsendelseQuery();
    const roller = useHentRoller();
    const renderLabel = (label: string, saksnummer?: string, rolle?: RolleType) => {
        const numberOfSelectedDocuments = selectedDocuments.filter(
            (d) => (saksnummer && d.fraSaksnummer === saksnummer) || (rolle && d.fraRolle === rolle),
        ).length;
        if (numberOfSelectedDocuments > 0) {
            return (
                <div>
                    {label}{" "}
                    <Tag variant={"info"} size="small">
                        {numberOfSelectedDocuments}
                    </Tag>
                </div>
            );
        }

        return <div>{label}</div>;
    };
    return (
        <Tabs value={tabState} onChange={setTabState}>
            <Tabs.List>
                <Tabs.Tab value="fra_samme_sak" label={renderLabel("Fra samme sak", forsendelse.saksnummer)} />
                <Tabs.Tab value="bm" label={renderLabel("Fra BM saker", null, RolleTypeAbbreviation.BM)} />
                <Tabs.Tab value="bp" label={renderLabel("Fra BP saker", null, RolleTypeAbbreviation.BP)} />
            </Tabs.List>
            <Tabs.Panel value="fra_samme_sak" className="">
                <React.Suspense fallback={<Loader size={"small"} />}>
                    <DokumenterForSakTabell
                        saksnummer={forsendelse.saksnummer}
                        selectedDocuments={selectedDocuments}
                        selectDocument={selectDocument}
                        unselectDocument={unselectDocument}
                    />
                </React.Suspense>
            </Tabs.Panel>
            <Tabs.Panel value="bm" className="h-24 w-full overflow-auto">
                <Accordion style={{ width: "100%", height: "100%" }} size="small" headingSize="xsmall">
                    <React.Suspense fallback={<Loader size={"small"} />}>
                        <DokumenterForPerson
                            rolle={RolleTypeAbbreviation.BM}
                            selectedDocuments={selectedDocuments}
                            unselectDocument={unselectDocument}
                            selectDocument={(dokument, toogle) =>
                                selectDocument({ ...dokument, fraRolle: RolleTypeAbbreviation.BM }, toogle)
                            }
                            ident={roller.find((r) => r.rolleType === RolleTypeAbbreviation.BM)?.ident}
                        />
                    </React.Suspense>
                </Accordion>
            </Tabs.Panel>
            <Tabs.Panel value="bp" className="w-full overflow-auto">
                <Accordion style={{ width: "100%" }} size="small" headingSize="xsmall">
                    <React.Suspense fallback={<Loader size={"small"} />}>
                        <DokumenterForPerson
                            rolle={RolleTypeAbbreviation.BP}
                            selectedDocuments={selectedDocuments}
                            unselectDocument={unselectDocument}
                            selectDocument={(dokument, toogle) =>
                                selectDocument({ ...dokument, fraRolle: RolleTypeAbbreviation.BP }, toogle)
                            }
                            ident={roller.find((r) => r.rolleType === RolleTypeAbbreviation.BP)?.ident}
                        />
                    </React.Suspense>
                </Accordion>
            </Tabs.Panel>
        </Tabs>
    );
}

interface DokumenterForPersonProps {
    rolle: RolleType;
    ident: string;
    selectDocument: (documents: IDokument, toogle?: boolean) => void;
    unselectDocument: (documents: IDokument) => void;
    selectedDocuments: IDokument[];
}

function DokumenterForPerson({
    ident,
    selectDocument,
    unselectDocument,
    selectedDocuments,
    rolle,
}: DokumenterForPersonProps) {
    const forsendelseSaksnummer = useHentForsendelseQuery().saksnummer;
    const { saksnummere, harTilgang, sakerUtenTilgang } = useHentJournalposterForPerson(ident);

    const renderAccordionHeader = (saksnummer: string) => {
        const numberOfSelectedDocuments = selectedDocuments.filter((d) => d.fraSaksnummer === saksnummer).length;
        if (numberOfSelectedDocuments > 0) {
            return (
                <div>
                    Sak {saksnummer}{" "}
                    <Tag variant={"info"} size="small">
                        {numberOfSelectedDocuments}
                    </Tag>
                </div>
            );
        }

        return <div>Sak {saksnummer}</div>;
    };
    const rolleSaksnummere = saksnummere.filter((saksnummer) => saksnummer !== forsendelseSaksnummer);
    if (!harTilgang) {
        return <div className={"p-2"}>Du mangler tilgang til saker for {rolle}</div>;
    }
    if (rolleSaksnummere.length === 0) {
        return <div className={"p-2"}>Det finnes ikke flere saker for {rolle}</div>;
    }
    return (
        <>
            {rolleSaksnummere.map((saksnummer) => {
                return (
                    <Accordion.Item defaultOpen style={{ minWidth: "3rem" }} key={`${rolle} ${saksnummer}`}>
                        <Accordion.Header>{renderAccordionHeader(saksnummer)}</Accordion.Header>
                        <Accordion.Content className="p-4">
                            {sakerUtenTilgang.has(saksnummer) ? (
                                <div className={"p-2"}>Du mangler tilgang til dokumenter for sak {saksnummer}</div>
                            ) : (
                                <DokumenterForSakTabell
                                    saksnummer={saksnummer}
                                    selectedDocuments={selectedDocuments}
                                    selectDocument={selectDocument}
                                    unselectDocument={unselectDocument}
                                />
                            )}
                        </Accordion.Content>
                    </Accordion.Item>
                );
            })}
        </>
    );
}

interface DokumenterForSakTabellProps {
    fraRolle?: RolleType;
    saksnummer: string;
    selectDocument: (dokument: IDokument, toogle?: boolean) => void;
    unselectDocument: (documents: IDokument) => void;
    selectedDocuments: IDokument[];
}
function DokumenterForSakTabell({
    saksnummer,
    selectDocument,
    unselectDocument,
    selectedDocuments,
    fraRolle,
}: DokumenterForSakTabellProps) {
    const journalposter = useHentJournalposterForSak(saksnummer);
    const forsendelse = useHentForsendelseQuery();
    const visJournalposter = journalposter
        .filter((jp) => jp.journalstatus !== IJournalpostStatus.UNDER_OPPRETELSE)
        .filter((jp) => jp.feilfort !== true)
        .filter((jp) => jp.journalpostId !== `BIF-${forsendelse.forsendelseId?.replace("BIF-", "")}`)
        .sort((a, b) => {
            return b.dokumentDato?.localeCompare(a.dokumentDato);
        });
    if (visJournalposter.length === 0) {
        return <div className={"p-2"}>Det finnes ikke flere journalposter i samme sak</div>;
    }
    return (
        <div className="bisys-table-container">
            <Table>
                <Table.Header style={{ position: "sticky", top: "0", zIndex: 1000, backgroundColor: "white" }}>
                    <Table.Row>
                        <Table.HeaderCell style={{ width: "2%" }} />
                        <Table.HeaderCell style={{ width: "2%" }} />
                        <Table.HeaderCell scope="col">Tittel</Table.HeaderCell>
                        <Table.HeaderCell scope="col" style={{ width: "80px" }}></Table.HeaderCell>
                        <Table.HeaderCell scope="col" style={{ width: "5%" }}>
                            Dok. dato
                        </Table.HeaderCell>

                        <Table.HeaderCell scope="col" style={{ width: "5%" }}>
                            Type
                        </Table.HeaderCell>
                        <Table.HeaderCell scope="col" style={{ width: "5%" }} align={"left"}>
                            Gjelder
                        </Table.HeaderCell>
                        <Table.HeaderCell scope="col" style={{ width: "150px" }}>
                            Status
                        </Table.HeaderCell>
                        <Table.HeaderCell style={{ width: "2%" }} />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {visJournalposter.map((journalpost) => {
                        return (
                            <JournalpostDokumenterRowMultiDoc
                                key={journalpost.journalpostId}
                                fraRolle={fraRolle}
                                saksnummer={saksnummer}
                                journalpost={journalpost}
                                selectDocument={selectDocument}
                                unselectDocument={unselectDocument}
                                selectedDocuments={selectedDocuments}
                            />
                        );
                    })}
                </Table.Body>
            </Table>
        </div>
    );
}

interface JournalpostDokumenterRowProps {
    fraRolle?: RolleType;
    saksnummer: string;
    journalpost: IJournalpost;
    unselectDocument: (documents: IDokument) => void;
    selectDocument: (dokument: IDokument, toogle?: boolean) => void;
    selectedDocuments: IDokument[];
}

function JournalpostDokumenterRowMultiDoc({
    saksnummer,
    journalpost,
    selectDocument,
    unselectDocument,
    fraRolle,
    selectedDocuments,
}: JournalpostDokumenterRowProps) {
    const [showAllDocuments, setShowAllDocuments] = useState(false);
    const forsendelse = useHentForsendelseQuery();
    const forsendelseDokumenter = forsendelse.dokumenter;
    const isDebugMode = useIsDebugMode();
    const jpForsendelseRelasjoner = useMemo(
        () => new JournalpostForsendelseRelasjoner(journalpost, selectedDocuments, forsendelseDokumenter),
        [journalpost, selectedDocuments, forsendelseDokumenter],
    );
    function toggleShowAllDocuments() {
        setShowAllDocuments((s) => !s);
    }

    function onJournalpostSelected() {
        if (jpForsendelseRelasjoner.erJournalpostDokumenterLagtTilIForsendelse() || journalpost.erForsendelse) {
            journalpost.dokumenter
                .filter((d) => !jpForsendelseRelasjoner.erLagtTilIForsendelse(d))
                .forEach((d) => onDocumentSelected(d));
            return;
        }

        if (jpForsendelseRelasjoner.erAlleDokumenterValgt(false) && !jpForsendelseRelasjoner.isJournalpostSelected()) {
            journalpost.dokumenter.forEach((dok) =>
                unselectDocument({
                    journalpostId: journalpost.journalpostId,
                    dokumentreferanse: dok.dokumentreferanse,
                    lagret: false,
                    index: -1,
                    tittel: "",
                    metadata: null,
                }),
            );
        }
        const leggTilDokument: IDokument = {
            fraSaksnummer: saksnummer,
            journalpostId: journalpost.journalpostId,
            språk: journalpost.språk,
            dokumentmalId: journalpost.dokumenter[0].dokumentmalId,
            tittel: journalpost.innhold,
            fraRolle: fraRolle,
            lagret: false,
            dokumentDato: journalpost.dokumentDato,
            status: DokumentStatus.MÅ_KONTROLLERES,
            index: -1,
            metadata: null,
        };
        selectDocument(leggTilDokument);
    }

    function onDocumentSelected(dokumentDto: IDokumentJournalDto, toggle = true, skipJournalpostCheck = false) {
        if (jpForsendelseRelasjoner.isJournalpostSelected() && !skipJournalpostCheck) {
            unselectDocument({
                journalpostId: journalpost.journalpostId,
                lagret: false,
                index: -1,
                tittel: "",
                metadata: null,
            });
            journalpost.dokumenter.forEach((d) => onDocumentSelected(d, false, true));
        }
        const leggTilDokument: IDokument = {
            fraSaksnummer: saksnummer,
            journalpostId: journalpost.journalpostId,
            dokumentreferanse: dokumentDto.dokumentreferanse,
            originalDokumentreferanse: dokumentDto.originalDokumentreferanse,
            originalJournalpostId: dokumentDto.originalJournalpostId,
            språk: journalpost.språk,
            tittel: dokumentDto.tittel,
            dokumentmalId: dokumentDto.dokumentmalId,
            fraRolle: fraRolle,
            dokumentDato: journalpost.dokumentDato,
            status: getForsendelseStatusEtterKnyttetTilForsendelse(dokumentDto),
            lagret: false,
            index: -1,
            metadata: null,
        };
        selectDocument(leggTilDokument, toggle);
    }

    function getForsendelseStatusEtterKnyttetTilForsendelse(dokumentDto: IDokumentJournalDto) {
        const status = getForsendelseStatus(dokumentDto);
        if ([DokumentStatus.KONTROLLERT, DokumentStatus.FERDIGSTILT].includes(status))
            return DokumentStatus.MÅ_KONTROLLERES;
        return status;
    }

    function erKopiAvEksternDokument(dokumentDto: IDokumentJournalDto) {
        return dokumentDto.originalDokumentreferanse != null || dokumentDto.originalJournalpostId != null;
    }

    function getForsendelseStatus(dokumentDto: IDokumentJournalDto) {
        if (!journalpost.erForsendelse) {
            if (journalpost.journalpostId.startsWith("BID-")) {
                return journalpost.status === "UNDER_PRODUKSJON"
                    ? DokumentStatus.UNDER_PRODUKSJON
                    : DokumentStatus.FERDIGSTILT;
            }
            return DokumentStatus.FERDIGSTILT;
        }

        const kopiAvEksternDokument = erKopiAvEksternDokument(dokumentDto);
        const erLenkeTilAnnenForsendelse = dokumentDto.arkivSystem === "FORSENDELSE";
        if (dokumentDto.status === "FERDIGSTILT") {
            return kopiAvEksternDokument && !erLenkeTilAnnenForsendelse
                ? DokumentStatus.KONTROLLERT
                : DokumentStatus.FERDIGSTILT;
        }
        if (dokumentDto.status === "UNDER_PRODUKSJON") {
            return DokumentStatus.UNDER_PRODUKSJON;
        }
        return kopiAvEksternDokument && !erLenkeTilAnnenForsendelse
            ? DokumentStatus.MÅ_KONTROLLERES
            : DokumentStatus.UNDER_REDIGERING;
    }

    const numerOfSelectedDocuments = journalpost.dokumenter.filter(
        jpForsendelseRelasjoner.erDokumentValgt.bind(jpForsendelseRelasjoner),
    ).length;

    let tittel = journalpost.dokumenter.length > 0 ? journalpost.dokumenter[0].tittel : journalpost.innhold;
    tittel = tittel !== undefined || tittel?.trim()?.length === 0 ? journalpost.innhold : tittel;
    const tittelDebug = isDebugMode ? `${tittel}  -  ${journalpost.journalpostId}` : tittel;
    const harBareEttDokument = journalpost.dokumenter.length === 1;
    return (
        <>
            <Table.Row
                key={journalpost.journalpostId}
                selected={jpForsendelseRelasjoner.erAlleDokumenterValgt()}
                className={`journalpost journalpostrad ${showAllDocuments ? "open" : ""}`}
            >
                <Table.DataCell>
                    {!harBareEttDokument && (
                        <Button
                            icon={showAllDocuments ? <Collapse /> : <Expand />}
                            size={"small"}
                            variant={"tertiary"}
                            onClick={toggleShowAllDocuments}
                        />
                    )}
                </Table.DataCell>
                <Table.DataCell>
                    <Checkbox
                        hideLabel
                        checked={
                            jpForsendelseRelasjoner.erAlleDokumenterValgt() ||
                            jpForsendelseRelasjoner.erNoenDokumenterValgt() ||
                            jpForsendelseRelasjoner.erJournalpostLagtTilIForsendelse() ||
                            jpForsendelseRelasjoner.erAllDokumenterLagtTilIForsendelse()
                        }
                        // indeterminate={isSomeDocumentsSelected && !isAllDocumentsSelected}
                        onChange={onJournalpostSelected}
                        disabled={
                            jpForsendelseRelasjoner.erJournalpostLagtTilIForsendelse() ||
                            jpForsendelseRelasjoner.erAllDokumenterLagtTilIForsendelse()
                        }
                        aria-labelledby={`id-${journalpost.journalpostId}`}
                    >
                        {" "}
                    </Checkbox>
                </Table.DataCell>
                <Table.DataCell>{tittelDebug}</Table.DataCell>
                <Table.DataCell>
                    {jpForsendelseRelasjoner.erNoenDokumenterValgt() && (
                        <Tag variant="info" size="small" className="w-max">
                            {`${numerOfSelectedDocuments} av ${journalpost.dokumenter.length}`}
                        </Tag>
                    )}
                </Table.DataCell>
                <Table.DataCell>{dateToDDMMYYYYString(new Date(journalpost.dokumentDato))}</Table.DataCell>

                <Table.DataCell>{journalpost.dokumentType}</Table.DataCell>
                <Table.DataCell>
                    <PersonNavnIdent ident={journalpost.gjelderAktor?.ident} skjulNavn />
                </Table.DataCell>
                <Table.DataCell>
                    <JournalpostStatusTag status={journalpost.journalstatus} />
                </Table.DataCell>
                <Table.DataCell>
                    <div className={"flex flex-row gap-1"}>
                        <OpenDokumentButton
                            journalpostId={journalpost.journalpostId}
                            status={journalpost.journalstatus}
                        />
                    </div>
                </Table.DataCell>
            </Table.Row>
            {showAllDocuments && (
                <JournalpostDokumenter
                    selectedDocuments={selectedDocuments}
                    journalpost={journalpost}
                    onDocumentSelected={onDocumentSelected}
                />
            )}
        </>
    );
}

type JournalpostDokumenterProps = {
    journalpost: IJournalpost;
    selectedDocuments: IDokument[];
    onDocumentSelected: (dokumentDto: IDokumentJournalDto, toggle?: boolean, skipJournalpostCheck?: boolean) => void;
};
function JournalpostDokumenter({ journalpost, onDocumentSelected, selectedDocuments }: JournalpostDokumenterProps) {
    const forsendelse = useHentForsendelseQuery();
    const forsendelseDokumenter = forsendelse.dokumenter;
    const isDebugMode = useIsDebugMode();
    const jpForsendelseRelasjoner = useMemo(
        () => new JournalpostForsendelseRelasjoner(journalpost, selectedDocuments, forsendelseDokumenter),
        [journalpost, selectedDocuments, forsendelseDokumenter],
    );

    return journalpost.dokumenter.map((dok, index) => (
        <Table.Row
            className={`dokumentrad ${index === journalpost.dokumenter.length - 1 ? "last" : ""}`}
            key={index + dok.dokumentreferanse}
            selected={jpForsendelseRelasjoner.erDokumentValgt(dok)}
        >
            <Table.DataCell colSpan={1} />

            <Table.DataCell>
                <Checkbox
                    hideLabel
                    checked={jpForsendelseRelasjoner.erDokumentValgt(dok)}
                    onChange={() => {
                        onDocumentSelected(dok, true);
                    }}
                    disabled={jpForsendelseRelasjoner.erLagtTilIForsendelse(dok)}
                    aria-labelledby={`id-${journalpost.journalpostId}`}
                    className={""}
                >
                    {" "}
                </Checkbox>
            </Table.DataCell>
            <Table.DataCell colSpan={5}>
                {isDebugMode
                    ? `${dok.tittel} - ${dok.originalDokumentreferanse} - ${dok.originalJournalpostId}`
                    : dok.tittel}
            </Table.DataCell>
            <Table.DataCell colSpan={1}>
                <DokumentStatusTag status={jpForsendelseRelasjoner.getForsendelseStatus(dok)} />
            </Table.DataCell>
            <Table.DataCell colSpan={1}>
                <OpenDokumentButton
                    dokumentreferanse={dok.dokumentreferanse}
                    journalpostId={journalpost.journalpostId}
                    status={dok.status}
                />
            </Table.DataCell>
        </Table.Row>
    ));
}
