import { Heading, Loader } from "@navikt/ds-react";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useHentSakerPerson } from "../../../hooks/useSakApi";
import SelectSakCheckbox from "../../../pages/registrereJournalpost/components/sakstilknytning/SelectSakCheckbox";
import {
    createNySak,
    KategoriNavnDisplayValue,
    NY_SAK_SAKSNUMMER,
    type Sak,
    SakStatusDisplayValue,
} from "../../../types/sak";
import RolleTag from "../person/RolleTag";
import SakTableMotsattRolle from "../SakTableMotsattRolle";
import SakstilknytningTable from "../table/SakstilknytningTable";
import type { ColumnData, RowData } from "../table/Table";

const columns: ColumnData[] = [{ label: "" }, { label: "Sak" }, { label: "Motpart" }, { label: "Enhet" }];

const isNySak = (sak: Sak) => sak.saksnummer === NY_SAK_SAKSNUMMER;

interface SakstabellProps {
    title?: string;
    initialValue?: string[];
    titleSize?: "xlarge" | "large" | "medium" | "small" | "xsmall";
    onChange: (saker: string[]) => void;
}
export default function Sakstabell({ initialValue = [], title, titleSize, onChange }: SakstabellProps): ReactElement {
    const { saker, isLoading } = useHentSakerPerson();

    const [sakerToRender, setSakerToRender] = useState<Sak[]>([]);
    const [sakerToBeRegisterWithJournal, setSakerToBeRegisterWithJournal] = useState<string[]>(initialValue);
    const sakstilknytningPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (saker) {
            setSakerToRender(saker);
        }
        initWithInitialValue();
    }, [saker]);

    function initWithInitialValue() {
        setSakerToBeRegisterWithJournal(initialValue.filter((p) => p !== NY_SAK_SAKSNUMMER));
        if (initialValue.includes(NY_SAK_SAKSNUMMER)) {
            addNySakCheckbox();
        }
    }

    useEffect(() => {
        onChange(sakerToBeRegisterWithJournal);
    }, [sakerToBeRegisterWithJournal]);

    const removeNySak = () => setSakerToRender((prevSakState) => prevSakState.filter((sak) => !isNySak(sak)));

    function toggleSelectedItemToTilknyttetSakForRegistrering(saksnummerToAdd: string) {
        if (saksnummerToAdd === NY_SAK_SAKSNUMMER) {
            removeNySak();
        }

        setSakerToBeRegisterWithJournal((prevState) => {
            const isSelected = prevState.some((sak) => sak === saksnummerToAdd);
            if (!isSelected) {
                return [...prevState, saksnummerToAdd];
            } else {
                return prevState.filter((sakId) => sakId !== saksnummerToAdd);
            }
        });
    }

    function addNySakCheckbox() {
        toggleSelectedItemToTilknyttetSakForRegistrering(NY_SAK_SAKSNUMMER);
        const nySak = createNySak();
        setSakerToRender((prevSakState) => [...prevSakState, nySak]);
    }

    function createRow(sak: Sak): RowData {
        const isSelected = sakerToBeRegisterWithJournal.some(
            (sakID) => sakID.toUpperCase() === sak.saksnummer.toUpperCase(),
        );
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
                                <span className="flex flex-row">
                                    <p>{sak.saksnummer}</p>
                                    <RolleTag rolleType={sak.rolle?.rolleType} />
                                </span>
                            )}
                            <p>{KategoriNavnDisplayValue[sak.kategori]}</p>
                            <p>{SakStatusDisplayValue[sak.saksstatus]}</p>
                        </>
                    ),
                },
                {
                    content: <SakTableMotsattRolle sak={sak} />,
                },
                {
                    content: (
                        <>
                            <div>{sak.eierfogd}</div>
                            <div>{sak.enhetInformasjon ?? "Fant ikke enhetsnavn"}</div>
                        </>
                    ),
                },
            ],
            "aria-selected": isSelected,
        };
    }

    return (
        <div className={"sakstilknyttningpanel"} ref={sakstilknytningPanelRef} id={"sakstilknytningpanel"}>
            <Heading size={titleSize ?? "medium"}>{title ? title : "Sakstilknytning"}</Heading>
            {isLoading ? (
                <Loader />
            ) : (
                <SakstilknytningTable
                    columns={columns}
                    createRow={createRow}
                    saker={sakerToRender}
                    onNySakButtonClicked={addNySakCheckbox}
                />
            )}
        </div>
    );
}
