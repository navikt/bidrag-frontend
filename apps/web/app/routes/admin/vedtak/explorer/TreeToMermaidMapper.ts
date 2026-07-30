import {GrunnlagDto, Grunnlagstype, VedtakDto} from "@bidrag/api/BidragBehandlingApiV1";
import {MermaidResponse, MermaidSubgraph, TreeChild, TreeChildType} from "./types";
import {
    mapVedtakToTree,
    stønadsendringPeriodeToTreeDto,
    stønadsendringToTreeDto,
    vedtakToTreeDto,
} from "./VedtakToGraphMapper";

const grunnlagstyperNotIncludedInFlow = [
    Grunnlagstype.SJABLON,
    Grunnlagstype.SOKNAD,
    Grunnlagstype.NOTAT,
    Grunnlagstype.VIRKNINGSTIDSPUNKT,
];

const subgraphWithTopToBottomDirection = [
    MermaidSubgraph.PERSON,
    MermaidSubgraph.ANDRE,
    MermaidSubgraph.SJABLON,
    MermaidSubgraph.NOTAT,
].map((v) => v.toString());

const grunnlagstypeDelberegning = [Grunnlagstype.DELBEREGNING_BARN_I_HUSSTAND, Grunnlagstype.DELBEREGNING_SUM_INNTEKT];

function addToMap(map: Map<string, string[]>, key: string, value: string) {
    const current = map.get(key) ?? [];
    current.push(value);
    map.set(key, current);
}

export function vedtakToMermaidResponse(vedtak: VedtakDto): MermaidResponse {
    const tree = mapVedtakToTree(vedtak);
    const mermaidString = treeToMermaidString(tree);
    return {
        mermaidGraph: mermaidString,
        grunnlagListe: vedtak.grunnlagListe,
        vedtak: vedtakToTreeDto(vedtak),
        stønadsendringer: vedtak.stønadsendringListe.map((stønadsendring) => stønadsendringToTreeDto(stønadsendring)),
        perioder: vedtak.stønadsendringListe.flatMap((stønadsendring) =>
            stønadsendring.periodeListe.map((periode) => stønadsendringPeriodeToTreeDto(periode, stønadsendring))
        ),
    };
}

function treeToMermaidString(tree: TreeChild) {
    const mermaidSubgraphMap = new Map<string, string[]>();
    treeToMermaid(mermaidSubgraphMap, tree);
    const mermaidSubgraphSortOrder = [
        "Delberegning",
        ...Array.from(mermaidSubgraphMap.keys())
            .filter((key) => key.startsWith("Stønadsendring_"))
            .map((key) => key),
        MermaidSubgraph.NOTAT,
        MermaidSubgraph.SJABLON,
        MermaidSubgraph.ACTION,
    ];
    const mermaidSubgraphString = Array.from(mermaidSubgraphMap.entries())
        .sort((a, b) => {
            if (mermaidSubgraphSortOrder.indexOf(a[0]) < mermaidSubgraphSortOrder.indexOf(b[0])) return -1;
            if (mermaidSubgraphSortOrder.indexOf(a[0]) > mermaidSubgraphSortOrder.indexOf(b[0])) return 1;
            return 0;
        })
        .map(([key, value]) => {
            if (key != MermaidSubgraph.ACTION && key != MermaidSubgraph.INGEN) {
                let subgraphString = `\tsubgraph ${key}\n`;
                if (subgraphWithTopToBottomDirection.includes(key)) {
                    subgraphString += `\t\tdirection LR\n`;
                }
                return (
                    subgraphString +
                    `${value
                        .sort((a, b) => (a.startsWith("Periode") ? a.localeCompare(b) : -1))
                        .map((v) => `\t\t${v}\n`)
                        .join("")}\tend\n`
                );
            }
            return value.map((v) => `\t${v}\n`).join("");
        })
        .join("");
    return `\nflowchart LR\n${removeDuplicates(mermaidSubgraphString.split("\n")).join("\n")}\n`;
}

function removeDuplicates(arr: string[]): string[] {
    const distinctList: string[] = [];
    const ignoreList = ["subgraph", "\tend", "flowchart", "direction"];
    arr.forEach((item) => {
        if (ignoreList.some((ignore) => item.includes(ignore)) || !distinctList.includes(item)) {
            distinctList.push(item);
        }
    });
    return distinctList;
}

