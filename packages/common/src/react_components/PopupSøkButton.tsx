import { Button, type ButtonProps, HStack, Loader } from "@navikt/ds-react";
import type { ReactNode } from "react";

import { type UsePopupSøkProps, usePopupSøk } from "./hooks/usePopupSøk";

type PopupSøkButtonProps<T> = Omit<UsePopupSøkProps<T>, "søkNavn"> & {
    tekst: string;
} & Omit<ButtonProps, "children" | "onError">;

export default function PopupSøkButton<T>({
    tekst,
    channelName,
    søkPath,
    parseResultat,
    onResult,
    onError,
    ...buttonProps
}: PopupSøkButtonProps<T>): ReactNode {
    const søkenavn = tekst.toLowerCase();
    const { avbryt, åpne, venter } = usePopupSøk({
        channelName,
        søkPath,
        søkNavn: søkenavn,
        parseResultat,
        onResult,
        onError,
    });
    const åpneTittel = `Åpne ${søkenavn}`;
    const ventetittel = `Venter på resultat fra ${søkenavn}`;

    return (
        <div className="pdlSearchButton whitespace-nowrap self-end">
            <Button
                {...buttonProps}
                variant={buttonProps.variant ?? "secondary"}
                size={buttonProps.size ?? "small"}
                type="button"
                title={venter ? ventetittel : åpneTittel}
                onClick={venter ? avbryt : åpne}
            >
                {venter ? (
                    <HStack gap="space-4" align="center" wrap={false}>
                        <span>Avbryt</span>
                        <Loader size="xsmall" title={ventetittel} />
                    </HStack>
                ) : (
                    tekst
                )}
            </Button>
        </div>
    );
}
