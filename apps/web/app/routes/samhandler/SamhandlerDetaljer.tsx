import {SamhandlerDto} from "@bidrag/api/SamhandlerApi";
import {PencilIcon, XMarkIcon} from "@navikt/aksel-icons";
import {Alert, BodyLong, BodyShort, Box, Button, Heading, HGrid, Label, Loader, Tag, VStack} from "@navikt/ds-react";
import {memo, Suspense, useState} from "react";

import {
    kodeTilVisningsnavn,
    landkodeTilVisningsnavn,
    useHentSamhandlerDetaljer,
    useHentVisningsnavn,
    useOppdaterSamhandler,
} from "./utils/useApiData";
import {QueryErrorWrapper} from "./QueryErrorBoundary";
import SamhandlerForm from "./SamhandlerForm";
import {Samhandler} from "./SamhandlerSøk";
import type {Route} from "../../../.react-router/types/app/routes/samhandler/+types/SamhandlerDetaljer.ts"

type InfoRowProps = { label: string; value: React.ReactNode };

function InfoRow({label, value}: InfoRowProps) {
    return (
        <div>
            <Label size="small" className="text-ax-neutral-600 uppercase tracking-wide text-xs">
                {label}
            </Label>
            <BodyShort className="mt-0.5">{value}</BodyShort>
        </div>
    );
}

