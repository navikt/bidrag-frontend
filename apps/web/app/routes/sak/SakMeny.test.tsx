import { useFlag } from "@unleash/proxy-client-react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SakMeny from "./SakMeny.tsx";

vi.mock("@unleash/proxy-client-react", () => ({ useFlag: vi.fn() }));

describe("SakMeny", () => {
    beforeEach(() => {
        vi.mocked(useFlag).mockReset();
    });

    it("viser Saksroller-lenken når feature flagget er på", () => {
        vi.mocked(useFlag).mockReturnValue(true);

        const html = renderToStaticMarkup(
            <MemoryRouter>
                <SakMeny saksnummer="1234567" />
            </MemoryRouter>,
        );

        expect(useFlag).toHaveBeenCalledWith("bisys.ny_rollebilde");
        expect(html).toContain('href="/sak/1234567/saksroller"');
        expect(html).toContain("Saksroller");
    });

    it("skjuler Saksroller-lenken når feature flagget er av", () => {
        vi.mocked(useFlag).mockReturnValue(false);

        const html = renderToStaticMarkup(
            <MemoryRouter>
                <SakMeny saksnummer="1234567" />
            </MemoryRouter>,
        );

        expect(html).not.toContain("/sak/1234567/saksroller");
        expect(html).toContain('href="/sak/1234567/sakshistorikk"');
    });
});
