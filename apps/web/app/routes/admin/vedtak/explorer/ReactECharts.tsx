import type { LineSeriesOption, TreemapSeriesOption, TreeSeriesOption } from "echarts/charts";
import { LineChart, TreeChart } from "echarts/charts";
import type { GridComponentOption, TitleComponentOption, TooltipComponentOption } from "echarts/components";
import {
    DataZoomComponent,
    DataZoomInsideComponent,
    DataZoomSliderComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    ToolboxComponent,
    TooltipComponent,
} from "echarts/components";
import type { ComposeOption, ECharts, SetOptionOpts } from "echarts/core";
import { getInstanceByDom, init, use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { InsideDataZoomOption, SliderDataZoomOption } from "echarts/types/dist/shared";
import type React from "react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

use([
    LegendComponent,
    LineChart,
    GridComponent,
    TooltipComponent,
    TitleComponent,
    ToolboxComponent,
    DataZoomComponent,
    CanvasRenderer,
    TreeChart,
    DataZoomInsideComponent,
    DataZoomSliderComponent,
]);

export type EChartsOption = ComposeOption<
    | LineSeriesOption
    | TitleComponentOption
    | GridComponentOption
    | InsideDataZoomOption
    | SliderDataZoomOption
    | TooltipComponentOption
    | TreemapSeriesOption
    | TreeSeriesOption
>;

export interface ReactEChartsProps {
    option: EChartsOption;
    style?: CSSProperties;
    settings?: SetOptionOpts;
}

let currentIndex = -1;

export function ReactECharts({ option, style, settings }: ReactEChartsProps): React.ReactElement {
    const chartRef = useRef<HTMLDivElement>(null);
    const [chartInitialized, setChartInitialized] = useState(false);

    useEffect(() => {
        let chart: ECharts | undefined;
        let observer: ResizeObserver | undefined;

        const tryInit = () => {
            const el = chartRef.current;
            if (!el || chart) return;
            if (el.clientWidth === 0 || el.clientHeight === 0) return;
            chart = init(el as HTMLElement);
            setChartInitialized(true);
        };

        if (chartRef.current) {
            observer = new ResizeObserver(() => {
                if (!chart) {
                    tryInit();
                } else {
                    chart.resize();
                }
            });
            observer.observe(chartRef.current);
            tryInit();
        }

        function resizeChart() {
            chart?.resize();
        }

        window.addEventListener("resize", resizeChart);

        return () => {
            observer?.disconnect();
            chart?.dispose();
            window.removeEventListener("resize", resizeChart);
        };
    }, []);

    useEffect(() => {
        const canvas = chartRef.current?.querySelector("canvas");
        const chart = chartRef.current ? getInstanceByDom(chartRef.current) : undefined;
        const seriesData = option.series;
        const dataLen =
            Array.isArray(seriesData) && seriesData[0] && "data" in seriesData[0]
                ? ((seriesData[0].data as unknown[])?.length ?? 0)
                : 0;
        const hideTooltip = () => {
            chart?.dispatchAction({ type: "hideTip" });
            if (currentIndex >= 0) {
                chart?.dispatchAction({
                    type: "downplay",
                    seriesIndex: 0,
                    dataIndex: currentIndex,
                });
            }
        };

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                hideTooltip();
                return;
            }

            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                chart?.dispatchAction({
                    type: "downplay",
                    seriesIndex: 0,
                    dataIndex: currentIndex,
                });
                currentIndex =
                    e.key === "ArrowRight"
                        ? (currentIndex + 1) % dataLen
                        : currentIndex <= 0
                          ? dataLen - 1
                          : currentIndex - 1;
                chart?.dispatchAction({
                    type: "highlight",
                    seriesIndex: 0,
                    dataIndex: currentIndex,
                });
                chart?.dispatchAction({
                    type: "showTip",
                    seriesIndex: 0,
                    dataIndex: currentIndex,
                });
            }
        };

        const addKeydownListener = () => window.addEventListener("keydown", handleKeydown);
        const removeKeydownListener = () => window.removeEventListener("keydown", handleKeydown);
        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) {
                return;
            }

            const clickedInsideTooltip = Boolean(target.closest(".vedtak-echart-tooltip"));
            const clickedTooltipClose = Boolean(target.closest(".vedtak-echart-tooltip-close"));

            if (clickedTooltipClose || !clickedInsideTooltip) {
                hideTooltip();
            }
        };

        canvas?.setAttribute("tabindex", "0");
        canvas?.addEventListener("focusin", addKeydownListener);
        canvas?.addEventListener("focusout", removeKeydownListener);
        document.addEventListener("pointerdown", handleDocumentClick, true);
        document.addEventListener("click", handleDocumentClick, true);

        return () => {
            window.removeEventListener("keydown", handleKeydown);
            canvas?.removeEventListener("focusin", addKeydownListener);
            canvas?.removeEventListener("focusout", removeKeydownListener);
            document.removeEventListener("pointerdown", handleDocumentClick, true);
            document.removeEventListener("click", handleDocumentClick, true);
        };
    }, [chartInitialized, option]);

    useEffect(() => {
        if (chartRef.current !== null) {
            const chart = getInstanceByDom(chartRef.current);
            chart?.setOption(option, settings);
        }
    }, [option, settings]);

    return <div ref={chartRef} style={{ width: "100%", height: "250px", ...style }} />;
}
