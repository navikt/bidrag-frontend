import { TypeArsakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { firstDayOfMonth, lastDayOfMonth } from "@bidrag/common";
import { describe, expect, it } from "vitest";
import { behandlingMockApiData } from "../../__mocks__/testdata/behandlingTestData";
import {
    aarsakToVirkningstidspunktMapper,
    getFomAndTomForMonthPicker,
    getSoktFraOrMottatDato,
} from "../../common/helpers/virkningstidspunktHelpers";
import { addMonthsIgnoreDay, deductMonths, deductMonthsIgnoreday } from "../../utils/date-utils";

describe("VirkningstidspunktFormHelpers", () => {
    it("should return later date of the two - soktFraDato or mottatoDato", () => {
        const soktFra = new Date("2019-04-01");
        const mottattdato = new Date("2019-11-03");
        const virkningsDato = getSoktFraOrMottatDato(soktFra, mottattdato);
        expect(virkningsDato.toLocaleDateString()).equals(mottattdato.toLocaleDateString());
    });

    it("should set the date to mottatoDate if soktFraDato is earlier when årsak is fra kravfremsettelse", () => {
        const behandling = behandlingMockApiData;
        const aarsak = TypeArsakstype.FRA_KRAVFREMSETTELSE;
        const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn[0];
        const virkningsDato = aarsakToVirkningstidspunktMapper(aarsak, behandling, selectedVirkningstidspunkt);
        expect(virkningsDato.toLocaleDateString()).equals(
            firstDayOfMonth(new Date(behandling.mottattdato)).toLocaleDateString(),
        );
    });

    it("should set the date to soktFraDato if mottatoDato is later when årsak is fra kravfremsettelse", () => {
        const behandling = { ...behandlingMockApiData, mottattdato: "2019-04-03", søktFomDato: "2019-10-03" };
        const aarsak = TypeArsakstype.FRA_KRAVFREMSETTELSE;
        const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn[0];
        const virkningsDato = aarsakToVirkningstidspunktMapper(aarsak, behandling, selectedVirkningstidspunkt);
        expect(virkningsDato.toLocaleDateString()).equals(
            firstDayOfMonth(new Date(behandling.søktFomDato)).toLocaleDateString(),
        );
    });

    it("should set the date to 3 months back in time if soktFraDato is in past and not earlier than mottattdato when årsak is 3 måneder tilbake", () => {
        const mottattdato = "2019-07-03";
        const behandling = { ...behandlingMockApiData, mottattdato, søktFomDato: "2019-02-03" };
        const aarsak = TypeArsakstype.TREMANEDERTILBAKE;
        const threeMonthsBackInTimeFromMottatDato = firstDayOfMonth(deductMonths(new Date(mottattdato), 3));
        const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn[0];
        const virkningsDato = aarsakToVirkningstidspunktMapper(aarsak, behandling, selectedVirkningstidspunkt);
        expect(virkningsDato.toLocaleDateString()).equals(threeMonthsBackInTimeFromMottatDato.toLocaleDateString());
    });

    it("should set the date to soktFraDato if it is in past and less than 3 months earlier than mottattdato when årsak is 3 måneder tilbake", () => {
        const mottattdato = "2019-07-03";
        const behandling = { ...behandlingMockApiData, mottattdato, søktFomDato: "2019-05-03" };
        const aarsak = TypeArsakstype.TREMANEDERTILBAKE;
        const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn[0];
        const virkningsDato = aarsakToVirkningstidspunktMapper(aarsak, behandling, selectedVirkningstidspunkt);
        expect(virkningsDato.toLocaleDateString()).equals(
            firstDayOfMonth(new Date(behandling.søktFomDato)).toLocaleDateString(),
        );
    });

    it("should set the date to soktFraDato if it is in past and earlier than mottattdato when årsak is 3 måneder tilbake", () => {
        const mottattdato = "2019-07-03";
        const behandling = { ...behandlingMockApiData, mottattdato, søktFomDato: "2019-08-03" };
        const aarsak = TypeArsakstype.TREMANEDERTILBAKE;
        const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn[0];
        const virkningsDato = aarsakToVirkningstidspunktMapper(aarsak, behandling, selectedVirkningstidspunkt);
        expect(virkningsDato.toLocaleDateString()).equals(
            firstDayOfMonth(new Date(behandling.søktFomDato)).toLocaleDateString(),
        );
    });

    it("should set the date to soktFraDato when årsak is fra søknadstidspunkt", () => {
        const behandling = { ...behandlingMockApiData };
        const aarsak = TypeArsakstype.FRASOKNADSTIDSPUNKT;
        const selectedVirkningstidspunkt = behandling.virkningstidspunktV3.barn[0];
        const virkningsDato = aarsakToVirkningstidspunktMapper(aarsak, behandling, selectedVirkningstidspunkt);
        expect(virkningsDato.toLocaleDateString()).equals(
            firstDayOfMonth(new Date(behandling.søktFomDato)).toLocaleDateString(),
        );
    });

    it("getFomAndTomForMonthPicker should set fom to first day of month of virkningstidspunkt and tom to last day of previous month", () => {
        const virkningsDato = new Date("2019-07-03");
        const [fom, tom] = getFomAndTomForMonthPicker(virkningsDato);
        expect(fom.toLocaleDateString()).equals(firstDayOfMonth(virkningsDato).toLocaleDateString());
        expect(tom.toLocaleDateString()).equals(
            lastDayOfMonth(deductMonthsIgnoreday(new Date(), 1)).toLocaleDateString(),
        );
    });

    it("getFomAndTomForMonthPicker should set fom to first day of month of virkningstidspunkt and tom to last day of previous month if virkningsdato is in future", () => {
        const virkningsDato = addMonthsIgnoreDay(new Date(), 3);
        const [fom, tom] = getFomAndTomForMonthPicker(virkningsDato);
        expect(fom.toLocaleDateString()).equals(firstDayOfMonth(virkningsDato).toLocaleDateString());
        expect(tom.toLocaleDateString()).equals(
            lastDayOfMonth(deductMonthsIgnoreday(new Date(), 1)).toLocaleDateString(),
        );
    });
});
