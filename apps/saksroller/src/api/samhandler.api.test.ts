import { SecureLoggerService } from "@bidrag/common";
import { genererFnr } from "@bidrag/common/playwright/testing/fnrGenerator.ts";
import { useMutation } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ISamhandlerPersonInfo } from "./samhandler.api";
import { useHentSamhandlerEllerPersonForIdent } from "./samhandler.api";

const mocks = vi.hoisted(() => ({
    hentSamhandler: vi.fn(),
    hentPersonPost: vi.fn(),
    queryClient: {
        getQueryData: vi.fn(),
        setQueryData: vi.fn(),
    },
}));

vi.mock("@bidrag/api", () => ({
    BIDRAG_PERSON_API: { informasjon: { hentPersonPost: mocks.hentPersonPost } },
    BIDRAG_SAMHANDLER_API: { samhandler: { hentSamhandler: mocks.hentSamhandler } },
    TilgangsFeilError: class TilgangsFeilError extends Error {},
}));

vi.mock("@bidrag/common", () => ({
    IdentUtils: {
        isSamhandlerId: (ident: string) => ident.startsWith("samhandler-"),
        isFnr: (ident: string) => /^\d{11}$/.test(ident),
    },
    ObjectUtils: { isEmpty: (value: string) => !value },
    SecureLoggerService: { info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@tanstack/react-query", () => ({
    queryOptions: (options: unknown) => options,
    useMutation: vi.fn((options: unknown) => options),
    useQuery: vi.fn(),
    useQueryClient: vi.fn(() => mocks.queryClient),
}));

const TEST_FNR = genererFnr();
const SAMHANDLER_IDENT = "samhandler-test-123";

type TestMutationOptions = {
    mutationFn: (variables: { ident: string }) => Promise<ISamhandlerPersonInfo>;
};

function getMutationFn(sjekkSamhandler = true) {
    useHentSamhandlerEllerPersonForIdent(sjekkSamhandler);
    const options = vi.mocked(useMutation).mock.lastCall?.[0] as unknown as TestMutationOptions | undefined;
    if (!options) throw new Error("Forventet oppsettsalternativer for mutasjonen");
    return options.mutationFn;
}

describe("useHentSamhandlerEllerPersonForIdent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.hentSamhandler.mockReset();
        mocks.hentPersonPost.mockReset();
        mocks.queryClient.getQueryData.mockReset().mockReturnValue(undefined);
        mocks.queryClient.setQueryData.mockReset();
    });

    it("klassifiserer et faktisk samhandler-svar som SAMHANDLER og bruker samhandlerId, ikke offentligId", async () => {
        mocks.hentSamhandler.mockResolvedValue({
            status: 200,
            data: {
                samhandlerId: SAMHANDLER_IDENT,
                offentligId: TEST_FNR,
                navn: "Test samhandler",
            },
        });

        const resultat = await getMutationFn()({ ident: SAMHANDLER_IDENT });

        expect(resultat).toMatchObject({
            ident: SAMHANDLER_IDENT,
            offentligId: TEST_FNR,
            mottakertype: "SAMHANDLER",
            isValid: true,
        });
        expect(mocks.hentSamhandler).toHaveBeenCalledWith(JSON.stringify(SAMHANDLER_IDENT));
        expect(mocks.hentPersonPost).not.toHaveBeenCalled();
    });

    it("klassifiserer et faktisk personsvar som PERSON", async () => {
        mocks.hentPersonPost.mockResolvedValue({
            status: 200,
            data: { ident: TEST_FNR, visningsnavn: "Test person", aktørId: "actor-test" },
        });

        const resultat = await getMutationFn()({ ident: TEST_FNR });

        expect(resultat).toMatchObject({ ident: TEST_FNR, mottakertype: "PERSON", isValid: true });
        expect(mocks.hentPersonPost).toHaveBeenCalledWith({ ident: TEST_FNR });
        expect(mocks.hentSamhandler).not.toHaveBeenCalled();
    });

    it("bruker gyldige cachedata når mottakertype er kjent", async () => {
        const cachedData: ISamhandlerPersonInfo = {
            ident: TEST_FNR,
            visningsnavn: "Test person",
            isValid: true,
            mottakertype: "PERSON",
        };
        mocks.queryClient.getQueryData.mockReturnValue(cachedData);

        const resultat = await getMutationFn()({ ident: TEST_FNR });

        expect(resultat).toBe(cachedData);
        expect(mocks.hentPersonPost).not.toHaveBeenCalled();
        expect(mocks.hentSamhandler).not.toHaveBeenCalled();
        expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it("henter på nytt når cachedata mangler mottakertype", async () => {
        mocks.queryClient.getQueryData.mockReturnValue({
            ident: SAMHANDLER_IDENT,
            isValid: true,
        });
        mocks.hentSamhandler.mockResolvedValue({
            status: 200,
            data: { samhandlerId: SAMHANDLER_IDENT, navn: "Test samhandler" },
        });

        const resultat = await getMutationFn()({ ident: SAMHANDLER_IDENT });

        expect(resultat).toMatchObject({ ident: SAMHANDLER_IDENT, mottakertype: "SAMHANDLER", isValid: true });
        expect(mocks.hentSamhandler).toHaveBeenCalledWith(JSON.stringify(SAMHANDLER_IDENT));
        expect(mocks.queryClient.setQueryData).toHaveBeenCalledWith(
            ["hent_samhandler_eller_person", SAMHANDLER_IDENT],
            resultat,
        );
    });

    it.each([
        undefined,
        null,
        {},
        { visningsnavn: "Ufullstendig svar" },
    ])("holder et personsvar med manglende body eller ident ugyldig: %s", async (data) => {
        mocks.hentPersonPost.mockResolvedValue({ status: 200, data });

        const resultat = await getMutationFn()({ ident: TEST_FNR });

        expect(resultat).toEqual({ ident: TEST_FNR, visningsnavn: "", isValid: false, søktIdent: TEST_FNR });
        expect(resultat.mottakertype).toBeUndefined();
    });

    it("henter på nytt når ugyldige cachedata kommer fra et ufullstendig personsvar", async () => {
        mocks.hentPersonPost
            .mockResolvedValueOnce({ status: 200, data: { visningsnavn: "Ufullstendig svar" } })
            .mockResolvedValueOnce({
                status: 200,
                data: { ident: TEST_FNR, visningsnavn: "Test person", aktørId: "actor-test" },
            });

        let cachedData: ISamhandlerPersonInfo | undefined;
        mocks.queryClient.getQueryData.mockImplementation(() => cachedData);
        mocks.queryClient.setQueryData.mockImplementation((_queryKey, data) => {
            cachedData = data as ISamhandlerPersonInfo;
        });

        const mutationFn = getMutationFn();
        const førsteResultat = await mutationFn({ ident: TEST_FNR });
        const resultat = await mutationFn({ ident: TEST_FNR });

        expect(førsteResultat.isValid).toBe(false);
        expect(resultat).toMatchObject({ ident: TEST_FNR, mottakertype: "PERSON", isValid: true });
        expect(mocks.hentPersonPost).toHaveBeenCalledTimes(2);
        expect(mocks.hentPersonPost).toHaveBeenNthCalledWith(2, { ident: TEST_FNR });
        expect(mocks.queryClient.setQueryData).toHaveBeenLastCalledWith(
            ["hent_samhandler_eller_person", TEST_FNR],
            resultat,
        );
    });

    it("videresender nettverksfeil uendret og cacher ikke feil", async () => {
        const networkError = new Error("Nettverksfeil");
        mocks.hentPersonPost.mockRejectedValue(networkError);

        await expect(getMutationFn()({ ident: TEST_FNR })).rejects.toBe(networkError);

        expect(SecureLoggerService.warn).toHaveBeenCalledTimes(1);
        expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it.each([401, 403])("oversetter %i til tilgangsfeil og cacher ikke svaret", async (status) => {
        mocks.hentPersonPost.mockRejectedValue(Object.assign(new Error("Avvist"), { response: { status } }));

        await expect(getMutationFn()({ ident: TEST_FNR })).rejects.toThrow(
            `Du har ikke tilgang til informasjon om denne personen ${TEST_FNR}. Dette kan skyldes diskresjonskode eller manglende rettigheter.`,
        );

        expect(SecureLoggerService.warn).toHaveBeenCalledTimes(2);
        expect(SecureLoggerService.warn).toHaveBeenNthCalledWith(2, `Ingen tilgang til person ${TEST_FNR}`);
        expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it.each([
        { beskrivelse: "person", ident: TEST_FNR, apiMock: mocks.hentPersonPost },
        { beskrivelse: "samhandler", ident: SAMHANDLER_IDENT, apiMock: mocks.hentSamhandler },
    ])("gir en generell ikke-treff-feil ved avvist 404 fra %s og cacher ikke feilen", async ({ ident, apiMock }) => {
        apiMock.mockRejectedValue(Object.assign(new Error("Not found"), { response: { status: 404 } }));

        await expect(getMutationFn()({ ident })).rejects.toThrow("Ingen treff på oppgitt ident");

        expect(SecureLoggerService.warn).toHaveBeenCalledTimes(1);
        expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it.each([
        { beskrivelse: "person", ident: TEST_FNR, apiMock: mocks.hentPersonPost },
        { beskrivelse: "samhandler", ident: SAMHANDLER_IDENT, apiMock: mocks.hentSamhandler },
    ])("gir en generell ikke-treff-feil ved resolved 404 fra %s og cacher ikke feilen", async ({ ident, apiMock }) => {
        apiMock.mockResolvedValue({ status: 404, data: {} });

        await expect(getMutationFn()({ ident })).rejects.toThrow("Ingen treff på oppgitt ident");

        expect(SecureLoggerService.warn).toHaveBeenCalledTimes(1);
        expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it.each([201, 204])("behandler uventet personstatus %i som feil og cacher ikke svaret", async (status) => {
        mocks.hentPersonPost.mockResolvedValue({ status, data: {} });

        await expect(getMutationFn()({ ident: TEST_FNR })).rejects.toThrow(
            `Personoppslaget ga uventet status ${status}`,
        );

        expect(SecureLoggerService.warn).toHaveBeenCalledTimes(1);
        expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
    });

    it.each([
        [
            "ikke 200",
            { status: 500, data: { samhandlerId: SAMHANDLER_IDENT } },
            "Samhandleroppslaget ga uventet status 500",
        ],
        [
            "mangler id",
            { status: 200, data: { navn: "Test samhandler" } },
            `Samhandler mangler id for ident ${SAMHANDLER_IDENT}`,
        ],
        ["mangler body", { status: 200, data: undefined }, `Samhandler mangler id for ident ${SAMHANDLER_IDENT}`],
        ["har null-body", { status: 200, data: null }, `Samhandler mangler id for ident ${SAMHANDLER_IDENT}`],
    ])("logger én gang og cacher ikke samhandlersvar som %s", async (_beskrivelse, response, errorMessage) => {
        mocks.hentSamhandler.mockResolvedValue(response);

        await expect(getMutationFn()({ ident: SAMHANDLER_IDENT })).rejects.toThrow(errorMessage);

        expect(SecureLoggerService.warn).toHaveBeenCalledTimes(1);
        expect(mocks.queryClient.setQueryData).not.toHaveBeenCalled();
    });
});
