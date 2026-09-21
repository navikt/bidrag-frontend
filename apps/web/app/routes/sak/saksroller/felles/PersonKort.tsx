import type { PersonDto } from "@bidrag/api/PersonApi";
import { CheckmarkCircleFillIcon, PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Box, HStack, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";
import DiskresjonAlert from "../components/DiskresjonAlert";
import PersonInfo from "../components/PersonInfo";

type Props = {
    person: PersonDto;
    erValgt?: boolean;
    onClick?: () => void;
    children?: ReactNode;
};

function PersonKortInnhold({
    person,
    erValgt,
    children,
}: {
    person: PersonDto;
    erValgt?: boolean;
    children?: ReactNode;
}) {
    return (
        <HStack gap="space-4" align="center" justify="space-between">
            <HStack gap="space-4" align="center">
                <Box
                    padding="space-8"
                    borderRadius="full"
                    background={erValgt ? "success-moderate" : "neutral-moderate"}
                >
                    <PersonIcon
                        aria-hidden
                        fontSize="1.25rem"
                        className={erValgt ? "text-ax-success-800" : "text-ax-neutral-700"}
                    />
                </Box>
                <VStack gap="space-0">
                    <PersonInfo
                        ident={person.ident}
                        fødselsdato={person.fødselsdato ?? undefined}
                        navn={person.visningsnavn}
                        visKopieringsknapp={false}
                    />
                    {person.diskresjonskode && <DiskresjonAlert diskresjonskode={person.diskresjonskode} />}
                    {children}
                </VStack>
            </HStack>
            {erValgt && (
                <HStack gap="space-2" align="center">
                    <CheckmarkCircleFillIcon aria-hidden fontSize="1.5rem" className="text-ax-success-700" />
                    <XMarkIcon aria-hidden fontSize="1rem" className="text-ax-neutral-600" />
                </HStack>
            )}
        </HStack>
    );
}

export default function PersonKort({ person, erValgt, onClick, children }: Props) {
    const erKlikkbart = onClick !== undefined;

    return (
        <Box
            asChild={erKlikkbart}
            width="100%"
            padding="space-16"
            borderRadius="8"
            borderWidth="2"
            background={erValgt ? "success-soft" : "default"}
            borderColor={erValgt ? "success-strong" : "neutral"}
            className={`transition-all ${erValgt ? "" : erKlikkbart ? "hover:border-ax-accent-500 hover:bg-ax-accent-100" : ""}`}
        >
            {erKlikkbart ? (
                <button type="button" onClick={onClick}>
                    <PersonKortInnhold person={person} erValgt={erValgt} children={children} />
                </button>
            ) : (
                <PersonKortInnhold person={person} erValgt={erValgt} children={children} />
            )}
        </Box>
    );
}
