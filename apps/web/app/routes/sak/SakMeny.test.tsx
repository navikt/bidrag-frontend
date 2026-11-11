import { useFlag } from "@unleash/proxy-client-react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SakMeny from "./SakMeny.tsx";

vi.mock("@unleash/proxy-client-react", () => ({ useFlag: vi.fn() }));

function renderMedFlagg(aktiveFlagg: string[]) {
    vi.mocked(useFlag).mockImplementation((flagg) => aktiveFlagg.includes(flagg));
    return renderToStaticMarkup(
        <MemoryRouter>
            <SakMeny saksnummer="1234567" />
        </MemoryRouter>,
    );
}

describe("SakMeny", () => {
    beforeEach(() => {
        vi.mocked(useFlag).mockReset();
    });

    it("viser Saksroller-lenken når feature flagget er på", () => {
        const html = renderMedFlagg(["bisys.ny_rollebilde"]);

        expect(html).toContain('href="/sak/1234567/saksroller"');
        expect(html).toContain("Saksroller");
    });

    it("skjuler Saksroller-lenken når feature flagget er av", () => {
        const html = renderMedFlagg([]);

        expect(html).not.toContain("/sak/1234567/saksroller");
        expect(html).toContain('href="/sak/1234567/sakshistorikk"');
    });

    it("viser Sak-lenken når saksideflagget er på", () => {
        const html = renderMedFlagg(["bisys.ny_sakside"]);

        expect(html).toContain('href="/sak/1234567"');
    });

    it("skjuler Sak-lenken når saksideflagget er av", () => {
        const html = renderMedFlagg([]);

        expect(html).not.toContain('href="/sak/1234567"');
    });
});
