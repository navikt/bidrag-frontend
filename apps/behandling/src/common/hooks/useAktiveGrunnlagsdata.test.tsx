import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryKeys, useAktiveGrunnlagsdata } from "./useApiData";

const api = vi.hoisted(() => ({ aktivereGrunnlag: vi.fn() }));

vi.mock("../constants/api", () => ({
    BEHANDLING_API_V1: { api },
    BIDRAG_DOKUMENT_PRODUKSJON_API: {},
    ORGANISASJON_API: {},
    PERSON_API: {},
    SAK_API: {},
    VEDTAK_API: {},
}));
vi.mock("../context/BehandlingContext", () => ({
    useBehandlingProvider: () => ({ behandlingId: "1" }),
}));

const svar = { inntekterV2: { årsinntekter: [] }, ikkeAktiverteEndringerIGrunnlagsdata: {}, aktiveGrunnlagsdata: {} };

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;
let aktiver: ReturnType<typeof useAktiveGrunnlagsdata>;

const Krok = () => {
    aktiver = useAktiveGrunnlagsdata();
    return null;
};

const renderMedBehandling = async (behandling: object) => {
    queryClient = new QueryClient();
    queryClient.setQueryData(QueryKeys.behandlingV2("1"), behandling);
    vi.spyOn(queryClient, "invalidateQueries");
    await act(async () =>
        root.render(
            <QueryClientProvider client={queryClient}>
                <Krok />
            </QueryClientProvider>,
        ),
    );
};

beforeEach(() => {
    api.aktivereGrunnlag.mockResolvedValue({ data: svar });
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe("useAktiveGrunnlagsdata", () => {
    it("henter behandlingen på nytt i særbidrag, fordi grensen for selvforsørget kan endres", async () => {
        await renderMedBehandling({ utgift: { rimeligÅInnvilge: { barnetsInntektErOverGrensen: false } } });

        await act(async () => {
            await aktiver.mutateAsync({ personident: "123", type: "inntekt" as never });
        });

        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: QueryKeys.behandlingV2("1") });
        expect(queryClient.getQueryData<{ inntekterV2: unknown }>(QueryKeys.behandlingV2("1"))?.inntekterV2).toEqual(
            svar.inntekterV2,
        );
    });

    it("henter ikke behandlingen på nytt når behandlingen ikke er særbidrag", async () => {
        await renderMedBehandling({ utgift: undefined });

        await act(async () => {
            await aktiver.mutateAsync({ personident: "123", type: "inntekt" as never });
        });

        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
});
