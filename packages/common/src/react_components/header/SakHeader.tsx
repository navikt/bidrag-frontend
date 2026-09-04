import { Rolletype, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { ArrowsCirclepathIcon, ChevronDownIcon, ChevronUpIcon, ExclamationmarkTriangleIcon } from "@navikt/aksel-icons";
import { Box, CopyButton } from "@navikt/ds-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHentFodselsdatoer } from "../../api/useApiData";
import type { IRolleDetaljer } from "../../types/roller/IRolleDetaljer";
import { RolleTypeAbbreviation, RolleTypeFullName } from "../../types/roller/RolleType";
import { ExpandedRoles, type HeaderRolle, type SaksnummerRoller } from "./ExpandedRoles";

type TypeBehandling = string;

interface ISkjermbildeDetaljer {
    navn: string;
    referanse: string | number;
}

/** New props for full featured header */
interface ISakHeaderNewProps {
    rollerMedPersonNavn: HeaderRolle[];
    type: TypeBehandling;
    selectedSaksnummer?: string;
    setSelectedSaksnummer: (saksnummer: string | undefined) => void;
    setSelectedRoller: (roller: HeaderRolle[]) => void;
    HeaderTittel: React.ComponentType<{ type: TypeBehandling; style?: React.CSSProperties }>;
    /** Saksnummer som har minst én valideringsfeil - fanen markeres da med et varselikon. */
    saksnummerMedValideringsfeil?: Set<string>;
    /** Saksnummer som har nye opplysninger (ikke-aktiverte endringer) - fanen markeres da med et oppdateringsikon. */
    saksnummerMedNyeOpplysninger?: Set<string>;
}

/** Legacy props for backwards compatibility */
interface ISakHeaderLegacyProps {
    saksnummer: string;
    roller: IRolleDetaljer[];
    skjermbilde?: ISkjermbildeDetaljer;
}

type ISakHeaderProps = ISakHeaderNewProps | ISakHeaderLegacyProps;

// Styles
const TAB_CONTAINER_STYLE: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.5rem 1rem",
};

const TAB_BUTTON_STYLE: React.CSSProperties = {
    background: "transparent",
    border: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
};

const COPY_BUTTON_STYLE: React.CSSProperties = {
    borderRadius: 0,
    border: 0,
    background: "transparent",
    boxShadow: "none",
};

const CHEVRON_BUTTON_STYLE: React.CSSProperties = {
    background: "transparent",
    border: 0,
    cursor: "pointer",
};

// Helpers

const BARN_ROLLETYPER = new Set<string>([RolleTypeAbbreviation.BA, RolleTypeFullName.BARN]);

const getRolleSortWeight = (rolle: HeaderRolle) => {
    if (rolle.rolletype === Rolletype.BM) {
        return 0;
    }
    if (rolle.rolletype === Rolletype.BP) {
        return 1;
    }
    return rolle.erRevurdering ? 3 : 2;
};
/**
 * Sorterer roller innad i en sak: BM først, deretter BP, så barn (BA) sortert etter alder
 * (eldst først). Roller uten kjent sorteringsvekt havner sist, i opprinnelig rekkefølge.
 */
const compareRoller = (a: HeaderRolle, b: HeaderRolle) => {
    const weightDiff = getRolleSortWeight(a) - getRolleSortWeight(b);
    if (weightDiff !== 0) {
        return weightDiff;
    }

    if (
        a.rolletype !== Rolletype.BM &&
        a.rolletype !== Rolletype.BP &&
        b.rolletype !== Rolletype.BM &&
        b.rolletype !== Rolletype.BP
    ) {
        const alderA = a.fødselsdato ? new Date(a.fødselsdato).getTime() : Number.POSITIVE_INFINITY;
        const alderB = b.fødselsdato ? new Date(b.fødselsdato).getTime() : Number.POSITIVE_INFINITY;
        if (alderA !== alderB) {
            return alderA - alderB;
        }
    }

    return a.id - b.id;
};

const mapSaksnummerRoller = (roller: HeaderRolle[]): SaksnummerRoller[] => {
    const saksnummerOrder = Array.from(new Set(roller.map((rolle) => rolle.saksnummer)));

    return saksnummerOrder
        .filter((s): s is string => s !== undefined)
        .map((saksnummer) => {
            const rollerISak = roller
                .filter((rolle) => rolle.saksnummer === saksnummer || rolle.rolletype === Rolletype.BP)
                .sort((a, b) => compareRoller(a, b));
            return {
                saksnummer,
                roller: rollerISak,
            };
        });
};

