import "./VedtakExplorer.css";

import {Alert, Button, CopyButton, Heading, Loader, Modal, Search, Switch} from "@navikt/ds-react";
import {useSuspenseQuery} from "@tanstack/react-query";
import mermaid from "mermaid";
import React, {Suspense, useEffect, useRef, useState} from "react";
import {ErrorBoundary, FallbackProps} from "react-error-boundary";

import {EChartsOption, ReactECharts} from "./ReactECharts";
import PageWrapper from "../../PageWrapper.tsx";
import missingImg from "./missing.jpeg";
import {vedtakToMermaidResponse} from "./TreeToMermaidMapper";
import {BEHANDLING_API_V1, BIDRAG_VEDTAK_API, TreeChild, TreeChildType} from "@bidrag/api";
import {mapVedtakToTree} from "./VedtakToGraphMapper";
import {lastVisningsnavn} from "./VisningsnavnMapper";
import {Grunnlagstype, VedtakDto} from "@bidrag/api/BidragVedtakApi";
import {useSearchParams} from "react-router";

mermaid.initialize({
    startOnLoad: true,
    flowchart: {useMaxWidth: true, htmlLabels: true, curve: "basis"},
    securityLevel: "loose",
    look: "handDrawn",
    theme: "base",
});

interface VedtakExplorerGraphProps {
    behandlingId?: string;
    vedtakId?: string;
}

export default () => {
    lastVisningsnavn();
    return (
        <PageWrapper name="">
            <VedtakExplorer/>
        </PageWrapper>
    );
};

const existingSearchParams = () => paramsToObject(new URLSearchParams(window.location.search));

function paramsToObject(entries: URLSearchParams): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of entries) {
        result[key] = value;
    }
    return result;
}

function VedtakExplorer() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [id, setId] = useState<string | undefined>(searchParams.get("id") ?? undefined);
    const [isBehandlingId, setIsBehandlingId] = useState<boolean>(
        searchParams.get("erBehandlingId") === "true" ? true : false
    );

    const onSearch = (id: string) => {
        setSearchParams({...existingSearchParams(), id});
        setId(id);
    };

    return (
        <div className="p-2" style={{width: "98vw", marginLeft: "calc(50% - 49vw)"}}>
            <Heading size="medium">Vedtak explorer</Heading>
            <div className="max-w-96 flex flex-col gap-0.5">
                <Search
                    size="small"
                    hideLabel={true}
                    label="Visualiser behandling"
                    variant="primary"
                    defaultValue={id}
                    onSearchClick={onSearch}
                ></Search>
                <Switch
                    checked={isBehandlingId}
                    size="small"
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSearchParams({...existingSearchParams(), erBehandlingId: isChecked ? "true" : "false"});
                        setIsBehandlingId(e.target.checked);
                    }}
                >
                    Er behandlingsid
                </Switch>
            </div>
            <div className="border-2 border-solid w-full">
                <VisualiserVedtakGraph
                    behandlingId={isBehandlingId ? id : undefined}
                    vedtakId={isBehandlingId ? undefined : id}
                />
            </div>
        </div>
    );
}

