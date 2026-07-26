import { ChevronDownIcon, ChevronUpIcon } from "@navikt/aksel-icons";
import { Bleed, Box, CopyButton } from "@navikt/ds-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { IRolleDetaljer } from "../../types/roller/IRolleDetaljer";
import RolleCard from "../roller/RolleCard";

type TypeBehandling = string;
type HeaderRolle = IRolleDetaljer & { visningsnavn?: string };

interface ISkjermbildeDetaljer {
    navn: string;
    referanse: string | number;
}

type SaksnummerRoller = {
    saksnummer: string;
    roller: IRolleDetaljer[];
};

/** New props for full featured header */
interface ISakHeaderNewProps {
    rollerMedPersonNavn: HeaderRolle[];
    type: TypeBehandling;
    selectedSaksnummer?: string;
    setSelectedSaksnummer: (saksnummer: string | undefined) => void;
    setSelectedRoller: (roller: IRolleDetaljer[]) => void;
    HeaderTittel: React.ComponentType<{ type: TypeBehandling; style?: React.CSSProperties }>;
}

/** Legacy props for backwards compatibility */
interface ISakHeaderLegacyProps {
    saksnummer: string;
    roller: IRolleDetaljer[];
    skjermbilde?: ISkjermbildeDetaljer;
}

type ISakHeaderProps = ISakHeaderNewProps | ISakHeaderLegacyProps;

// Constants
const FLASH_ANIMATION_DURATION = 800;

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

const ROLE_CARD_CONTAINER_STYLE: React.CSSProperties = {
    border: "1px solid var(--ax-border-neutral-subtle)",
    borderRadius: "0.375rem",
    background: "var(--ax-bg-default)",
    margin: "0.125rem 0.375rem",
};

// Helpers
const mapSaksnummerRoller = (roller: HeaderRolle[]): SaksnummerRoller[] => {
    const saksnummerOrder = Array.from(new Set(roller.map((rolle) => rolle.saksnummer)));

    return saksnummerOrder
        .filter((s): s is string => s !== undefined)
        .map((saksnummer) => {
            const rollerISak = roller.filter((rolle) => rolle.saksnummer === saksnummer);
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
    isFlashing: boolean;
    harFlereSaksnummer: boolean;
    onSelect: (saksnummer: string) => void;
    onToggleExpand: (saksnummer: string) => void;
}

const SaksnummerTab = ({
    item,
    isSelected,
    isExpanded,
    isFlashing,
    harFlereSaksnummer,
    onSelect,
    onToggleExpand,
}: SaksnummerTabProps) => {
    const backgroundColor = isSelected ? "var(--ax-bg-default)" : "var(--ax-bg-neutral-soft)";
    const textColor = isSelected ? "var(--ax-text-default)" : "var(--ax-text-accent-subtle)";
    const fontWeight = isSelected ? 600 : 400;

    const containerStyle: React.CSSProperties = {
        ...TAB_CONTAINER_STYLE,
        background: backgroundColor,
        marginBottom: isSelected ? "-1px" : "0",
        borderBottom: isSelected ? "1px solid var(--ax-bg-default)" : "1px solid transparent",
        ...(isFlashing && {
            animation: "saksnummerFlash 0.8s ease-out forwards",
        }),
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
                }}
            >
                Saksnr {item.saksnummer}
            </button>
            <CopyButton size="small" copyText={item.saksnummer} title="Kopier saksnummer" style={COPY_BUTTON_STYLE} />
            {isSelected && (
                <button type="button" onClick={() => onToggleExpand(item.saksnummer)} style={CHEVRON_BUTTON_STYLE}>
                    {isExpanded ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
                </button>
            )}
        </Box>
    );
};

interface ExpandedRolesProps {
    saksnummerRoller: SaksnummerRoller | undefined;
}

const ExpandedRoles = ({ saksnummerRoller }: ExpandedRolesProps) => {
    if (!saksnummerRoller) return null;

    return (
        <Box
            style={{
                padding: "0.75rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                background: "white",
            }}
            shadow="dialog"
        >
            {saksnummerRoller.roller.map((rolle) => (
                <Box key={rolle.id} style={ROLE_CARD_CONTAINER_STYLE}>
                    <RolleCard rolle={rolle} />
                </Box>
            ))}
        </Box>
    );
};

// Custom Hooks
const useFlashAnimation = (aktivtSaksnummer: string | undefined) => {
    const prevSaksnummerRef = useRef<string | undefined>(aktivtSaksnummer);
    const [flashingSaksnummer, setFlashingSaksnummer] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (prevSaksnummerRef.current !== aktivtSaksnummer && aktivtSaksnummer) {
            setFlashingSaksnummer(aktivtSaksnummer);
            const timer = setTimeout(() => setFlashingSaksnummer(undefined), FLASH_ANIMATION_DURATION);
            prevSaksnummerRef.current = aktivtSaksnummer;
            return () => clearTimeout(timer);
        }
        prevSaksnummerRef.current = aktivtSaksnummer;
    }, [aktivtSaksnummer]);

    return flashingSaksnummer;
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

