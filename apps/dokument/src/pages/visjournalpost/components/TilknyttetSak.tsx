import { Button, Checkbox, Heading, Loader } from "@navikt/ds-react";
import { useEffect, useRef, useState } from "react";

import useRegisterField from "../../../common/components/form/hooks/useRegisterField";
import NoAccessModal from "../../../common/components/modal/NoAccessModal";
import OpprettSakModal from "../../../common/components/modal/opprett-sak-modal/OpprettSakModal";
import RolleTag from "../../../common/components/person/RolleTag";
import SakTableMotsattRolle from "../../../common/components/SakTableMotsattRolle";
import SakstilknytningTable from "../../../common/components/table/SakstilknytningTable";
import type { ColumnData, RowData } from "../../../common/components/table/Table";
import { RedirectTo } from "../../../common/utils/RedirectUtils";
import { useHentJournalpost } from "../../../hooks/useDokumentApi";
import { useHentGjelder } from "../../../hooks/usePersonApi";
import { useHentSakerForJournalpost, useRefreshSakerJournalpost } from "../../../hooks/useSakApi";
import { useAppContext } from "../../../store/AppContext";
import SakMapper from "../../../store/mappers/SakMapper";
import { KategoriNavnDisplayValue, type Sak, SakStatusDisplayValue } from "../../../types/sak";
import { type UpdateJournalpostFormValues, useVisJournalpostContext } from "../context/VisJournalpostProvider";

const columns: ColumnData[] = [
    { label: "", className: "w-[1px]" },
    { label: "Sak" },
    { label: "Motpart" },
    { label: "Enhet", className: "w-[100px]" },
    { label: "" },
];

