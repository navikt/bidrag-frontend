import { type EndringsLoggDto, type EndringsloggTilhorerSkjermbilde, Endringstype } from "@bidrag/api/BidragAdminApi";
import { dateToDDMMYYYYString } from "@bidrag/common";
import { BellDotFillIcon, BellIcon } from "@navikt/aksel-icons";
import {
    ActionMenu,
    BodyLong,
    Button,
    ErrorMessage,
    Heading,
    InternalHeader,
    Label,
    Loader,
    Modal,
    Pagination,
    Tag,
    VStack,
} from "@navikt/ds-react";
import React, { useEffect, useState } from "react";
import {
    useGetEndringsloggForBruker,
    useLestAvBrukerEndring,
    useLestAvBrukerEndringslogg,
} from "./api/endringsloggApi.ts";

const EndringstypeToTagMapper = {
    [Endringstype.ENDRING]: { tag: "neutral" as const, tekst: "Endring" },
    [Endringstype.NYHET]: { tag: "info" as const, tekst: "Nyhet" },
    [Endringstype.FEILFIKS]: { tag: "success" as const, tekst: "Feilfiks" },
};

export function EndringsloggHeader({ skjermbilde }: { skjermbilde?: EndringsloggTilhorerSkjermbilde }) {
    const endringslogg = useGetEndringsloggForBruker(skjermbilde);
    const [selected, setSelected] = useState<EndringsLoggDto | null>(null);
    const [påkrevdUlestEndringer, setPåkrevdUlestEndringer] = useState<EndringsLoggDto[]>([]);

    useEffect(() => {
        const ulestPåkrevd = endringslogg.data?.filter((e) => e.erPåkrevd && !e.erLestAvBruker) ?? [];
        setPåkrevdUlestEndringer(ulestPåkrevd);
    }, [endringslogg.data]);

    const hasSomeUnread = endringslogg.data?.some((e) => !e.erLestAvBruker) ?? false;
    const visEndringSomErUlestOgPåkrevd = påkrevdUlestEndringer[0];

    return (
        <>
            <ActionMenu>
                <ActionMenu.Trigger>
                    <InternalHeader.Button aria-label="Nyheter og endringer">
                        {hasSomeUnread ? (
                            <BellDotFillIcon title="Uleste nyheter" aria-hidden color="white" />
                        ) : (
                            <BellIcon title="Nyheter" aria-hidden color="white" />
                        )}
                    </InternalHeader.Button>
                </ActionMenu.Trigger>
                <ActionMenu.Content onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                    <ActionMenu.Group label="Nyheter" className="endringslogg-header">
                        {endringslogg.isLoading && <Loader size="medium" title="Venter..." />}
                        {endringslogg.isError && (
                            <ErrorMessage size="small" showIcon>
                                Feil ved henting av meldinger
                            </ErrorMessage>
                        )}
                        {endringslogg.isSuccess && endringslogg.data.length === 0 && (
                            <ActionMenu.Item>Ingen nyheter</ActionMenu.Item>
                        )}
                        {endringslogg.isSuccess && endringslogg.data.length > 0 && (
                            <EndringsLista
                                endringslogg={endringslogg.data}
                                onSelect={setSelected}
                                skjermbilde={skjermbilde}
                            />
                        )}
                    </ActionMenu.Group>
                </ActionMenu.Content>
            </ActionMenu>

            {selected && (
                <EndringsModal
                    open
                    onClose={() => setSelected(null)}
                    selectedEndringslogg={selected}
                    skjermbilde={skjermbilde}
                    closeOnBackdropClick
                />
            )}

            {visEndringSomErUlestOgPåkrevd && (
                <EndringsModal
                    key={visEndringSomErUlestOgPåkrevd.id}
                    open
                    onClose={() =>
                        setPåkrevdUlestEndringer((prev) =>
                            prev.filter((e) => e.id !== visEndringSomErUlestOgPåkrevd.id),
                        )
                    }
                    selectedEndringslogg={visEndringSomErUlestOgPåkrevd}
                    skjermbilde={skjermbilde}
                />
            )}
        </>
    );
}

const EndringsLista = ({
    endringslogg,
    onSelect,
    skjermbilde,
}: {
    endringslogg: EndringsLoggDto[];
    onSelect: (item: EndringsLoggDto) => void;
    skjermbilde?: EndringsloggTilhorerSkjermbilde;
}) => (
    <ActionMenu.Group
        aria-label="Endringslogg"
        className="grid gap-4"
        style={{ maxHeight: "30rem", overflowY: "scroll" }}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
    >
        {endringslogg.map((item, index) => (
            <MenuItem key={index} item={item} onSelect={onSelect} skjermbilde={skjermbilde} />
        ))}
    </ActionMenu.Group>
);