const useSyncAktivtSaksnummerToState = (
    aktivSaksnummerRoller: SaksnummerRoller | undefined,
    saksnummerRoller: SaksnummerRoller[],
    harFlereSaksnummer: boolean,
    setSelectedSaksnummer: (saksnummer: string | undefined) => void,
    setSelectedRoller: (roller: IRolleDetaljer[]) => void,
    expandedSaksnummer: string | undefined,
    setExpandedSaksnummer: (saksnummer: string | undefined) => void,
) => {
    const initialExpandRef = useRef(true);

    useEffect(() => {
        if (!aktivSaksnummerRoller) {
            setSelectedSaksnummer(undefined);
            setSelectedRoller([]);
            setExpandedSaksnummer(undefined);
            initialExpandRef.current = true;
            return;
        }

        const førsteSaksnummer = saksnummerRoller[0]?.saksnummer;
        const saksnummerSomSkalBrukes = harFlereSaksnummer ? aktivSaksnummerRoller.saksnummer : førsteSaksnummer;

        setSelectedSaksnummer(saksnummerSomSkalBrukes);
        setSelectedRoller(aktivSaksnummerRoller.roller);

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
        // Transform legacy props to new format
        const transformedProps: ISakHeaderNewProps = {
            rollerMedPersonNavn: legacyProps.roller.map((r) => ({
                ...r,
                saksnummer: legacyProps.saksnummer,
            })),
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
}: HeaderRendererProps) {
    // Calculate grouped saksnummer
    const saksnummerRoller = useMemo(() => mapSaksnummerRoller(rollerMedPersonNavn), [rollerMedPersonNavn]);
    const harFlereSaksnummer = saksnummerRoller.length > 1;

    // Determine active saksnummer based on availability and selection
    const aktivtSaksnummer = useAktivtSaksnummer(saksnummerRoller, harFlereSaksnummer, selectedSaksnummer);

    // Flash effect when active saksnummer changes
    const flashingSaksnummer = useFlashAnimation(aktivtSaksnummer);

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
        <Bleed marginInline="full">
            <Box
                style={{
                    background: "var(--ax-bg-neutral-soft)",
                    borderBottom: "1px solid var(--ax-border-neutral-subtle)",
                }}
            >
                <style>{`
                @keyframes saksnummerFlash {
                    0%   { box-shadow: 0 0 0 3px var(--ax-border-accent, #0067c5); }
                    100% { box-shadow: 0 0 0 0px transparent; }
                }
            `}</style>

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
                                    isFlashing={flashingSaksnummer === item.saksnummer}
                                    harFlereSaksnummer={harFlereSaksnummer}
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
        </Bleed>
    );
}
