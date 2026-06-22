import { ReactNode } from "react";
import {useBidragCommons} from "../api/BidragCommonsContext";

type MaskerSensitivInfoProps = {
    children: ReactNode;
    className?: string;
};

export default function MaskerSensitivInfo({ children, className = "" }: MaskerSensitivInfoProps) {
    const { erMaskert } = useBidragCommons();
    const maskeringsKlasser = erMaskert ? "blur-[5px] select-none pointer-events-none" : "";

    return <div className={`${className} ${maskeringsKlasser}`}>{children}</div>;
}