// Sub-components
interface SaksnummerTabProps {
    item: SaksnummerRoller;
    isSelected: boolean;
    isExpanded: boolean;
    harFlereSaksnummer: boolean;
    harValideringsfeil: boolean;
    harNyeOpplysninger: boolean;
    onSelect: (saksnummer: string) => void;
    onToggleExpand: (saksnummer: string) => void;
}

const SaksnummerTab = ({
    item,
    isSelected,
    isExpanded,
    harFlereSaksnummer,
    harValideringsfeil,
    harNyeOpplysninger,
    onSelect,
    onToggleExpand,
}: SaksnummerTabProps) => {
    const backgroundColor = isSelected ? "var(--ax-bg-default)" : "var(--ax-bg-neutral-soft)";
    const textColor = isSelected ? "var(--ax-text-default)" : "var(--ax-text-accent-subtle)";
    const fontWeight = isSelected ? 600 : 400;

    const containerStyle: React.CSSProperties = {
        ...TAB_CONTAINER_STYLE,
        position: "relative",
        background: backgroundColor,
        marginBottom: isSelected ? "-1px" : "0",
        borderBottom: isSelected ? "1px solid var(--ax-bg-default)" : "1px solid transparent",
    };

    return (
        <Box key={item.saksnummer} style={containerStyle}>
            <button
                type="button"
                disabled={!harFlereSaksnummer}
                onClick={() => onSelect(item.saksnummer)}
                style={{
                    ...TAB_BUTTON_STYLE,
                    color: textColor,
                    fontWeight,
                    cursor: harFlereSaksnummer ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                }}
            >
                {harValideringsfeil && (
                    <ExclamationmarkTriangleIcon
                        title="Saken har valideringsfeil"
                        // style={{ color: "var(--ax-text-danger)" }}
                    />
                )}
                {harNyeOpplysninger && <ArrowsCirclepathIcon title="Saken har nye opplysninger" />}
                Saksnr {item.saksnummer}
            </button>
            <CopyButton size="small" copyText={item.saksnummer} title="Kopier saksnummer" style={COPY_BUTTON_STYLE} />
            {isSelected && (
                <button type="button" onClick={() => onToggleExpand(item.saksnummer)} style={CHEVRON_BUTTON_STYLE}>
                    {isExpanded ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
                </button>
            )}
            {isSelected && (
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "0.5rem",
                        right: "0.5rem",
                        bottom: "-2px",
                        height: "3px",
                        borderRadius: "999px",
                        background: "var(--ax-bg-success-strong)",
                    }}
                />
            )}
        </Box>
    );
};

const useAktivtSaksnummer = (
    saksnummerRoller: SaksnummerRoller[],
    harFlereSaksnummer: boolean,
    selectedSaksnummer: string | undefined,
) => {
    return useMemo(() => {
        const første = saksnummerRoller[0];
        if (!første) return undefined;
        if (!harFlereSaksnummer) return første.saksnummer;
        if (selectedSaksnummer && saksnummerRoller.some((item) => item.saksnummer === selectedSaksnummer)) {
            return selectedSaksnummer;
        }
        return første.saksnummer;
    }, [saksnummerRoller, harFlereSaksnummer, selectedSaksnummer]);
};

const rolleSignatur = (roller: HeaderRolle[]) =>
    roller
        .map((rolle) => rolle.id)
        .sort()
        .join(",");