function VisualiserVedtakGraph({behandlingId, vedtakId}: VedtakExplorerGraphProps) {
    if (behandlingId == null && vedtakId == null) {
        return (
            <div>
                Søk etter vedtaksid som du vil visualisere
                <img src={missingImg} alt={""}></img>
            </div>
        );
    }
    return (
        <div>
            <ErrorBoundary
                fallbackRender={(props: FallbackProps) => {
                    return (
                        <Alert size="small" variant="error">
                            Kunne ikke hente {behandlingId ? "behandling" : "vedtak"} med
                            id {behandlingId ?? vedtakId}:{" "}
                            {(props.error as Error)?.message ?? String(props.error)}
                        </Alert>
                    );
                }}
            >
                <Suspense
                    fallback={
                        <div className="flex justify-center">
                            <Loader size="3xlarge" title="venter..." variant="interaction"/>
                        </div>
                    }
                >
                    <VedtakTreeGraph behandlingId={behandlingId} vedtakId={vedtakId}/>
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

interface VedtakDetaljer {
    tittel: string;
    innhold: object;
    type?: string;
    gjelderReferanse?: string;
    gjelderBarnReferanse?: string;
}

function VedtakMermaidFlowChart({behandlingId, vedtakId}: VedtakExplorerGraphProps) {
    const {
        //@ts-ignore
        data: {mermaidResponse, vedtak},
    } = useSuspenseQuery({
        queryKey: ["mermaid", behandlingId, vedtakId],
        queryFn: async () => {
            const vedtakDto = await hentVedtakDto(behandlingId, vedtakId);
            const mermaidResponse = vedtakToMermaidResponse(vedtakDto.data as VedtakDto);
            return {mermaidResponse: mermaidResponse, vedtak: vedtakDto.data as VedtakDto};
        },
    });

    const isRendering = useRef(false);
    const [showDetails, setShowDetails] = useState<VedtakDetaljer | null>(null);
    const divRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // @ts-ignore
        window.callback = (id) => {
            console.log("CALLBACK", id);
            setShowDetails(getDetailsById(id) ?? null);
        };
    }, []);

    function getDetailsById(id: string): VedtakDetaljer | undefined {
        const grunnlag = mermaidResponse.grunnlagListe.find((d) => d.referanse === id);
        if (grunnlag)
            return {
                tittel: grunnlag.referanse,
                innhold: grunnlag.innhold as object,
                gjelderReferanse: grunnlag.gjelderReferanse,
                gjelderBarnReferanse: grunnlag.gjelderBarnReferanse,
                type: grunnlag.type,
            };
        if (mermaidResponse.vedtak.nodeId === id)
            return {
                tittel: mermaidResponse.vedtak.nodeId,
                innhold: mermaidResponse.vedtak,
            };
        const stønadsendring = mermaidResponse.stønadsendringer.find((d) => d.nodeId === id);
        if (stønadsendring)
            return {
                tittel: stønadsendring.nodeId,
                innhold: stønadsendring,
            };

        const periode = mermaidResponse.perioder.find((d) => d.nodeId === id);
        if (periode)
            return {
                tittel: periode.nodeId,
                innhold: periode,
            };
        return undefined;
    }

    useEffect(() => {
        if (isRendering.current) return;
        isRendering.current = true;
        mermaid
            .render("mermaidSvg", mermaidResponse.mermaidGraph, divRef.current ?? undefined)
            .then(async (res) => {
                if (!divRef.current) return;
                divRef.current.innerHTML = res.svg;
                if (res.bindFunctions) {
                    const firstEl = divRef.current.firstElementChild;
                    if (firstEl) res.bindFunctions(firstEl);
                }
                const {default: svgPanZoom} = await import("svg-pan-zoom");
                svgPanZoom("#mermaidSvg");
                isRendering.current = false;
            })
            .catch((e) => console.error("HERE", e));
    }, [mermaid]);
    return (
        <>
            <Modal
                style={{maxHeight: "1000px", maxWidth: "max-content"}}
                open={showDetails != null}
                header={{heading: showDetails?.tittel || '', size: "medium", closeButton: false}}
                closeOnBackdropClick
                onClose={() => setShowDetails(null)}
            >
                <Modal.Body>
                    {showDetails?.type && (
                        <dl>
                            <dt>Gjelder</dt>
                            <dd>{showDetails?.gjelderReferanse}</dd>
                            <dt>Grunnlagstype</dt>
                            <dd>{showDetails?.type}</dd>
                        </dl>
                    )}
                    <pre style={{maxHeight: "800px", overflow: "auto"}}>
                        {JSON.stringify(showDetails?.innhold, null, 2)}
                    </pre>
                </Modal.Body>
            </Modal>
            <div className="flex flex-row gap-4">
                <ShowMermaidGraphButton mermaidGraph={mermaidResponse.mermaidGraph}/>
                <ShowVedtakButton vedtak={vedtak}/>
            </div>
            <div ref={divRef} className="mermaid h-full"/>
        </>
    );
}

