import { OpprettSakModal } from "@bidrag/behandling";
import { Heading, Loader } from "@navikt/ds-react";
import React, { type ReactElement, useEffect, useRef, useState } from "react";
import useRegisterField from "../../../../common/components/form/hooks/useRegisterField";
import RolleTag from "../../../../common/components/person/RolleTag";
import SakTableMotsattRolle from "../../../../common/components/SakTableMotsattRolle";
import SakstilknytningTable from "../../../../common/components/table/SakstilknytningTable";
import type { ColumnData, RowData } from "../../../../common/components/table/Table";
import { useHentGjelder } from "../../../../servicesV2/usePersonApi";
import { useHentSakerPerson, useRefreshSakerPersonQuery } from "../../../../servicesV2/useSakApi";
import { useAppContext } from "../../../../store/AppContext";
import { KategoriNavnDisplayValue, type Sak, SakStatusDisplayValue } from "../../../../types/sak";
import type { JournalpostToRegister } from "../types/JournalpostToRegister";
import OverforSakButton from "./OverforSakButton";
import SelectSakCheckbox from "./SelectSakCheckbox";

const columns: ColumnData[] = [
    { label: "" },
    { label: "Sak" },
    { label: "Motpart" },
    { label: "Enhet" },
    { label: "" },
];

export default function SakstilknyttningPanel(): ReactElement {
    const { saker, isLoading } = useHentSakerPerson();
    const {
        appState: { påloggetEnhet },
    } = useAppContext();
    const person = useHentGjelder();
    const refreshSakerPerson = useRefreshSakerPersonQuery();

    const [sakerToRender, setSakerToRender] = useState<Sak[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [sakerToBeRegisterWithJournal, setSakerToBeRegisterWithJournal] = useState<string[]>([]);
    const [isOprettSakModalOpen, setIsOprettSakModalOpen] = useState<boolean>(false);

    const sakstilknytningPanelRef = useRef<HTMLDivElement>(null);

    const { error, onUpdate } = useRegisterField<JournalpostToRegister>(
        "tilknyttSaker",
        { required: "Du må velge eller opprette ny sak" },
        () => sakstilknytningPanelRef.current,
    );

    useEffect(() => {
        if (saker) {
            setSakerToRender(saker);
        }
    }, [saker]);

    useEffect(() => {
        onUpdate(sakerToBeRegisterWithJournal);
    }, [sakerToBeRegisterWithJournal]);

    function toggleSelectedItemToTilknyttetSakForRegistrering(saksnummerToAdd: string) {
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
        refreshSakerPerson().then(() => {
            toggleSelectedItemToTilknyttetSakForRegistrering(saksnummer);
        });
    }

    function createRow(sak: Sak): RowData {
        const isSelected = sakerToBeRegisterWithJournal.some(
            (sakID) => sakID.toUpperCase() === sak.saksnummer.toUpperCase(),
        );

        const isAnnenEnhet = sak.eierfogd !== påloggetEnhet;
        return {
            components: [
                {
                    content: (
                        <SelectSakCheckbox
                            sak={sak}
                            isSelected={isSelected}
                            onChecked={() => toggleSelectedItemToTilknyttetSakForRegistrering(sak.saksnummer)}
                        />
                    ),
                    className: "row-checbox",
                    width: "1",
                },
                {
                    content: (
                        <>
                            {sak.saksnummer && (
                                <span className="inline [&__p]:inline">
                                    {/* [&__p]:inline */}
                                    <p className="inline">{sak.saksnummer}</p>
                                    <RolleTag rolleType={sak.rolle?.rolleType} />
                                </span>
                            )}
                            <p> {KategoriNavnDisplayValue[sak.kategori]}</p>
                            <p>{SakStatusDisplayValue[sak.saksstatus]}</p>
                        </>
                    ),
                },
                {
                    content: <SakTableMotsattRolle sak={sak} />,
                },
                {
                    content: (
                        <div>
                            <div>{sak.eierfogd}</div>
                            <div>{sak.enhetInformasjon ?? "Fant ikke enhetsnavn"}</div>
                        </div>
                    ),
                },
                {
                    content: isAnnenEnhet && <OverforSakButton sak={sak} onModalStateChange={setIsModalOpen} />,
                    width: "1",
                },
            ],
            isSelected: isSelected,
        };
    }

    return (
        <div className={"sakstilknyttningpanel"} ref={sakstilknytningPanelRef} id={"sakstilknytningpanel"}>
            <Heading size="medium" className={"title"}>
                Sakstilknytning
            </Heading>
            {isLoading && !isModalOpen ? (
                <Loader />
            ) : (
                <SakstilknytningTable
                    columns={columns}
                    createRow={createRow}
                    saker={sakerToRender}
                    errorMessage={error?.message}
                    onNySakButtonClicked={() => setIsOprettSakModalOpen(true)}
                />
            )}
            <OpprettSakModal
                isOpen={isOprettSakModalOpen}
                ident={person.ident}
                navn={person.visningsnavn}
                eierfogd={påloggetEnhet}
                onSubmit={addNySak}
                onClose={() => {
                    setIsOprettSakModalOpen(false);
                }}
            />
        </div>
    );
}
