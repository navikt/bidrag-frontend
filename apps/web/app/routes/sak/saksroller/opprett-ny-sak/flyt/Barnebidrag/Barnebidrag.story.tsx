import { barnkurver, testpersoner, ukjentBarnkurv } from "@ct/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "@ct/opprett-ny-sak/WizardFlowStory";
import type { PartISaken } from "../../opprett-sak-schema";

const part = (person: { ident: string; visningsnavn: string }, rolle: PartISaken["rolle"]): PartISaken => ({
    ident: person.ident,
    navn: person.visningsnavn,
    rolle,
    erKjent: true,
});

export const ForelderMedBarn = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARNEBIDRAG",
            partISaken: part(testpersoner.bidragspliktig, "bidragspliktig"),
            barnkurver,
        }}
    />
);

export const ForelderUkjentBidragsmottaker = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARNEBIDRAG",
            partISaken: part(testpersoner.bidragspliktig, "bidragspliktig"),
            barnkurver: ukjentBarnkurv,
        }}
    />
);

export const ForelderUtenBarn = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARNEBIDRAG",
            partISaken: part(testpersoner.bidragspliktig, "bidragspliktig"),
            barnkurver: [],
        }}
    />
);

export const BarnUnder18 = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARNEBIDRAG",
            partISaken: part(testpersoner.barnUnder18, "barn_under_18"),
            barnkurver: [],
        }}
    />
);

export const BarnOver18 = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARNEBIDRAG",
            partISaken: part(testpersoner.barnOver18, "barn_over_18"),
            barnkurver: [],
        }}
    />
);
