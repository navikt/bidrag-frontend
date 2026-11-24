import { HTTPStatus } from "../../enum/HttpStatus";
import PersonSearchService, { FAMILIERELASJONER_PATH } from "../../service/PersonSearchService";
import { BA, FODSELSNUMMER } from "../mockdata/personMock";

const HTTP_NOT_FOUND = 404;

describe("PersonSearchService.hentFamilierelasjoner", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("calls the proxy with trimmed fnr and cors credentials", async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify(BA(FODSELSNUMMER)), { status: HTTPStatus.OK }));

        await new PersonSearchService().hentFamilierelasjoner(`  ${FODSELSNUMMER} `);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(FAMILIERELASJONER_PATH + FODSELSNUMMER, {
            mode: "cors",
            credentials: "include",
        });
    });

    it("returns parsed body on OK", async () => {
        const body = BA(FODSELSNUMMER);
        fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: HTTPStatus.OK }));

        await expect(new PersonSearchService().hentFamilierelasjoner(FODSELSNUMMER)).resolves.toEqual(body);
    });

    it("returns undefined on non-OK status", async () => {
        fetchMock.mockResolvedValue(new Response("not found", { status: HTTP_NOT_FOUND }));

        await expect(new PersonSearchService().hentFamilierelasjoner(FODSELSNUMMER)).resolves.toBeUndefined();
    });

    it("returns null and logs without fnr on network error", async () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

        await expect(new PersonSearchService().hentFamilierelasjoner(FODSELSNUMMER)).resolves.toBeNull();

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(logSpy.mock.calls[0].map(String))).not.toContain(FODSELSNUMMER);
    });
});