const SamhandlerDetaljerContent = memo(
    ({samhandler}: { samhandler: SamhandlerDto }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [samhandlerData, setSamhandlerData] = useState<SamhandlerDto>(samhandler);
        const oppdaterSamhandler = useOppdaterSamhandler();
        useHentVisningsnavn();

        const handleSamhandlerUpdated = (updatedSamhandler: Samhandler) => {
            setSamhandlerData(updatedSamhandler);
            setIsEditing(false);
        };

        return (
            <VStack gap="space-6">
                {!isEditing && (
                    <>
                        {/* Header card */}
                        <Box
                            background="default"
                            borderRadius="0 16 4"
                            borderWidth="1"
                            borderColor="accent-subtle"
                            padding="space-6"
                            shadow="dialog"
                        >
                            <div className="flex items-start justify-between flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Heading level="2" size="medium">
                                            {samhandlerData.navn}
                                        </Heading>
                                        {samhandlerData.erOpphørt && (
                                            <Tag variant="error" size="small">
                                                Opphørt
                                            </Tag>
                                        )}
                                    </div>
                                    <BodyShort size="small" className="text-ax-neutral-600 mt-1">
                                        ID: {samhandlerData.samhandlerId}
                                    </BodyShort>
                                </div>
                                <Button
                                    size="small"
                                    variant="secondary"
                                    icon={<PencilIcon aria-hidden/>}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Rediger
                                </Button>
                            </div>

                            <div className="border-t border-ax-neutral-300 mt-4 pt-4">
                                <HGrid gap="space-4" columns={{xs: 1, sm: 2, md: 3}}>
                                    {samhandlerData.områdekode && (
                                        <InfoRow
                                            label="Kreditortype"
                                            value={kodeTilVisningsnavn(samhandlerData.områdekode)}
                                        />
                                    )}
                                    {samhandlerData.offentligId && (
                                        <InfoRow label="Offentlig ID" value={samhandlerData.offentligId}/>
                                    )}
                                    {samhandlerData.offentligIdType && (
                                        <InfoRow
                                            label="ID-type"
                                            value={kodeTilVisningsnavn(samhandlerData.offentligIdType)}
                                        />
                                    )}
                                    {samhandlerData.språk && (
                                        <InfoRow label="Språk" value={kodeTilVisningsnavn(samhandlerData.språk)}/>
                                    )}
                                    {samhandlerData.kontaktperson && (
                                        <InfoRow label="Kontaktperson" value={samhandlerData.kontaktperson}/>
                                    )}
                                    {samhandlerData.kontaktTelefon && (
                                        <InfoRow label="Telefon" value={samhandlerData.kontaktTelefon}/>
                                    )}
                                    {samhandlerData.kontaktEpost && (
                                        <InfoRow label="E-post" value={samhandlerData.kontaktEpost}/>
                                    )}
                                </HGrid>
                            </div>
                        </Box>

                        {/* Adresse */}
                        {samhandlerData.adresse && (
                            <Box
                                background="default"
                                borderRadius="0 16 4"
                                borderWidth="1"
                                borderColor="accent-subtle"
                                padding="space-6"
                                shadow="dialog"
                            >
                                <Heading level="3" size="small" spacing>
                                    Adresse
                                </Heading>
                                <VStack gap="space-1">
                                    {samhandlerData.adresse.adresselinje1 && (
                                        <BodyShort>{samhandlerData.adresse.adresselinje1}</BodyShort>
                                    )}
                                    {samhandlerData.adresse.adresselinje2 && (
                                        <BodyShort>{samhandlerData.adresse.adresselinje2}</BodyShort>
                                    )}
                                    {samhandlerData.adresse.adresselinje3 && (
                                        <BodyShort>{samhandlerData.adresse.adresselinje3}</BodyShort>
                                    )}
                                    {(samhandlerData.adresse.postnummer || samhandlerData.adresse.poststed) && (
                                        <BodyShort>
                                            {samhandlerData.adresse.postnummer} {samhandlerData.adresse.poststed}
                                        </BodyShort>
                                    )}
                                    {samhandlerData.adresse.land && (
                                        <BodyShort>{landkodeTilVisningsnavn(samhandlerData.adresse.land)}</BodyShort>
                                    )}
                                </VStack>
                            </Box>
                        )}

                        {/* Kontonummer */}
                        {samhandlerData.kontonummer && (
                            <Box
                                background="default"
                                borderRadius="0 16 4"
                                borderWidth="1"
                                borderColor="accent-subtle"
                                padding="space-6"
                                shadow="dialog"
                            >
                                <Heading level="3" size="small" spacing>
                                    Kontoopplysninger
                                </Heading>
                                <HGrid gap="space-4" columns={{xs: 1, sm: 2, md: 3}}>
                                    {samhandlerData.kontonummer.norskKontonummer && (
                                        <InfoRow
                                            label="Kontonummer"
                                            value={samhandlerData.kontonummer.norskKontonummer}
                                        />
                                    )}
                                    {samhandlerData.kontonummer.iban && (
                                        <InfoRow label="IBAN" value={samhandlerData.kontonummer.iban}/>
                                    )}
                                    {samhandlerData.kontonummer.swift && (
                                        <InfoRow label="SWIFT" value={samhandlerData.kontonummer.swift}/>
                                    )}
                                    {samhandlerData.kontonummer.banknavn && (
                                        <InfoRow label="Banknavn" value={samhandlerData.kontonummer.banknavn}/>
                                    )}
                                    {samhandlerData.kontonummer.bankCode && (
                                        <InfoRow label="Bankkode" value={samhandlerData.kontonummer.bankCode}/>
                                    )}
                                    {samhandlerData.kontonummer.landkodeBank && (
                                        <InfoRow
                                            label="Landkode bank"
                                            value={samhandlerData.kontonummer.landkodeBank}
                                        />
                                    )}
                                    {samhandlerData.kontonummer.valutakode && (
                                        <InfoRow label="Valutakode" value={samhandlerData.kontonummer.valutakode}/>
                                    )}
                                </HGrid>
                            </Box>
                        )}

                        {/* Notat */}
                        {samhandlerData.notat && (
                            <Box
                                background="default"
                                borderRadius="0 16 4"
                                borderWidth="1"
                                borderColor="accent-subtle"
                                padding="space-6"
                                shadow="dialog"
                            >
                                <Heading level="3" size="small" spacing>
                                    Notat
                                </Heading>
                                <BodyLong>{samhandlerData.notat}</BodyLong>
                            </Box>
                        )}
                    </>
                )}
                {/* Inline edit panel */}
                {isEditing && (
                    <Box
                        background="default"
                        borderRadius="8"
                        borderWidth="1"
                        borderColor="neutral-subtle"
                        padding="space-6"
                        shadow="dialog"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Heading level="3" size="small">
                                Rediger samhandler
                            </Heading>
                            <Button
                                size="small"
                                variant="tertiary-neutral"
                                icon={<XMarkIcon aria-hidden/>}
                                onClick={() => setIsEditing(false)}
                            >
                                Lukk
                            </Button>
                        </div>
                        <SamhandlerForm
                            mutation={oppdaterSamhandler}
                            samhandler={samhandlerData}
                            onSuccess={handleSamhandlerUpdated}
                            onClose={() => setIsEditing(false)}
                            typeOfAction="edit"
                            inModal={false}
                        />
                    </Box>
                )}
            </VStack>
        );
    },
    (prevProps, nextProps) => prevProps.samhandler.samhandlerId === nextProps.samhandler.samhandlerId
);

export default function SamhandlerDetaljer({params}: Route.ComponentProps) {
    const {samhandlerId: id} = params;

    if (!id) {
        return <Alert variant="error">Samhandler ID mangler</Alert>;
    }

    return (
        <div className="flex justify-center px-4 py-8">
            <div className="w-full max-w-4xl">
                <VStack gap="space-6">
                    <div>
                        <Heading level="1" size="xlarge">
                            Samhandler
                        </Heading>
                        <BodyShort size="small" className="text-ax-neutral-600 mt-1">
                            ID: {id}
                        </BodyShort>
                    </div>
                    <QueryErrorWrapper>
                        <Suspense fallback={<Loader size="medium" title="Laster samhandler..."/>}>
                            <SamhandlerDetaljerLoader samhandlerId={id}/>
                        </Suspense>
                    </QueryErrorWrapper>
                </VStack>
            </div>
        </div>
    );
}

function SamhandlerDetaljerLoader({samhandlerId}: { samhandlerId: string }) {
    const {data: samhandler} = useHentSamhandlerDetaljer(samhandlerId);
    return <SamhandlerDetaljerContent samhandler={samhandler}/>;
}