export default function TilknyttetSak() {
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
    const [sakerToRender, setSakerToRender] = useState<Sak[]>([]);
    const [sakerToBeRegisterWithJournal, setSakerToBeRegisterWithJournal] = useState<string[]>([]);
    const [sakWitLimitedAccess, setSakWithLimitedAccess] = useState<Sak | undefined>();
    const {
        appState: { påloggetEnhet, saksnummer },
    } = useAppContext();
    const { isEditMode } = useVisJournalpostContext();

    const journalpost = useHentJournalpost();
    const { saker, isLoading } = useHentSakerForJournalpost();
    const person = useHentGjelder();
    const refreshSakerJournalpost = useRefreshSakerJournalpost();

    const sakstilknytningPanelRef = useRef<HTMLDivElement>(null);

    const isSakInEditMode = isEditMode && !journalpost.isForsendelse;

    const { onUpdate } = useRegisterField<UpdateJournalpostFormValues>(
        "tilknyttSaker",
        {},
        () => sakstilknytningPanelRef.current,
        { enabled: isSakInEditMode, initialValue: journalpost.sakstilknytninger ?? [] },
    );

    useEffect(() => {
        setSakerToBeRegisterWithJournal(journalpost.sakstilknytninger ?? []);
    }, [isSakInEditMode]);

    useEffect(() => {
        onUpdate(sakerToBeRegisterWithJournal);
    }, [sakerToBeRegisterWithJournal]);

    useEffect(() => {
        if (!isLoading) {
            const updatedSaker = [...saker].sort((a, b) => {
                if (a.saksnummer === saksnummer) {
                    return -1;
                }
                return journalpostIsTilknyttetSak(b.saksnummer) ? 1 : -1;
            });

            setSakerToRender(SakMapper.sortBySaksnummer(updatedSaker));
        }
    }, [saker]);

    const openSakNoAccessModal = (sak: Sak) => setSakWithLimitedAccess(sak);
    const closeSakNoAccessModal = () => setSakWithLimitedAccess(undefined);
    const journalpostIsTilknyttetSak = (saksnummer: string) => journalpost.sakstilknytninger?.includes(saksnummer);

    function openModal() {
        setIsOpenModal(true);
    }

    function toggleSelectedItemToTilknyttetSakForRegistrering(saksnummerToAdd: string): void {
        setSakerToBeRegisterWithJournal((prevState) => {
            const isSelected = prevState.some((sak) => sak === saksnummerToAdd);
            if (!isSelected) {
                return [...prevState, saksnummerToAdd];
            } else {
                return prevState.filter((sakId) => sakId !== saksnummerToAdd);
            }
        });
    }

    function addNySak(saksnummer: string) {
        toggleSelectedItemToTilknyttetSakForRegistrering(saksnummer);
        refreshSakerJournalpost();
    }

    function createRow(sak: Sak): RowData {
        const isTilknyttetJournalpost = journalpostIsTilknyttetSak(sak.saksnummer);
        const isSelected = isTilknyttetJournalpost || sakerToBeRegisterWithJournal.includes(sak.saksnummer);
        return {
            components: [
                {
                    content: (
                        <Checkbox
                            disabled={!isSakInEditMode || isTilknyttetJournalpost}
                            className={"sakstilknyttningCheckbox"}
                            checked={isSelected}
                            value={sak.saksnummer}
                            hideLabel
                            onChange={() => {
                                if (sak.begrensetTilgang) {
                                    openSakNoAccessModal(sak);
                                } else {
                                    toggleSelectedItemToTilknyttetSakForRegistrering(sak.saksnummer);
                                }
                            }}
                        >
                            ""
                        </Checkbox>
                    ),
                },
                {
                    content: (
                        <>
                            {sak.saksnummer && (
                                <p>
                                    {sak.saksnummer}
                                    <RolleTag rolleType={sak.rolle?.rolleType} />
                                </p>
                            )}
                            <p>{KategoriNavnDisplayValue[sak.kategori]}</p>
                            <p>{SakStatusDisplayValue[sak.saksstatus]}</p>
                            {sak.erIkkeBidragSak && <p>Sak finnes ikke eller er ikke en bidrag sak</p>}
                        </>
                    ),
                },
                {
                    content: <SakTableMotsattRolle sak={sak} />,
                },
                {
                    content: !sak.erIkkeBidragSak && (
                        <div>
                            <div>{sak.eierfogd ?? ""}</div>
                            <div>{sak.enhetInformasjon ?? "Fant ikke enhetsnavn"}</div>
                        </div>
                    ),
                },
                {
                    content: !isSakInEditMode && !sak.erIkkeBidragSak && (
                        <Button
                            variant={"tertiary"}
                            size={"small"}
                            className={"aapne-sak-button w-full whitespace-nowrap"}
                            onClick={(e) => {
                                RedirectTo.behandleSak(sak.saksnummer, e.shiftKey);
                            }}
                        >
                            Åpne sak
                        </Button>
                    ),
                    width: "1",
                },
            ],
            isSelected,
        };
    }

    return (
        <div className={"sakstilknyttningpanel"} ref={sakstilknytningPanelRef} id={"sakstilknytningpanel"}>
            <Heading size="medium" className={"title"}>
                Tilknyttet sak
            </Heading>
            {isLoading ? (
                <Loader />
            ) : (
                <SakstilknytningTable
                    columns={columns}
                    createRow={createRow}
                    saker={sakerToRender}
                    onNySakButtonClicked={isSakInEditMode ? openModal : undefined}
                />
            )}
            {sakWitLimitedAccess && (
                <NoAccessModal
                    alertContent={
                        <div>
                            Du har ingen tilgang til å tilknytte journalpost til sak {sakWitLimitedAccess.saksnummer}
                        </div>
                    }
                    onCancel={closeSakNoAccessModal}
                />
            )}
            <OpprettSakModal
                isOpen={isOpenModal}
                ident={person.ident}
                navn={person.visningsnavn}
                eierfogd={påloggetEnhet}
                onSubmit={addNySak}
                onClose={() => setIsOpenModal(false)}
            />
        </div>
    );
}