function treeToMermaid(mermaidSubgraphMap: Map<string, string[]>, tree: TreeChild, parent?: TreeChild) {
    // if (tree.type == TreeChildType.FRITTSTÅENDE) return {};
    addToMap(mermaidSubgraphMap, MermaidSubgraph.ACTION, `click ${tree.id} call callback() "${tree.id}"`);
    //@ts-ignore
    if (parent != null && tree.innhold?.type != Grunnlagstype.SJABLON) {
        if (parent.type == TreeChildType.PERIODE) {
            addToMap(mermaidSubgraphMap, tilSubgraph(parent), `${parent.id}[["${parent.name}"]] --> ${tree.id}`);
        } else if (tree.type == TreeChildType.GRUNNLAG || tree.type == TreeChildType.FRITTSTÅENDE) {
            mapGrunnlagToMermaid(mermaidSubgraphMap, tree as TreeChild<GrunnlagDto>, parent as TreeChild<GrunnlagDto>);
        } else {
            addToMap(
                mermaidSubgraphMap,
                tilSubgraph(parent),
                `${parent.id}["${parent.name}"] --> ${tree.id}["${tree.name}"]`
            );
        }
    }
    tree.children.forEach((child) => treeToMermaid(mermaidSubgraphMap, child, tree));
}

function mapGrunnlagToMermaid(
    mermaidSubgraphMap: Map<string, string[]>,
    tree: TreeChild<GrunnlagDto>,
    parent: TreeChild<GrunnlagDto>
) {
    const grunnlagstype = tree.innhold?.type;
    const parentGrunnlagstype = parent?.innhold?.type;
    if (
        tree.innhold?.type.startsWith("PERSON_") ||
        grunnlagstyperNotIncludedInFlow.includes(tree.innhold?.type) ||
        tree.type == TreeChildType.FRITTSTÅENDE
    ) {
        if (
            (tree.type == TreeChildType.FRITTSTÅENDE && tree.children.length > 0) ||
            tree.type != TreeChildType.FRITTSTÅENDE
        ) {
            addToMap(mermaidSubgraphMap, tilSubgraph(tree), `${tree.id}["${tree.name}"]`);
        }
    } else if (grunnlagstype == Grunnlagstype.SLUTTBEREGNING_FORSKUDD) {
        addToMap(
            mermaidSubgraphMap,
            tilSubgraph(tree),
            `${parent.id}["${parent.name}"] --> ${tree.id}{"${tree.name}"}`
        );
    } else if (
        parentGrunnlagstype == Grunnlagstype.SLUTTBEREGNING_FORSKUDD &&
        grunnlagstypeDelberegning.includes(grunnlagstype)
    ) {
        addToMap(
            mermaidSubgraphMap,
            tilSubgraph(parent),
            `${parent.id}["${parent.name}"] --> |"${tree.name}"| ${tree.id}[["${tree.name}"]]`
        );
    } else if (grunnlagstypeDelberegning.includes(grunnlagstype)) {
        addToMap(
            mermaidSubgraphMap,
            tilSubgraph(parent),
            `${parent.id}[["${parent.name}"]] --> ${tree.id}["${tree.name}"]`
        );
    } else if (parent.type == TreeChildType.FRITTSTÅENDE) {
        addToMap(
            mermaidSubgraphMap,
            tilSubgraph(parent),
            `${parent.id}[["${parent.name}"]] -.- ${tree.id}["${tree.name}"]`
        );
    } else {
        addToMap(
            mermaidSubgraphMap,
            tilSubgraph(parent),
            `${parent.id}["${parent.name}"] --> ${tree.id}["${tree.name}"]`
        );
    }
}

function tilSubgraph(tree: TreeChild) {
    switch (tree.type) {
        case TreeChildType.PERIODE:
            return tilSubgraph(tree.parent);
        case TreeChildType.STØNADSENDRING:
            return `Stønadsendring_${tree.name.replaceAll("(", "").replaceAll(")", "")}`;
        case TreeChildType.GRUNNLAG: {
            if (treeChildInnholdIsOfTypeGrunnlagDto(tree)) {
                switch (tree.innhold.type) {
                    case Grunnlagstype.SJABLON: {
                        return MermaidSubgraph.SJABLON;
                    }
                    case Grunnlagstype.NOTAT: {
                        return MermaidSubgraph.NOTAT;
                    }
                    case Grunnlagstype.SLUTTBEREGNING_FORSKUDD: {
                        return tilSubgraph(tree.parent);
                    }
                    case Grunnlagstype.DELBEREGNING_BARN_I_HUSSTAND:
                    case Grunnlagstype.DELBEREGNING_SUM_INNTEKT:
                        return "Delberegning";
                    default:
                        if (grunnlagstyperNotIncludedInFlow.includes(tree.innhold.type)) return MermaidSubgraph.ANDRE;
                        if (tree.name.startsWith("PERSON_")) return MermaidSubgraph.PERSON;
                        return "Delberegning";
                }
            }
            break;
        }
        default:
            return MermaidSubgraph.INGEN;
    }
}

function treeChildInnholdIsOfTypeGrunnlagDto(obj: TreeChild): obj is TreeChild<GrunnlagDto> {
    return (obj as TreeChild).innhold !== undefined;
}
