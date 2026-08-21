import { IdentUtils } from "@bidrag/common";
import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { Alert, BodyLong, Button } from "@navikt/ds-react";

import { useHentSamhandler } from "~/api/useApi.ts";
import type { Diskresjonskode } from "../sakvisning-schema.ts";
import DiskresjonAlert from "./DiskresjonAlert.tsx";
import PersonInfo from "./PersonInfo.tsx";

type Props = {
    navn: string;
    disabled?: boolean;
    label?: string;
    ident?: string;
    fjern?: () => void;
    bakgrunn?: string;
    border?: string;
    ikon?: string;
    simple?: boolean;
    diskresjonskode?: Diskresjonskode;
};
export default function FunnetPersonInfo({
    label,
    disabled,
    navn,
    ident,
    fjern,
    bakgrunn,
    simple,
    border,
    ikon,
    diskresjonskode,
}: Props) {
    const erSamhandlerIdent = ident ? IdentUtils.isSamhandlerId(ident) : false;
    const { data } = useHentSamhandler(ident ?? "", erSamhandlerIdent);
    const samhandlerManglerKontonummer = () =>
        erSamhandlerIdent && data && !data?.kontonummer?.norskKontonummer && !data?.kontonummer?.iban;
    return (
        <div
            className={`border ${simple ? "" : (bakgrunn ?? `bg-ax-accent-100`)} ${simple ? "" : `mt-2 p-3`}  rounded-lg ${simple ? "" : `border-solid`} ${simple ? "" : (border ?? `border-ax-bg-info-soft`)} flex items-center justify-between`}
        >
            <div className="flex gap-3 w-[stretch] justify-between">
                <div className="flex gap-3">
                    {simple ? null : (
                        <PersonIcon fontSize="1.5rem" aria-hidden className={ikon ?? `text-ax-success-700`} />
                    )}
                    <div className="flex flex-col">
                        <BodyLong size="small" className="font-semibold">
                            {label} <PersonInfo ident={ident ?? ""} navn={navn} />
                        </BodyLong>
                        {diskresjonskode && <DiskresjonAlert diskresjonskode={diskresjonskode} />}
                        {samhandlerManglerKontonummer() && (
                            <Alert inline size="small" variant="warning" className="mt-2">
                                Samhandler mangler norsk kontonummer eller IBAN
                            </Alert>
                        )}
                    </div>
                </div>
                {fjern && (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="xsmall"
                        className="h-max"
                        disabled={disabled}
                        icon={<XMarkIcon aria-hidden />}
                        onClick={fjern}
                    >
                        Fjern
                    </Button>
                )}
            </div>
        </div>
    );
}