function VedtakTreeGraph({behandlingId, vedtakId}: VedtakExplorerGraphProps) {
    const {
        //@ts-ignore
        data: {tree, vedtak},
    } = useSuspenseQuery({
        queryKey: ["graph", behandlingId, vedtakId],
        queryFn: async () => {
            const vedtakDto = await hentVedtakDto(behandlingId, vedtakId);
            return {tree: mapVedtakToTree(vedtakDto.data as VedtakDto), vedtak: vedtakDto.data as VedtakDto};
        },
    });
    return (
        <>
            <ShowVedtakButton vedtak={vedtak}/>
            <ReactECharts option={toEchart(tree)} style={{height: "calc(100vh - 200px)", minHeight: "500px", margin: "auto"}}/>
        </>
    );
}

async function hentVedtakDto(behandlingId?: string, vedtakId?: string) {
    if (behandlingId != null) {
        // TODO ADMIN Usikker på om dette vil funke riktig
        console.log("TODO ADMIN: vi er i en løype som ikke er sikker")
        return BEHANDLING_API_V1.api.behandlingTilVedtak(Number(behandlingId));
    }
    return BIDRAG_VEDTAK_API.vedtak.hentVedtak(Number(vedtakId));
}

/**
 * Highlights JSON syntax with colors for better readability in tooltips
 */
function highlightJson(jsonString: string): string {
    return (jsonString
        // Color keys (text before colons)
        .replace(/("([^"]+)")\s*:/g, '<span style="color: #0066cc; font-weight: bold;">$1</span>:')
        // Color string values
        .replace(/:\s*("([^"]*)"|'([^']*)')/g, ': <span style="color: #008000;">$1</span>')
        // Color numbers
        .replace(/:\s*([-]?[\d.]+([eE][+-]?[\d]+)?)/g, ': <span style="color: #ff6600;">$1</span>')
        // Color booleans
        .replace(/:\s*(true|false)/g, ': <span style="color: #9933cc;">$1</span>')
        // Color null
        .replace(/:\s*(null)/g, ': <span style="color: #999999;">$1</span>'));
}

