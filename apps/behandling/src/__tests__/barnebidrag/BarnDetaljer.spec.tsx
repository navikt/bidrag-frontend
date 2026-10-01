import { type ForholdsmessigFordelingBarnDto, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { behandlingMockApiData } from "../../__mocks__/testdata/behandlingTestData";
import { BarnDetaljerOpprettFF } from "../../barnebidrag/forholdsmessigfordeling/BarnDetaljer";
import { PopoverMonthPicker } from "../../common/components/date-picker/PopoverMonthPicker";
import { useGetBehandlingV2 } from "../../common/hooks/useApiData";

vi.mock("@bidrag/common", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@bidrag/common")>()),
    PersonNavnIdent: () => null,
}));
vi.mock("../../common/hooks/useApiData", () => ({
    useGetBehandlingV2: vi.fn(),
    useGetForholdsmessigFordelingDetaljer: () => ({ løpendeBidragBarn: [] }),
    useHarTilgangSak: () => true,
}));
vi.mock("../../common/components/date-picker/PopoverMonthPicker", () => ({
    PopoverMonthPicker: vi.fn(() => null),
}));
vi.mock("../../common/components/BehandlingLenke", () => ({ default: () => null }));
vi.mock("../../common/components/SakLenke", () => ({ default: () => null }));
vi.mock("../../common/components/Søknadslenke", () => ({ default: () => null }));
vi.mock("../../common/hooks/useVisningsnavn", () => ({ hentVisningsnavn: vi.fn() }));
vi.mock("../../barnebidrag/forholdsmessigfordeling/LøpendeBidragListe", () => ({ default: () => null }));

const barn: ForholdsmessigFordelingBarnDto = {
    ident: behandlingMockApiData.roller[0].ident,
    bidragsmottaker: behandlingMockApiData.roller[3],
    navn: "Testbarn",
    saksnr: "1234567",
    enhet: "4806",
    erRevurdering: true,
    harOpprettetForholdsmessigFordeling: false,
    stønadstype: Stonadstype.BIDRAG,
    harLøpendeBidrag: false,
    sammeSakSomBehandling: true,
    åpneBehandlinger: [],
};
const barnKey = `${barn.ident}|${barn.stønadstype}`;

function mockBehandling(søktFomDato: string) {
    vi.mocked(useGetBehandlingV2).mockReturnValue({
        ...behandlingMockApiData,
        søktFomDato,
        stønadstype: Stonadstype.BIDRAG,
        roller: [{ ...behandlingMockApiData.roller[0], ident: barn.ident, stønadstype: barn.stønadstype }],
    });
}

function renderPicker(selectedDato?: string, onChange = vi.fn()) {
    renderToStaticMarkup(
        <BarnDetaljerOpprettFF
            barn={[barn]}
            manueltOverstyrteRevurderingsdatoer={{ [barnKey]: selectedDato }}
            onManueltOverstyrtRevurderingsdatoChange={onChange}
        />,
    );
    expect(PopoverMonthPicker).toHaveBeenCalledTimes(1);
    return vi.mocked(PopoverMonthPicker).mock.calls[0][0];
}

