import { IdentUtils } from "@bidrag/common";
import { PersonIcon, XMarkIcon } from "@navikt/aksel-icons";
import { BodyLong, BodyShort, Box, Button, HStack, InlineMessage, VStack } from "@navikt/ds-react";
import type { ReactNode } from "react";

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
    variant?: "info" | "warning";
    bakgrunn?: string;
    border?: string;
    ikon?: string;
    simple?: boolean;
    diskresjonskode?: Diskresjonskode;
};

type InnholdProps = Pick<Props, "label" | "navn" | "ident" | "diskresjonskode">;

export function FunnetPersonInnhold({ label, navn, ident, diskresjonskode }: InnholdProps) {
    const erSamhandlerIdent = ident ? IdentUtils.isSamhandlerId(ident) : false;
    const { data } = useHentSamhandler(ident ?? "", erSamhandlerIdent);
    const samhandlerManglerKontonummer =
        erSamhandlerIdent && data && !data.kontonummer?.norskKontonummer && !data.kontonummer?.iban;

    return (
        <VStack gap="space-4">
            {label && (
                <BodyShort size="small" weight="semibold">
                    {label}
                </BodyShort>
            )}
            <PersonInfo ident={ident ?? ""} navn={navn} compact />
            {diskresjonskode && <DiskresjonAlert diskresjonskode={diskresjonskode} />}
            {samhandlerManglerKontonummer && (
                <InlineMessage status="warning" size="small">
                    Samhandler mangler norsk kontonummer eller IBAN
                </InlineMessage>
            )}
        </VStack>
    );
}

type EnkelProps = Omit<Props, "variant">;

function EnkelFunnetPersonInfo({ disabled, fjern, bakgrunn, border, ikon, simple, ...innholdProps }: EnkelProps) {
    const rammeklasser = simple
        ? "border rounded-lg"
        : `border ${bakgrunn ?? "bg-ax-accent-100"} mt-2 p-3 rounded-lg border-solid ${border ?? "border-ax-bg-info-soft"}`;

    return (
        <div className={`${rammeklasser} flex items-center justify-between`}>
            <div className="flex gap-3 w-[stretch] justify-between">
                <div className="flex gap-3">
                    {!simple && <PersonIcon fontSize="1.5rem" aria-hidden className={ikon ?? "text-ax-success-700"} />}
                    <div className="flex flex-col">
                        <BodyLong size="small" className="font-semibold">
                            {innholdProps.label}{" "}
                            <PersonInfo
                                ident={innholdProps.ident ?? ""}
                                navn={innholdProps.navn}
                                visKopieringsknapp={false}
                            />
                        </BodyLong>
                        {innholdProps.diskresjonskode && (
                            <DiskresjonAlert diskresjonskode={innholdProps.diskresjonskode} />
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

export default function FunnetPersonInfo({ variant, ...props }: Props): ReactNode {
    if (variant === undefined) {
        return <EnkelFunnetPersonInfo {...props} />;
    }

    const { disabled, fjern, label, navn, ident, diskresjonskode } = props;
    const erAdvarsel = variant === "warning";

    return (
        <Box
            background={erAdvarsel ? "warning-soft" : "info-soft"}
            borderColor={erAdvarsel ? "warning" : "info"}
            borderWidth="1"
            borderRadius="8"
            padding="space-12"
        >
            <HStack gap="space-12" align="start" justify="space-between" wrap={false}>
                <HStack gap="space-12" align="start" minWidth="0" wrap={false}>
                    <PersonIcon
                        fontSize="1.5rem"
                        aria-hidden
                        className={erAdvarsel ? "text-ax-warning-700" : "text-ax-accent-700"}
                    />
                    <FunnetPersonInnhold label={label} navn={navn} ident={ident} diskresjonskode={diskresjonskode} />
                </HStack>
                {fjern && !disabled && (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="xsmall"
                        icon={<XMarkIcon aria-hidden />}
                        onClick={fjern}
                    >
                        Fjern
                    </Button>
                )}
            </HStack>
        </Box>
    );
}
