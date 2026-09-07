import type { ReactNode } from "react";

type MaskerSensitivInfoProps = {
    children: ReactNode;
    className?: string;
};

export default function MaskerSensitivInfo({ children, className = "" }: MaskerSensitivInfoProps) {
    return <div className={`${className}`}>{children}</div>;
}
