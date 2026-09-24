import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Button, type ButtonProps, HStack, Link, Loader } from "@navikt/ds-react";
import type { MouseEvent, ReactNode } from "react";

import { type UsePopupSøkProps, usePopupSøk } from "./hooks/usePopupSøk";

type PopupSøkButtonProps<T> = Omit<UsePopupSøkProps<T>, "søkNavn"> & {
    tekst: string;
    visSomLenke?: boolean;
} & Omit<ButtonProps, "children" | "onError">;

export default function PopupSøkButton<T>({
    tekst,
    channelName,
    søkPath,
    parseResultat,
    onResult,
    onError,
    visSomLenke = false,
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
    const åpneTittel = `Åpne ${søkenavn} i nytt vindu`;
    const ventetittel = `Venter på resultat fra ${søkenavn}`;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        åpne();
    };

    if (!visSomLenke) {
        return (
            <div className="pdlSearchButton whitespace-nowrap self-end">
                <Button
                    {...buttonProps}
                    variant={buttonProps.variant ?? "secondary"}
                    size={buttonProps.size ?? "small"}
                    type="button"
                    title={venter ? ventetittel : `Åpne ${søkenavn}`}
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

    if (venter) {
        return (
            <Button type="button" variant="tertiary" size="small" onClick={avbryt} title={ventetittel}>
                <HStack gap="space-4" align="center" wrap={false}>
                    <span>Avbryt</span>
                    <Loader size="xsmall" title={ventetittel} />
                </HStack>
            </Button>
        );
    }

    return (
        <Link
            href={søkPath}
            target="_blank"
            rel="noopener noreferrer"
            title={åpneTittel}
            aria-label={åpneTittel}
            className={buttonProps.className}
            onClick={handleClick}
            inlineText
        >
            {tekst} <ExternalLinkIcon aria-hidden />
        </Link>
    );
}