const MenuItem = ({
    item,
    onSelect,
    skjermbilde,
}: {
    item: EndringsLoggDto;
    onSelect: (item: EndringsLoggDto) => void;
    skjermbilde?: EndringsloggTilhorerSkjermbilde;
}) => {
    const mutation = useLestAvBrukerEndringslogg(skjermbilde);
    const ref = React.useRef<HTMLDivElement>(null);
    const hasMutated = React.useRef(false);

    React.useEffect(() => {
        if (item.endringer.length > 0) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !item.erLestAvBruker && !hasMutated.current) {
                    mutation.mutate(item.id);
                    hasMutated.current = true;
                }
            },
            { threshold: 1.0 },
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [item.erLestAvBruker, item.id]);

    return (
        <ActionMenu.Item ref={ref}>
            <VStack gap="space-2" className="py-2">
                <Label size="small">{dateToDDMMYYYYString(new Date(item.dato))}</Label>
                <Heading level="5" size="xsmall">
                    {item.tittel}
                </Heading>
                <BodyLong as="div" size="small">
                    <div dangerouslySetInnerHTML={{ __html: item.sammendrag }} />
                </BodyLong>
                {item.endringer.length > 0 && (
                    <Button
                        size="small"
                        type="button"
                        variant="secondary"
                        className="w-max"
                        onClick={() => onSelect(item)}
                    >
                        Se mer
                    </Button>
                )}
            </VStack>
        </ActionMenu.Item>
    );
};

const EndringsModal = ({
    open,
    onClose,
    selectedEndringslogg,
    skjermbilde,
    closeOnBackdropClick,
}: {
    open: boolean;
    onClose: () => void;
    selectedEndringslogg: EndringsLoggDto;
    closeOnBackdropClick?: boolean;
    skjermbilde?: EndringsloggTilhorerSkjermbilde;
}) => {
    const [pageState, setPageState] = useState(1);
    const [pageStartTime, setPageStartTime] = useState(Date.now());
    const mutation = useLestAvBrukerEndring(selectedEndringslogg.id, skjermbilde);

    useEffect(() => {
        setPageStartTime(Date.now());
    }, [pageState]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!open) return;
            let newPage = pageState;
            if (event.code === "Space" || event.code === "ArrowRight") {
                event.preventDefault();
                newPage = Math.min(pageState + 1, selectedEndringslogg.endringer.length);
            } else if (event.code === "ArrowLeft") {
                event.preventDefault();
                newPage = Math.max(pageState - 1, 1);
            }
            if (newPage !== pageState) onPageChange(newPage);
        };
        if (open) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, pageState, selectedEndringslogg.endringer.length]);

    const markEndringAsRead = (page: number) => {
        const endring = selectedEndringslogg.endringer[page - 1];
        if (endring && !endring.erLestAvBruker) {
            mutation.mutate({ endringId: endring.id, lesetidVarighet: Date.now() - pageStartTime });
        }
    };

    const onPageChange = (page: number) => {
        markEndringAsRead(pageState);
        setPageState(page);
    };

    const onBeforeClose = () => {
        if (pageState === selectedEndringslogg.endringer.length) {
            markEndringAsRead(pageState);
        }
        onClose();
    };

    const currentEndring = selectedEndringslogg.endringer[pageState - 1];
    if (!currentEndring) return null;

    return (
        <Modal
            open={open}
            onClose={onBeforeClose}
            header={{ heading: selectedEndringslogg.tittel }}
            closeOnBackdropClick={closeOnBackdropClick}
            style={{ maxWidth: "1500px" }}
        >
            <Modal.Body className="grid gap-4">
                <Heading size="xsmall" className="flex gap-2">
                    {currentEndring.tittel}{" "}
                    <Tag variant={EndringstypeToTagMapper[currentEndring.endringstype].tag} size="xsmall">
                        {EndringstypeToTagMapper[currentEndring.endringstype].tekst}
                    </Tag>
                </Heading>
                <BodyLong as="div" size="small">
                    <div
                        style={{ overflowWrap: "break-word", maxWidth: "70rem", minWidth: "38rem", maxHeight: "40rem" }}
                        dangerouslySetInnerHTML={{ __html: currentEndring.innhold }}
                    />
                </BodyLong>
            </Modal.Body>
            <Modal.Footer style={{ height: "4rem", justifyContent: "center" }}>
                {pageState === selectedEndringslogg.endringer.length && (
                    <Button variant="secondary-neutral" size="small" onClick={onBeforeClose}>
                        Ferdig
                    </Button>
                )}
                {selectedEndringslogg.endringer.length > 1 && (
                    <Pagination
                        page={pageState}
                        onPageChange={onPageChange}
                        count={selectedEndringslogg.endringer.length}
                        boundaryCount={1}
                        siblingCount={1}
                        size="xsmall"
                    />
                )}
            </Modal.Footer>
        </Modal>
    );
};
