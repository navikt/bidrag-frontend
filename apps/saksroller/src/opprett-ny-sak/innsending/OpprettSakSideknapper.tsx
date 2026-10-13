import { TasklistSaveIcon, TasklistSendIcon, TasklistStartIcon } from "@navikt/aksel-icons";
import { Button, HStack } from "@navikt/ds-react";
import type { MouseEvent } from "react";

export type Redirectmål = "sak" | "soknad" | "saksroller" | null;

type Props = {
    isLoading: boolean;
    onVelg: (event: MouseEvent<HTMLButtonElement>, handling: Redirectmål) => void;
    onAvbryt?: () => void;
    harOnOpprettet: boolean;
};

export default function OpprettSakSideknapper({ isLoading, onVelg, onAvbryt, harOnOpprettet }: Props) {
    return (
        <HStack gap="space-2" justify="end">
            {onAvbryt && (
                <Button variant="tertiary-neutral" type="button" size="xsmall" disabled={isLoading} onClick={onAvbryt}>
                    Avbryt
                </Button>
            )}
            {!harOnOpprettet && (
                <>
                    <Button
                        variant="tertiary"
                        type="submit"
                        size="xsmall"
                        title="Opprett sak og gå til ny søknad skjermbildet"
                        icon={<TasklistStartIcon title="lagre" fontSize="1.5rem" />}
                        loading={isLoading}
                        onClick={(event) => onVelg(event, "soknad")}
                    >
                        Opprett og ny søknad
                    </Button>
                    <Button
                        variant="tertiary"
                        type="submit"
                        size="xsmall"
                        icon={<TasklistSendIcon title="lagre" fontSize="1.5rem" />}
                        loading={isLoading}
                        title="Opprett og gå til sak"
                        onClick={(event) => onVelg(event, "sak")}
                    >
                        Opprett og gå til sak
                    </Button>
                </>
            )}
            <Button
                variant="primary"
                type="submit"
                size="xsmall"
                title={harOnOpprettet ? "Opprett sak og lukk" : "Opprett sak og gå til saksroller"}
                icon={<TasklistSaveIcon title="lagre" fontSize="1.5rem" />}
                loading={isLoading}
                onClick={(event) => onVelg(event, harOnOpprettet ? null : "saksroller")}
            >
                Opprett
            </Button>
        </HStack>
    );
}