function toEchart(tree: TreeChild): EChartsOption {
    return {
        tooltip: {
            trigger: "item",
            showContent: true,
            renderMode: "html",
            triggerOn: "mousemove",
            enterable: true,
            hideDelay: 500,
            confine: true,
            extraCssText:
                "max-height: 80vh; width: 700px; overflow: auto; background-color: #f8f8f8; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);",
            position: (point: any, _params: any, _dom: any, _rect: any, size: any) => {
                // Smart positioning: try right first, fallback to left
                const contentWidth = size.contentSize[0];
                const contentHeight = size.contentSize[1];
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                let x = point[0] + 20;
                let y = point[1] + 20;

                if (x + contentWidth > viewportWidth) {
                    x = point[0] - contentWidth - 20;
                }
                if (y + contentHeight > viewportHeight) {
                    y = viewportHeight - contentHeight - 20;
                }

                return [x, y];
            },
        },
        roam: true,
        series: [
            {
                type: "tree",
                roam: true,
                layout: "orthogonal",
                initialTreeDepth: 4,
                name: "Vedtak",
                data: [toEchartData(tree)],
                top: "1%",
                left: "10%",
                bottom: "1%",
                right: "30%",
                symbolSize: 7,
                label: {
                    position: "left",
                    verticalAlign: "middle",
                    align: "right",
                },
                leaves: {
                    label: {
                        position: "right",
                        verticalAlign: "middle",
                        align: "left",
                    },
                },
                emphasis: {
                    focus: "descendant",
                },
                expandAndCollapse: true,
                animationDuration: 550,
                animationDurationUpdate: 750,
            },
        ],
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toEchartData(tree: TreeChild): any {
    const getColor = () => {
        switch (tree.grunnlagstype) {
            case Grunnlagstype.VIRKNINGSTIDSPUNKT:
            case Grunnlagstype.SOKNAD:
            case Grunnlagstype.NOTAT:
                return "#c2c4c3";
            default:
                return null;
        }
    };
    const getWidth = () => {
        switch (tree.grunnlagstype) {
            case Grunnlagstype.VIRKNINGSTIDSPUNKT:
            case Grunnlagstype.SOKNAD:
            case Grunnlagstype.NOTAT:
                return 0.5;
            default:
                return 1.5;
        }
    };
    const getBordertype = () => {
        switch (tree.grunnlagstype) {
            case Grunnlagstype.VIRKNINGSTIDSPUNKT:
            case Grunnlagstype.SOKNAD:
            case Grunnlagstype.NOTAT:
                return "dashed";
            default:
                return "solid";
        }
    };
    return {
        name: tree.name,
        value: tree.grunnlag
            ? JSON.stringify(tree?.grunnlag?.innhold, null, 2)
            : tree?.innhold
                ? JSON.stringify(tree?.innhold, null, 2)
                : "",
        itemStyle: {
            borderType: getBordertype(),
        },
        lineStyle: {
            color: getColor(),
            width: getWidth(),
        },

        tooltip: {
            formatter: (v: any) => {
                const jsonContent = v.value.replaceAll("\\n", "\n");
                const highlightedJson = highlightJson(jsonContent);
                return `
                <div class="vedtak-echart-tooltip" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <strong style="font-size: 16px; color: #333;">${v.name}</strong>
              
                    </div>
                    <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
                    ${
                    tree.grunnlag
                        ? `
                            <div style="font-size: 13px; color: #555; margin-bottom: 8px;">
                                <dl style="margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px;">
                                    <dt style="font-weight: bold;">Gjelder:</dt>
                                    <dd style="margin: 0;">${tree.grunnlag?.gjelderReferanse}</dd>
                                    <dt style="font-weight: bold;">Gjelder Barn:</dt>
                                    <dd style="margin: 0;">${tree.grunnlag?.gjelderBarnReferanse}</dd>
                                    <dt style="font-weight: bold;">Type:</dt>
                                    <dd style="margin: 0;">${tree.grunnlag?.type}</dd>
                                </dl>
                            </div>
                            <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">`
                        : ""
                }
                    <pre style="
                        margin: 0;
                        font-size: 12px;
                        font-family: 'Courier New', monospace;
                        background-color: #fff;
                        padding: 8px;
                        border-radius: 3px;
                        overflow: auto;
                        max-height: 500px;
                        line-height: 1.4;
                    ">${highlightedJson}</pre>
                </div>`;
            },
        },
        collapsed: tree.type === TreeChildType.GRUNNLAG,
        children: tree.children.map(toEchartData),
    };
}

function ShowMermaidGraphButton({mermaidGraph}: { mermaidGraph: string }) {
    const [showGraph, setShowGraph] = useState(false);
    return (
        <>
            <Button size="small" variant="tertiary-neutral" onClick={() => setShowGraph(!showGraph)}>
                Vis mermaid kode
            </Button>
            <Modal
                style={{maxHeight: "1000px", maxWidth: "max-content"}}
                open={showGraph}
                header={{heading: "Mermaid kode", size: "medium", closeButton: false}}
                closeOnBackdropClick
                onClose={() => setShowGraph(false)}
            >
                <Modal.Body>
                    <CopyButton size="small" copyText={mermaidGraph} text="Kopier kode til utklippstavle"></CopyButton>
                    <pre style={{maxHeight: "800px", overflow: "auto"}}>{mermaidGraph}</pre>
                </Modal.Body>
            </Modal>
        </>
    );
}

function ShowVedtakButton({vedtak}: { vedtak: VedtakDto }) {
    const [showGraph, setShowGraph] = useState(false);
    const vedtakString = JSON.stringify(vedtak, null, 2);
    return (
        <>
            <Button size="small" variant="tertiary-neutral" onClick={() => setShowGraph(!showGraph)}>
                Vis vedtak JSON
            </Button>
            <Modal
                style={{maxHeight: "1000px", maxWidth: "max-content"}}
                open={showGraph}
                header={{heading: "Vedtak JSON", size: "medium", closeButton: false}}
                closeOnBackdropClick
                onClose={() => setShowGraph(false)}
            >
                <Modal.Body>
                    <CopyButton size="small" copyText={vedtakString} text="Kopier til utklippstavle"></CopyButton>
                    <pre style={{maxHeight: "800px", overflow: "auto"}}>{JSON.stringify(vedtak, null, 2)}</pre>
                </Modal.Body>
            </Modal>
        </>
    );
}
