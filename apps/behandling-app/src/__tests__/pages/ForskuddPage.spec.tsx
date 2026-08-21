import { IdentUtils } from "@navikt/bidrag-ui-common";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlagProvider, type IConfig } from "@unleash/proxy-client-react";
import { expect } from "chai";
import { describe } from "mocha";
import { rest } from "msw";
import { setupServer } from "msw/node";
import origFetch from "node-fetch";
import type { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import sinon from "sinon";

import { behandlingMockApiData } from "../../__mocks__/testdata/behandlingTestData";
import { boforholdData } from "../../__mocks__/testdata/boforholdTestData";
import environment from "../../environment";
import { ForskuddBehandlingProviderWrapper } from "../../forskudd/context/ForskuddBehandlingProviderWrapper";
import { ForskuddPage } from "../../forskudd/pages/forskudd/ForskuddPage";

const queryClient = new QueryClient();
const config: IConfig = {
    url: "http://localhost/unleash",
    clientKey: "sasdsad",
    refreshInterval: 15, // How often (in seconds) the client should poll the proxy for updates
    appName: "bidrag-behandling-ui",
};

const RouterWrapper = ({ children }: PropsWithChildren<unknown>) => {
    return (
        <FlagProvider config={config}>
            <BrowserRouter>{children}</BrowserRouter>
        </FlagProvider>
    );
};
const renderWithRouter = (ui, { route = "/" } = {}) => {
    window.history.pushState({}, "Test page", route);

    return {
        user: userEvent.setup(),
        ...render(ui, { wrapper: RouterWrapper }),
    };
};

const server = setupServer(
    rest.post(`http://localhost/token`, (_req, res, ctx) => {
        return res(ctx.text("123334343"));
    }),
    rest.get(`http://localhost/unleash`, (_req, res, ctx) => {
        return res(
            ctx.set("Content-Type", "application/json"),
            ctx.body(
                JSON.stringify({
                    toggles: [
                        {
                            name: "behandling.fattevedtak",
                            enabled: false,
                            variant: {
                                name: "disabled",
                                enabled: false,
                            },
                            impressionData: true,
                        },
                        {
                            name: "behandling.skjermbilde.vedtak",
                            enabled: true,
                            variant: {
                                name: "disabled",
                                enabled: false,
                            },
                            impressionData: true,
                        },
                        {
                            name: "behandling.skjermbilde.inntekter",
                            enabled: true,
                            variant: {
                                name: "disabled",
                                enabled: false,
                            },
                            impressionData: true,
                        },
                    ],
                }),
            ),
        );
    }),
    rest.options(`${environment.url.bidragBehandling}/api/v1/behandling/:behandlingId`, (_req, res, ctx) => {
        return res(ctx.set({ "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*" }));
    }),
    rest.options(`${environment.url.bidragBehandling}/api/v2/behandling/:behandlingId`, (_req, res, ctx) => {
        return res(ctx.set({ "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*" }));
    }),
    rest.options(
        `${environment.url.bidragBehandling}/api/v1/behandling/:behandlingId/virkningstidspunkt`,
        (_req, res, ctx) => {
            return res(ctx.set({ "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*" }));
        },
    ),
    rest.options(`${environment.url.bidragBehandling}/api/v1/behandling/:behandlingId/boforhold`, (_req, res, ctx) => {
        return res(ctx.set({ "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*" }));
    }),
    rest.get(`${environment.url.bidragBehandling}/api/v1/behandling/:behandlingId/boforhold`, (_req, res, ctx) => {
        return res(
            ctx.set({
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            }),
            ctx.body(JSON.stringify(boforholdData)),
        );
    }),
    rest.get(`${environment.url.bidragBehandling}/api/v1/behandling/:behandlingId`, (_req, res, ctx) => {
        return res(
            ctx.set({
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            }),
            ctx.body(JSON.stringify(behandlingMockApiData)),
        );
    }),
    rest.get(`${environment.url.bidragBehandling}/api/v2/behandling/:behandlingId`, (_req, res, ctx) => {
        return res(
            ctx.set({
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            }),
            ctx.body(JSON.stringify(behandlingMockApiData)),
        );
    }),
    rest.options(`${environment.url.bidragPerson}/informasjon`, (_req, res, ctx) => {
        return res(ctx.set({ "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*" }));
    }),
    rest.post(`${environment.url.bidragPerson}/informasjon`, (_req, res, ctx) => {
        return res(
            ctx.set({
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
            }),
            ctx.body(
                JSON.stringify({
                    ident: IdentUtils.generateFnr(),
                    navn: "Forsikring, Kognitiv",
                    fornavn: "Kognitiv",
                    etternavn: "Forsikring",
                    kjønn: "KVINNE",
                    kjoenn: "KVINNE",
                    fødselsdato: "2021-12-03",
                    foedselsdato: "2021-12-03",
                    aktørId: "2601080498043",
                    aktoerId: "2601080498043",
                    kortnavn: "Kognitiv Forsikring",
                    kortNavn: "Kognitiv Forsikring",
                }),
            ),
        );
    }),
);

before(() => {
    server.listen();
    sinon.stub(global, "fetch").callsFake((url, ...params) => {
        const absoluteURL = url.startsWith("/") ? `http://localhost${url}` : url;
        return origFetch(absoluteURL, ...params);
    });
});

afterEach(() => server.resetHandlers());
after(() => server.close());

describe("ForskuddPage", () => {
    it("should render Virkningstidspunkt", async () => {
        renderWithRouter(
            <QueryClientProvider client={queryClient}>
                <ForskuddBehandlingProviderWrapper>
                    <ForskuddPage />
                </ForskuddBehandlingProviderWrapper>
            </QueryClientProvider>,
            { route: "/forskudd/1?steg=virkningstidspunkt" },
        );

        await waitFor(() => {
            const activeStepButton = document.querySelector(".navds-stepper__step--active");
            expect(activeStepButton.innerHTML).includes("Virkningstidspunkt");
        });
    });

    it("should render Boforhold", async () => {
        renderWithRouter(
            <QueryClientProvider client={queryClient}>
                <ForskuddBehandlingProviderWrapper>
                    <ForskuddPage />
                </ForskuddBehandlingProviderWrapper>
            </QueryClientProvider>,
            { route: "/forskudd/1?steg=boforhold" },
        );

        await waitFor(() => {
            const activeStepButton = document.querySelector(".navds-stepper__step--active");
            expect(activeStepButton.innerHTML).includes("Boforhold");
        });
    });

    it("should render Vedtak", async () => {
        renderWithRouter(
            <QueryClientProvider client={queryClient}>
                <ForskuddBehandlingProviderWrapper>
                    <ForskuddPage />
                </ForskuddBehandlingProviderWrapper>
            </QueryClientProvider>,
            { route: "/forskudd/1?steg=vedtak" },
        );

        await waitFor(() => {
            const activeStepButton = document.querySelector(".navds-stepper__step--active");
            expect(activeStepButton.innerHTML).includes("Vedtak");
        });
    });
});
