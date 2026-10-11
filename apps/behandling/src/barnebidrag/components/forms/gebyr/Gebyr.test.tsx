import {
    type GebyrRolleV2Dto,
    type GebyrSakDto,
    Rolletype,
    SoktAvType,
    Stonadstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import type { PropsWithChildren, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { behandlingMockApiData } from "../../../../__mocks__/testdata/behandlingTestData";
import { useGetBehandlingV2 } from "../../../../common/hooks/useApiData";
import Gebyr from "./Gebyr";

const context = vi.hoisted(() => ({
    selectedSaksnummer: undefined as string | undefined,
    setSaveErrorState: vi.fn(),
}));

vi.mock("@bidrag/common", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@bidrag/common")>()),
    PersonNavnIdent: () => null,
    RolleTag: ({ rolleType }: { rolleType: string }) => <span>{rolleType}</span>,
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@tanstack/react-query")>()),
    useSuspenseQueries: () => [],
}));
vi.mock("../../../../common/context/BehandlingContext", () => ({
    useBehandlingProvider: () => context,
}));
vi.mock("../../../../common/hooks/useApiData", () => ({
    useGetBehandlingV2: vi.fn(),
}));
vi.mock("../../../../common/components/layout/grid/NewFormLayout", () => ({
    NewFormLayout: ({ main }: { main: ReactNode }) => <>{main}</>,
}));
vi.mock("../../../../common/components/query-error-boundary/QueryErrorWrapper", () => ({
    QueryErrorWrapper: ({ children }: PropsWithChildren) => <>{children}</>,
}));
vi.mock("../../../hooks/useOnUpdateGebyr", () => ({
    useOnUpdateGebyr: () => ({ mutation: { mutate: vi.fn() } }),
}));

function createGebyrRolle(saksnummer: string, rolleSaksnummer?: string): GebyrRolleV2Dto {
    const rolle = {
        ...behandlingMockApiData.roller[2],
        rolletype: Rolletype.BP,
        saksnummer: rolleSaksnummer,
        stønadstype: Stonadstype.BIDRAG,
    };
    return {
        rolle,
        gebyrDetaljer: {
            rolle,
            søknad: {
                søknadsid: 1,
                saksnummer,
                erHovedsøknad: true,
                barn: [],
                søktFomDato: "2026-01-01",
                mottattDato: "2026-01-01",
                søktAvType: SoktAvType.BIDRAGSMOTTAKER,
            },
            inntekt: { skattepliktigInntekt: 300000, totalInntekt: 300000 },
            beløpGebyrsats: 1000,
            beregnetIlagtGebyr: true,
            endeligIlagtGebyr: true,
            erManueltOverstyrt: false,
        },
    };
}

function mockSaker(saker: GebyrSakDto[]) {
    vi.mocked(useGetBehandlingV2).mockReturnValue({
        ...behandlingMockApiData,
        gebyrV3: { saker },
    });
}

function renderGebyr() {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(<Gebyr />);
    return container;
}

describe("Gebyr case filtering", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        context.selectedSaksnummer = "2222222";
    });

    it.each([
        { field: "gebyrRoller" as const, rolleSaksnummer: "1111111" },
        { field: "gebyrRoller" as const, rolleSaksnummer: undefined },
        { field: "gebyr18År" as const, rolleSaksnummer: "1111111" },
        { field: "gebyr18År" as const, rolleSaksnummer: undefined },
    ])("shows BP in $field based on the enclosing case, not rolle.saksnummer=$rolleSaksnummer", ({
        field,
        rolleSaksnummer,
    }) => {
        mockSaker([
            { saksnummer: "1111111", gebyrRoller: [], gebyr18År: [] },
            {
                saksnummer: "2222222",
                gebyrRoller: field === "gebyrRoller" ? [createGebyrRolle("2222222", rolleSaksnummer)] : [],
                gebyr18År: field === "gebyr18År" ? [createGebyrRolle("2222222", rolleSaksnummer)] : [],
            },
        ]);

        const container = renderGebyr();

        expect(container.textContent).toContain("BP");
        expect(container.querySelectorAll("select")).toHaveLength(1);
        expect(container.querySelector("select")?.value).toBe("ILAGT");
    });

    it("does not show fees from another case even when its role matches the selected case", () => {
        mockSaker([
            {
                saksnummer: "1111111",
                gebyrRoller: [createGebyrRolle("1111111", "2222222")],
                gebyr18År: [],
            },
            { saksnummer: "2222222", gebyrRoller: [], gebyr18År: [] },
        ]);

        const container = renderGebyr();

        expect(container.querySelectorAll("select")).toHaveLength(0);
        expect(container.textContent).toContain("Ingen gebyr for valgt saksnummer.");
    });

    it("shows BP under each enclosing case when no case is selected", () => {
        context.selectedSaksnummer = undefined;
        mockSaker(
            ["1111111", "2222222"].map((saksnummer) => ({
                saksnummer,
                gebyrRoller: [createGebyrRolle(saksnummer, "1111111")],
                gebyr18År: [],
            })),
        );

        const container = renderGebyr();

        expect(container.querySelectorAll("select")).toHaveLength(2);
        expect(container.textContent).toContain("Sak 1111111");
        expect(container.textContent).toContain("Sak 2222222");
    });
});
