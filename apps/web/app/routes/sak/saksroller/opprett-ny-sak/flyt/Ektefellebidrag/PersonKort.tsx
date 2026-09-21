import type { PersonDto } from "@bidrag/api/PersonApi";
import { CheckmarkCircleFillIcon, PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Box, HStack, VStack } from "@navikt/ds-react";
import DiskresjonAlert from "../../../components/DiskresjonAlert";
import PersonInfo from "../../../components/PersonInfo";

type Props = {
    person: PersonDto;
    erValgt: boolean;
    onClick: () => void;
};

export default function PersonKort({ person, erValgt, onClick }: Props) {
    return (
        <Box
            asChild
            width="100%"
            padding="space-16"
            borderRadius="8"
            borderWidth="2"
            background={erValgt ? "success-soft" : "default"}
            borderColor={erValgt ? "success-strong" : "neutral"}
            className={`transition-all ${erValgt ? "" : "hover:border-ax-accent-500 hover:bg-ax-accent-100"}`}
        >
            <button type="button" onClick={onClick}>
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
                        </VStack>
                    </HStack>

                    {erValgt && (
                        <HStack gap="space-2" align="center">
                            <CheckmarkCircleFillIcon aria-hidden fontSize="1.5rem" className="text-ax-success-700" />
                            <XMarkIcon aria-hidden fontSize="1rem" className="text-ax-neutral-600" />
                        </HStack>
                    )}
                </HStack>
            </button>
        </Box>
    );
}
