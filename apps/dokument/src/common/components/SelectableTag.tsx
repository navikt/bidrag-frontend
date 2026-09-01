import { Tag } from "@navikt/ds-react";
import type { PropsWithChildren } from "react";

interface SelectableTagProps {
    selected?: boolean;
    onClick?: () => void;
}

export default function SelectableTag({ children, selected, onClick }: PropsWithChildren<SelectableTagProps>) {
    return (
        <Tag
            onClick={onClick}
            variant={"info"}
            className={"hover:cursor-pointer w-full"}
            style={{
                color: selected ? "var(--navds-global-color-deepblue-900)" : "black",
                backgroundColor: selected ? "var(--navds-global-color-lightblue-300)" : "white",
                borderColor: selected ? "var(--navds-global-color-deepblue-900)" : "black",
            }}
        >
            {children}
        </Tag>
    );
}
