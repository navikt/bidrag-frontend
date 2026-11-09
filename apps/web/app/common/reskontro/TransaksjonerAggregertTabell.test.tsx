import type { Transaksjon } from "@bidrag/api/BidragReskontroApi";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TransaksjonerAggregertTabell } from "./TransaksjonerAggregertTabell";

vi.mock("./DetaljTransaksjonerTabell.tsx", () => ({
    DetaljTransaksjonerTabell: () => null,
}));

describe("TransaksjonerAggregertTabell", () => {
    it("viser tomtilstand uten transaksjoner", () => {
        expect(renderToStaticMarkup(<TransaksjonerAggregertTabell transaksjoner={[]} totalTransCount={0} />)).toBe(
            "<p>Ingen transaksjoner funnet.</p>",
        );
    });

    it.each(["space-0", "space-4"] as const)("grupperer og sorterer transaksjoner med %s detaljpadding", (padding) => {
        const transaksjoner: Transaksjon[] = [
            { dato: "2026-11-01", transaksjonskode: "A1", beløp: 42, restBeløp: 2 },
            { dato: "2026-11-09", transaksjonskode: "A1", beløp: 75, restBeløp: 5 },
            { dato: "2026-11-01", transaksjonskode: "A1", beløp: 8, restBeløp: 3 },
        ];
        const html = renderToStaticMarkup(
            <TransaksjonerAggregertTabell
                transaksjoner={transaksjoner}
                totalTransCount={7}
                detaljPaddingInline={padding}
            />,
        );

        expect(html).toContain("Antall transaksjoner 3/7");
        expect(html).toContain("Sum beløp 125");
        expect(html).toContain("Sum restbeløp 10");
        expect(html.match(/01\.11\.2026/g)).toHaveLength(1);
        expect(html.indexOf("09.11.2026")).toBeLessThan(html.indexOf("01.11.2026"));
    });
});
