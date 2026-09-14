import type { PropsWithChildren } from "react";

type ContainerProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
export default function BidragContainer({ children, ...otherProps }: PropsWithChildren<ContainerProps>) {
    return (
        <div {...otherProps} className={`container mx-auto ${otherProps.className}`}>
            {children}
        </div>
    );
}
