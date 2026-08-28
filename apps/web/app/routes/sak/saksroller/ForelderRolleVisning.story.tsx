import { useForm } from "react-hook-form";
import { CtProviders } from "../../../../playwright/testing/CtProviders";
import ForelderRolleVisning from "./ForelderRolleVisning";
import type { Rolle, SakRedigeringData } from "./sakvisning-schema";

const bpKjentFraStart: Rolle = {
    fodselsnummer: "10987654321",
    type: "BP",
    rolleType: "BP",
    objektnummer: "1",
    mottagerErVerge: false,
    navn: "Ola Nordmann",
};

const bmKjentFraStart: Rolle = {
    fodselsnummer: "01019012345",
    type: "BM",
    rolleType: "BM",
    objektnummer: "2",
    mottagerErVerge: false,
    navn: "Kari Nordmann",
};

interface ForelderRolleVisningScenarioProps {
    initialRoller: Rolle[];
    erNyForelderBp?: boolean;
}

function ForelderRolleVisningScenario({ initialRoller, erNyForelderBp = false }: ForelderRolleVisningScenarioProps) {
    const form = useForm<SakRedigeringData>({
        defaultValues: { saksnummer: "2024/1", roller: initialRoller },
    });
    const roller = form.watch("roller") || [];
    const bp = roller.find((r) => r.type === "BP");
    const bm = roller.find((r) => r.type === "BM");

    return (
        <CtProviders
            personer={{
                [bpKjentFraStart.fodselsnummer as string]: {
                    ident: bpKjentFraStart.fodselsnummer,
                    visningsnavn: "Ola Nordmann",
                },
                [bmKjentFraStart.fodselsnummer as string]: {
                    ident: bmKjentFraStart.fodselsnummer,
                    visningsnavn: "Kari Nordmann",
                },
            }}
            uthevPerson={(ident) => ident === bpKjentFraStart.fodselsnummer}
        >
            <ForelderRolleVisning bp={bp} bm={bm} erNyForelderBp={erNyForelderBp} form={form} saksnummer="2024/1" />
        </CtProviders>
    );
}

export const BeggeRollerISak = () => (
    <ForelderRolleVisningScenario initialRoller={[bpKjentFraStart, bmKjentFraStart]} />
);

export const BidragsmottakerMangler = () => <ForelderRolleVisningScenario initialRoller={[bpKjentFraStart]} />;

export const BidragspliktigMangler = () => <ForelderRolleVisningScenario initialRoller={[bmKjentFraStart]} />;

export const NyBidragspliktigKanFjernes = () => (
    <ForelderRolleVisningScenario initialRoller={[bpKjentFraStart, bmKjentFraStart]} erNyForelderBp />
);
