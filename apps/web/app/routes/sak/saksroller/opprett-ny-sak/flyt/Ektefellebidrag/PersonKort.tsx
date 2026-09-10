import type { PersonDto } from "@bidrag/api/PersonApi";
import { CheckmarkCircleFillIcon, PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { HStack, VStack } from "@navikt/ds-react";
import DiskresjonAlert from "../../../components/DiskresjonAlert";
import PersonInfo from "../../../components/PersonInfo";

type Props = {
    person: PersonDto;
    erValgt: boolean;
    onClick: () => void;
};

export default function PersonKort({ person, erValgt, onClick }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full p-4 rounded-lg border-2 border-solid text-left transition-all ${
                erValgt
                    ? "bg-ax-success-100 border-ax-success-600"
                    : "bg-[white] border-ax-neutral-400 hover:border-ax-accent-500 hover:bg-ax-accent-100"
            }`}
        >
            <HStack gap="space-4" align="center" justify="space-between">
                <HStack gap="space-4" align="center">
                    <div className={`p-2 rounded-full ${erValgt ? "bg-ax-success-300" : "bg-ax-neutral-200"}`}>
                        <PersonIcon
                            aria-hidden
                            fontSize="1.25rem"
                            className={erValgt ? "text-ax-success-800" : "text-ax-neutral-700"}
                        />
                    </div>
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
    );
}
