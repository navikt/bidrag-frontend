import type { SamhandlerDto } from "@bidrag/api/SamhandlerApi";
import { PencilIcon, XMarkIcon } from "@navikt/aksel-icons";
import {
    Alert,
    BodyLong,
    BodyShort,
    Box,
    Button,
    Heading,
    HGrid,
    HStack,
    Label,
    Loader,
    Tag,
    VStack,
} from "@navikt/ds-react";
import { memo, Suspense, useState } from "react";
import { QueryErrorWrapper } from "./QueryErrorBoundary";
import SamhandlerForm from "./SamhandlerForm";
import type { Samhandler } from "./SamhandlerSøk";
import {
    kodeTilVisningsnavn,
    landkodeTilVisningsnavn,
    useHentSamhandlerDetaljer,
    useHentVisningsnavn,
    useOppdaterSamhandler,
} from "./utils/useApiData";

type InfoRowProps = { label: string; value: React.ReactNode };

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <VStack gap={"space-2"}>
            <Label size="small" textColor={"subtle"}>
                {label.toUpperCase()}
            </Label>
            <BodyShort>{value}</BodyShort>
        </VStack>
    );
}

const SamhandlerDetaljerContent = memo(
    ({ samhandler }: { samhandler: SamhandlerDto }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [samhandlerData, setSamhandlerData] = useState<SamhandlerDto>(samhandler);
        const oppdaterSamhandler = useOppdaterSamhandler();
        useHentVisningsnavn();

        const handleSamhandlerUpdated = (updatedSamhandler: Samhandler) => {
            setSamhandlerData(updatedSamhandler);
            setIsEditing(false);
        };

        return (
            <VStack gap="space-6" width={"100%"}>
                {!isEditing && (
                    <>
                        {/* Header card */}
                        <Box
                            background="neutral-soft"
                            borderRadius="0 16 4"
                            borderWidth="1"
                            borderColor="accent-subtle"
                            padding="space-6"
                            shadow="dialog"
                        >
                            <HStack justify={"space-between"} align={"start"}>
                                <VStack gap={"space-16"}>
                                    <HStack gap={"space-24"}>
                                        <Heading level="2" size="medium">
                                            {samhandlerData.navn}
                                        </Heading>
                                        {samhandlerData.erOpphørt && (
                                            <Tag variant="error" size="small">
                                                Opphørt
                                            </Tag>
                                        )}
                                    </HStack>
                                    <BodyShort size="small" textColor="subtle">
                                        ID: {samhandlerData.samhandlerId}
                                    </BodyShort>
                                </VStack>
                                <Button
                                    size="small"
                                    variant="secondary"
                                    icon={<PencilIcon aria-hidden />}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Rediger
                                </Button>
                            </HStack>

                            <Box
                                borderWidth={"1 0 0 0"}
                                borderColor="neutral"
                                paddingBlock={"space-16 space-0"}
                                marginBlock={"space-16 space-0"}
                            >
                                <HGrid gap="space-4" columns={{ xs: 1, sm: 2, md: 3 }}>
                                    {samhandlerData.områdekode && (
                                        <InfoRow
                                            label="Kreditortype"
                                            value={kodeTilVisningsnavn(samhandlerData.områdekode)}
                                        />
                                    )}
                                    {samhandlerData.offentligId && (
                                        <InfoRow label="Offentlig ID" value={samhandlerData.offentligId} />
                                    )}
                                    {samhandlerData.offentligIdType && (
                                        <InfoRow
                                            label="ID-type"
                                            value={kodeTilVisningsnavn(samhandlerData.offentligIdType)}
                                        />
                                    )}
                                    {samhandlerData.språk && (
                                        <InfoRow label="Språk" value={kodeTilVisningsnavn(samhandlerData.språk)} />
                                    )}
                                    {samhandlerData.kontaktperson && (
                                        <InfoRow label="Kontaktperson" value={samhandlerData.kontaktperson} />
                                    )}
                                    {samhandlerData.kontaktTelefon && (
                                        <InfoRow label="Telefon" value={samhandlerData.kontaktTelefon} />
                                    )}
                                    {samhandlerData.kontaktEpost && (
                                        <InfoRow label="E-post" value={samhandlerData.kontaktEpost} />
                                    )}
                                </HGrid>
                            </Box>
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
                                <HGrid gap="space-4" columns={{ xs: 1, sm: 2, md: 3 }}>
                                    {samhandlerData.kontonummer.norskKontonummer && (
                                        <InfoRow
                                            label="Kontonummer"
                                            value={samhandlerData.kontonummer.norskKontonummer}
                                        />
                                    )}
                                    {samhandlerData.kontonummer.iban && (
                                        <InfoRow label="IBAN" value={samhandlerData.kontonummer.iban} />
                                    )}
                                    {samhandlerData.kontonummer.swift && (
                                        <InfoRow label="SWIFT" value={samhandlerData.kontonummer.swift} />
                                    )}
                                    {samhandlerData.kontonummer.banknavn && (
                                        <InfoRow label="Banknavn" value={samhandlerData.kontonummer.banknavn} />
                                    )}
                                    {samhandlerData.kontonummer.bankCode && (
                                        <InfoRow label="Bankkode" value={samhandlerData.kontonummer.bankCode} />
                                    )}
                                    {samhandlerData.kontonummer.landkodeBank && (
                                        <InfoRow
                                            label="Landkode bank"
                                            value={samhandlerData.kontonummer.landkodeBank}
                                        />
                                    )}
                                    {samhandlerData.kontonummer.valutakode && (
                                        <InfoRow label="Valutakode" value={samhandlerData.kontonummer.valutakode} />
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
                        <HStack justify={"space-between"}>
                            <Heading level="3" size="small">
                                Rediger samhandler
                            </Heading>
                            <Button
                                size="small"
                                variant="tertiary-neutral"
                                icon={<XMarkIcon aria-hidden />}
                                onClick={() => setIsEditing(false)}
                            >
                                Lukk
                            </Button>
                        </HStack>
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
    (prevProps, nextProps) => prevProps.samhandler.samhandlerId === nextProps.samhandler.samhandlerId,
);

export default function SamhandlerDetaljer({ samhandlerId: id }: { samhandlerId?: string }) {
    if (!id) {
        return <Alert variant="error">Samhandler ID mangler</Alert>;
    }

    return (
        <VStack
            gap="space-24"
            maxWidth={"56rem"}
            width={"100%"}
            align={"center"}
            marginInline={"auto"}
            paddingBlock={"space-32"}
        >
            <VStack width={"100%"} gap={"space-1"}>
                <Heading level="1" size="xlarge">
                    Samhandler
                </Heading>
                <BodyShort size="small" textColor={"subtle"}>
                    ID: {id}
                </BodyShort>
            </VStack>
            <QueryErrorWrapper>
                <Suspense fallback={<Loader size="medium" title="Laster samhandler..." />}>
                    <SamhandlerDetaljerLoader samhandlerId={id} />
                </Suspense>
            </QueryErrorWrapper>
        </VStack>
    );
}

function SamhandlerDetaljerLoader({ samhandlerId }: { samhandlerId: string }) {
    const { data: samhandler } = useHentSamhandlerDetaljer(samhandlerId);
    return <SamhandlerDetaljerContent samhandler={samhandler} />;
}