const useSyncAktivtSaksnummerToState = (
    aktivSaksnummerRoller: SaksnummerRoller | undefined,
    saksnummerRoller: SaksnummerRoller[],
    harFlereSaksnummer: boolean,
    setSelectedSaksnummer: (saksnummer: string | undefined) => void,
    setSelectedRoller: (roller: HeaderRolle[]) => void,
    expandedSaksnummer: string | undefined,
    setExpandedSaksnummer: (saksnummer: string | undefined) => void,
) => {
    const initialExpandRef = useRef(true);
    // `aktivSaksnummerRoller` kan få en ny objekt-/array-referanse på hver render selv om det
    // faktiske innholdet er uendret (f.eks. fordi `useSuspenseQueries` i behandling-app returnerer
    // et nytt array hver gang, uavhengig av om dataene faktisk har endret seg). Uten denne
    // innholds-sjekken vil effekten kalle `setSelectedRoller` på hver render, som trigger et nytt
    // render av forelderen, som gir en ny referanse igjen -> uendelig løkke ("Maximum update depth").
    const sisteRolleSignatur = useRef<string | undefined>(undefined);
    const sisteSaksnummer = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!aktivSaksnummerRoller) {
            if (sisteRolleSignatur.current !== "") {
                setSelectedSaksnummer(undefined);
                setSelectedRoller([]);
                setExpandedSaksnummer(undefined);
                sisteRolleSignatur.current = "";
                sisteSaksnummer.current = undefined;
            }
            initialExpandRef.current = true;
            return;
        }

        const førsteSaksnummer = saksnummerRoller[0]?.saksnummer;
        const saksnummerSomSkalBrukes = harFlereSaksnummer ? aktivSaksnummerRoller.saksnummer : førsteSaksnummer;
        const nyRolleSignatur = rolleSignatur(aktivSaksnummerRoller.roller);

        if (sisteSaksnummer.current !== saksnummerSomSkalBrukes) {
            setSelectedSaksnummer(saksnummerSomSkalBrukes);
            // Når `saksnummerSomSkalBrukes` endres eksternt (f.eks. fra `BarnebidragSideMenu` etter
            // klikk på en feilmelding som gjelder en rolle i en annen sak), må selve
            // tab-visningen (`expandedSaksnummer`) også følge med - ellers vises fortsatt forrige
            // sak som "aktiv" i SakHeader selv om `selectedSaksnummer` faktisk har byttet.
            setExpandedSaksnummer(saksnummerSomSkalBrukes);
            sisteSaksnummer.current = saksnummerSomSkalBrukes;
        }
        if (sisteRolleSignatur.current !== nyRolleSignatur) {
            setSelectedRoller(aktivSaksnummerRoller.roller);
            sisteRolleSignatur.current = nyRolleSignatur;
        }

        // Auto-expand only on first data load
        if (initialExpandRef.current) {
            if (!expandedSaksnummer) {
                setExpandedSaksnummer(saksnummerSomSkalBrukes);
            }
            initialExpandRef.current = false;
            return;
        }

        // If expanded saksnummer no longer exists, reset to active
        if (expandedSaksnummer) {
            const stillExists = saksnummerRoller.some((item) => item.saksnummer === expandedSaksnummer);
            if (!stillExists) {
                setExpandedSaksnummer(saksnummerSomSkalBrukes);
            }
        }
    }, [
        aktivSaksnummerRoller,
        harFlereSaksnummer,
        saksnummerRoller,
        expandedSaksnummer,
        setSelectedSaksnummer,
        setSelectedRoller,
        setExpandedSaksnummer,
    ]);
};

export default function SakHeader(props: ISakHeaderProps) {
    // Detect if using legacy props
    const isLegacy = "saksnummer" in props;

    if (isLegacy) {
        const legacyProps = props as ISakHeaderLegacyProps;
        // Transform legacy props (IRolleDetaljer, brukt av apps/web sitt PDL-baserte rolleoppslag)
        // til RolleDto-baserte HeaderRolle som resten av komponenten forventer.
        const transformedProps: ISakHeaderNewProps = {
            rollerMedPersonNavn: legacyProps.roller.map(
                (r): HeaderRolle => ({
                    id: r.id ?? 0,
                    rolletype: r.rolleType as unknown as Rolletype,
                    ident: r.ident,
                    navn: r.navn,
                    visningsnavn: r.navn,
                    fødselsdato: null,
                    erRevurdering: false,
                    stønadstype: r.stønad18År ? Stonadstype.BIDRAG18AAR : undefined,
                    saksnummer: r.saksnummer ?? legacyProps.saksnummer,
                    søknader: [],
                }),
            ),
            type: "Saksnummer",
            selectedSaksnummer: undefined,
            setSelectedSaksnummer: () => {},
            setSelectedRoller: () => {},
            HeaderTittel: ({ style }) => <div style={style}>{legacyProps.skjermbilde?.navn}</div>,
        };
        return <HeaderRenderer {...transformedProps} />;
    }

    // Use new props directly
    const newProps = props as ISakHeaderNewProps;
    return <HeaderRenderer {...newProps} />;
}

interface HeaderRendererProps extends ISakHeaderNewProps {}

