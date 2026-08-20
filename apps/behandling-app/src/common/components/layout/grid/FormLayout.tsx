import { BidragCell, BidragGrid } from "@bidrag/common";
import { Heading } from "@navikt/ds-react";
import React, { type ReactNode } from "react";

export const FormLayout = ({
    title,
    main,
    side,
    pageAlert,
}: {
    title?: ReactNode;
    main?: ReactNode;
    side?: ReactNode;
    pageAlert?: ReactNode;
}) => {
    return (
        <div className="grid gap-2">
            <div className="flex flex-row gap-2">
                <Heading level="1" size="medium">
                    {title}
                </Heading>
                {/* <SaveStatusIndicator mutationKey={listenToMutations} queryClient={queryClient} /> */}
            </div>
            <BidragGrid className="grid grid-cols-12 gap-6">
                <BidragCell className="sm:col-span-12 ax-md:col-span-12 --ax-bre:col-span-12 ax-2xl:col-span-8 h-fit grid gap-y-4">
                    {pageAlert}
                    {main}
                </BidragCell>
                <BidragCell className="sm:col-span-12 ax-md:col-span-6 ax-xl:col-span-6 ax-2xl:col-span-4 bg-[white]">
                    <div className="grid gap-y-4 h-fit ax-lg:sticky ax-lg:top-8 ax-lg:p-0">{side}</div>
                </BidragCell>
            </BidragGrid>
        </div>
    );
};