describe("BarnDetaljerOpprettFF revurderingsdato", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 0, 31, 12));
        mockBehandling("2026-04-01");
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([
        { søktFomDato: "2025-10-01", expected: new Date(2026, 1, 1), value: "01.02.2026" },
        { søktFomDato: "2026-01-01", expected: new Date(2026, 1, 1), value: "01.02.2026" },
        { søktFomDato: "2026-01-31", expected: new Date(2026, 1, 1), value: "01.02.2026" },
        { søktFomDato: "2026-04-01", expected: new Date(2026, 4, 1), value: "01.05.2026" },
        { søktFomDato: "2026-04-30", expected: new Date(2026, 4, 1), value: "01.05.2026" },
        { søktFomDato: "2026-12-31", expected: new Date(2027, 0, 1), value: "01.01.2027" },
    ])("uses the month after the later of today and $søktFomDato as default and upper bound", ({
        søktFomDato,
        expected,
        value,
    }) => {
        mockBehandling(søktFomDato);

        const picker = renderPicker();

        expect(picker.defaultSelected).toEqual(expected);
        expect(picker.value).toBe(value);
        expect(picker.fromDate).toEqual(new Date(søktFomDato));
        expect(picker.toDate).toEqual(expected);
    });

    it("recalculates the default when the current month changes", () => {
        mockBehandling("2025-10-01");
        expect(renderPicker().defaultSelected).toEqual(new Date(2026, 1, 1));
        vi.mocked(PopoverMonthPicker).mockClear();
        vi.setSystemTime(new Date(2026, 1, 1, 12));

        const picker = renderPicker();

        expect(picker.defaultSelected).toEqual(new Date(2026, 2, 1));
        expect(picker.toDate).toEqual(new Date(2026, 2, 1));
    });

    it("preserves a manual override without changing the allowed bounds", () => {
        const picker = renderPicker("2026-04-01");

        expect(picker.defaultSelected).toEqual(new Date("2026-04-01"));
        expect(picker.value).toBe("01.04.2026");
        expect(picker.fromDate).toEqual(new Date("2026-04-01"));
        expect(picker.toDate).toEqual(new Date(2026, 4, 1));
    });

    it.each([
        { søktFomDato: "2025-10-01", selected: new Date(2026, 1, 1) },
        { søktFomDato: "2025-10-01", selected: new Date(2026, 1, 15) },
        { søktFomDato: "2026-04-01", selected: new Date(2026, 4, 1) },
        { søktFomDato: "2026-04-01", selected: new Date(2026, 4, 15) },
        { søktFomDato: "2026-12-01", selected: new Date(2027, 0, 1) },
    ])("clears the override when the default month is selected for $søktFomDato", ({ søktFomDato, selected }) => {
        mockBehandling(søktFomDato);
        const onChange = vi.fn();
        const picker = renderPicker(undefined, onChange);

        picker.onChange(selected);

        expect(onChange).toHaveBeenCalledExactlyOnceWith(barnKey, undefined);
    });

    it("clears the override when the selection is cleared", () => {
        const onChange = vi.fn();
        const picker = renderPicker("2026-04-01", onChange);

        picker.onChange(undefined);

        expect(onChange).toHaveBeenCalledExactlyOnceWith(barnKey, undefined);
    });

    it("sends a non-default month as an ISO date for the correct child and benefit type", () => {
        const onChange = vi.fn();
        const picker = renderPicker(undefined, onChange);

        picker.onChange(new Date(2026, 3, 1));

        expect(onChange).toHaveBeenCalledExactlyOnceWith(barnKey, "2026-04-01");
    });

    it("keeps overrides separate for different benefit types for the same child", () => {
        const barn18 = { ...barn, stønadstype: Stonadstype.BIDRAG18AAR };
        const barn18Key = `${barn18.ident}|${barn18.stønadstype}`;
        const onChange = vi.fn();
        renderToStaticMarkup(
            <BarnDetaljerOpprettFF
                barn={[barn, barn18]}
                manueltOverstyrteRevurderingsdatoer={{ [barnKey]: "2026-04-01", [barn18Key]: "2026-05-01" }}
                onManueltOverstyrtRevurderingsdatoChange={onChange}
            />,
        );
        expect(PopoverMonthPicker).toHaveBeenCalledTimes(2);
        const [picker, picker18] = vi.mocked(PopoverMonthPicker).mock.calls.map(([props]) => props);

        expect(picker.value).toBe("01.04.2026");
        expect(picker18.value).toBe("01.05.2026");
        picker18.onChange(new Date(2026, 3, 1));

        expect(onChange).toHaveBeenCalledExactlyOnceWith(barn18Key, "2026-04-01");
    });

    it("does not treat the same month in a different year as the default", () => {
        vi.setSystemTime(new Date(2026, 11, 15, 12));
        mockBehandling("2025-12-01");
        const onChange = vi.fn();
        const picker = renderPicker(undefined, onChange);

        picker.onChange(new Date(2026, 0, 1));

        expect(onChange).toHaveBeenCalledExactlyOnceWith(barnKey, "2026-01-01");
    });

    it("allows rendering and selecting a month without a change callback", () => {
        renderToStaticMarkup(<BarnDetaljerOpprettFF barn={[barn]} />);
        const picker = vi.mocked(PopoverMonthPicker).mock.calls[0][0];

        expect(() => picker.onChange(new Date(2026, 3, 1))).not.toThrow();
    });

    it("does not render a reassessment picker for a child that is not being reassessed", () => {
        renderToStaticMarkup(<BarnDetaljerOpprettFF barn={[{ ...barn, erRevurdering: false }]} />);

        expect(PopoverMonthPicker).not.toHaveBeenCalled();
    });
});