function HeaderRenderer({
    rollerMedPersonNavn,
    type,
    selectedSaksnummer,
    setSelectedSaksnummer,
    setSelectedRoller,
    HeaderTittel,
    saksnummerMedValideringsfeil,
    saksnummerMedNyeOpplysninger,
}: HeaderRendererProps) {
    // Henter fødselsdatoer for barnerollene fra BIDRAG_PERSON, slik at sorteringen under kan
    // bruke reell alder i stedet for å parse fødselsnummeret. Faller tilbake til ident-parsing
    // (se `hentAlder`) mens kallet laster eller dersom det feiler, så sorteringen aldri stopper opp.
    const barnIdenter = useMemo(
        () =>
            Array.from(
                new Set(
                    rollerMedPersonNavn
                        .filter((rolle) => BARN_ROLLETYPER.has(rolle.rolletype))
                        .map((rolle) => rolle.ident)
                        .filter((ident): ident is string => Boolean(ident)),
                ),
            ),
        [rollerMedPersonNavn],
    );
    const { data: fodselsdatoer } = useHentFodselsdatoer(barnIdenter);

    // Calculate grouped saksnummer
    const saksnummerRoller = useMemo(
        () => mapSaksnummerRoller(rollerMedPersonNavn),
        [rollerMedPersonNavn, fodselsdatoer],
    );
    const harFlereSaksnummer = saksnummerRoller.length > 1;

    // Determine active saksnummer based on availability and selection
    const aktivtSaksnummer = useAktivtSaksnummer(saksnummerRoller, harFlereSaksnummer, selectedSaksnummer);

    // Track which saksnummer is expanded
    const [expandedSaksnummer, setExpandedSaksnummer] = useState<string | undefined>(aktivtSaksnummer);

    // Find the active and expanded data
    const aktivSaksnummerRoller = useMemo(
        () => saksnummerRoller.find((item) => item.saksnummer === aktivtSaksnummer),
        [saksnummerRoller, aktivtSaksnummer],
    );
    const expandedSaksnummerRoller = useMemo(
        () => saksnummerRoller.find((item) => item.saksnummer === expandedSaksnummer),
        [saksnummerRoller, expandedSaksnummer],
    );

    // Sync active saksnummer changes to parent state
    useSyncAktivtSaksnummerToState(
        aktivSaksnummerRoller,
        saksnummerRoller,
        harFlereSaksnummer,
        setSelectedSaksnummer,
        setSelectedRoller,
        expandedSaksnummer,
        setExpandedSaksnummer,
    );

    // Handle saksnummer selection
    const onSelectSaksnummer = useCallback(
        (saksnummer: string) => {
            if (!harFlereSaksnummer) return;

            const target = saksnummerRoller.find((item) => item.saksnummer === saksnummer);
            if (!target) return;

            setSelectedSaksnummer(saksnummer);
            setSelectedRoller(target.roller);
            setExpandedSaksnummer(saksnummer);
        },
        [harFlereSaksnummer, saksnummerRoller, setSelectedSaksnummer, setSelectedRoller],
    );

    // Handle expanding/collapsing the details panel
    const onToggleExpanded = useCallback(
        (saksnummer: string) => {
            const exists = saksnummerRoller.some((item) => item.saksnummer === saksnummer);
            if (!exists) return;

            setExpandedSaksnummer((current) => (current === saksnummer ? undefined : saksnummer));
        },
        [saksnummerRoller],
    );

    return (
        <div>
            <Box
                style={{
                    background: "var(--ax-bg-neutral-soft)",
                    borderBottom: "1px solid var(--ax-border-neutral-subtle)",
                }}
            >
                {/* Title and tabs */}
                <Box>
                    <Box
                        style={{
                            display: "flex",
                            padding: "0rem 1rem",
                            background: "var(--ax-bg-neutral-soft)",
                        }}
                    >
                        <Box
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flexShrink: 0,
                                padding: "0.5rem 1.5rem 0.5rem 0",
                            }}
                        >
                            <HeaderTittel
                                type={type}
                                style={{ color: "var(--ax-bg-brand-beige-strong)", whiteSpace: "nowrap" }}
                            />
                        </Box>

                        <Box style={{ display: "flex", minWidth: 0 }}>
                            {saksnummerRoller.map((item) => (
                                <SaksnummerTab
                                    key={item.saksnummer}
                                    item={item}
                                    isSelected={aktivtSaksnummer === item.saksnummer}
                                    isExpanded={expandedSaksnummer === item.saksnummer}
                                    harFlereSaksnummer={harFlereSaksnummer}
                                    harValideringsfeil={saksnummerMedValideringsfeil?.has(item.saksnummer) ?? false}
                                    harNyeOpplysninger={saksnummerMedNyeOpplysninger?.has(item.saksnummer) ?? false}
                                    onSelect={onSelectSaksnummer}
                                    onToggleExpand={onToggleExpanded}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Expanded roles panel */}
                    <ExpandedRoles saksnummerRoller={expandedSaksnummerRoller} />
                </Box>
            </Box>
        </div>
    );
}
