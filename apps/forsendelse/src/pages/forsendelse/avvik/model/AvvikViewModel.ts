import { ArrowRightLeftIcon, FileXMarkIcon } from "@navikt/aksel-icons";
import type { ForwardRefExoticComponent } from "react";

import { AvvikType } from "../../../../types/AvvikTypes";

type TitleSelectorFn = (metadata?: any) => string;
export interface AvvikViewModel {
    IconComponent: ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
    title: string | TitleSelectorFn;
    description?: string;
    metadata?: any;
    type: AvvikType;
    stepIndicators: string[] | TitleSelectorFn[];
}

export const avvikViewModels: AvvikViewModel[] = [
    {
        title: "Overfør til annen enhet",
        IconComponent: ArrowRightLeftIcon,
        type: AvvikType.OVERFOR_TIL_ANNEN_ENHET,
        stepIndicators: ["Overfør enhet"],
    },
    {
        title: (metadata: any) => {
            if (!metadata) return "Endre fagområde";
            return metadata?.tema === "BID" ? "Overfør til fagområde Foreldreskap" : "Overfør til fagområde Bidrag";
        },
        IconComponent: ArrowRightLeftIcon,
        type: AvvikType.ENDRE_FAGOMRADE,
        stepIndicators: [
            (metadata: any) => {
                if (!metadata) return "Endre fagområde";
                return metadata?.tema === "BID" ? "Overfør til fagområde Foreldreskap" : "Overfør til fagområde Bidrag";
            },
        ],
    },
    {
        title: "Slett forsendelse under produksjon",
        IconComponent: FileXMarkIcon,
        type: AvvikType.SLETT_JOURNALPOST,
        stepIndicators: ["Slett forsendelse"],
    },
    // {
    //     title: "Feilfør forsendelse",
    //     IconComponent: ArrowRightLeftIcon,
    //     type: AvvikType.FEILFORE_SAK,
    //     stepIndicators: ["Feilfør forsendelse"],
    // },
];

export function getViewmodelByType(avvikType: AvvikType) {
    return avvikViewModels.find((a) => a.type === avvikType);
}
