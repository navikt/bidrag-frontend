import { BidragContainer } from "@bidrag/common";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import BrukerveiledningBarnebidragKlage from "./barnebidrag/docs/BrukerveiledningBarnebidragKlage.mdx";
import BrukerveiledningBarnebidragV1 from "./barnebidrag/docs/BrukerveiledningBarnebidragV1.mdx";
import PageWrapper from "./common/PageWrapper";
import BrukerveiledningForskudd from "./forskudd/docs/BrukerveiledningForskudd.mdx";
import BrukerveiledningSærbidrag from "./særbidrag/docs/BrukerveiledningSærbidrag.mdx";
import { scrollToHash } from "./utils/window-utils";

export function ForskuddBrukerveiledningPage() {
    useEffect(scrollToHash, []);

    return (
        <PageWrapper name="Forskudd brukerveiledning">
            <BidragContainer className="brukerveiledning container p-6 max-w-[60rem]">
                <BrukerveiledningForskudd />
            </BidragContainer>
        </PageWrapper>
    );
}

export function BidragBrukerveiledningPage() {
    useEffect(scrollToHash, []);
    const [searchParams] = useSearchParams();
    const forKlage = searchParams.get("klage") === "true";

    return (
        <PageWrapper name="Bidrag brukerveiledning">
            <BidragContainer className="brukerveiledning container p-6 max-w-[60rem]">
                {forKlage ? <BrukerveiledningBarnebidragKlage /> : <BrukerveiledningBarnebidragV1 />}
            </BidragContainer>
        </PageWrapper>
    );
}

export function SærbidragBrukerveiledningPage() {
    useEffect(scrollToHash, []);

    return (
        <PageWrapper name="Særbidrag brukerveiledning">
            <BidragContainer className="brukerveiledning container p-6 max-w-[60rem]">
                <BrukerveiledningSærbidrag />
            </BidragContainer>
        </PageWrapper>
    );
}
