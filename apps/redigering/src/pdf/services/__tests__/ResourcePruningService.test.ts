import { PDFDict, PDFDocument, PDFName, type PDFPageLeaf, type PDFRef } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";

import { buildSharedResourcesPdf, SHARED_RESOURCE_XOBJECT_NAMES } from "../../testing/pdfTestUtils";
import { collectContentNames, pruneUnusedPageResources } from "../ResourcePruningService";

const RESOURCES = PDFName.of("Resources");
const XOBJECT = PDFName.of("XObject");
const COLOR_SPACE = PDFName.of("ColorSpace");

function bytes(text: string): Uint8Array {
    return Uint8Array.from(text, (char) => char.charCodeAt(0));
}

function nameTexts(names: Set<PDFName> | undefined): string[] | undefined {
    return names ? Array.from(names, (name) => name.decodeText()).sort() : undefined;
}

function getLeaves(doc: PDFDocument): PDFPageLeaf[] {
    return doc.getPages().map((page) => page.node);
}

function resourceKeys(doc: PDFDocument, leaf: PDFPageLeaf, category: PDFName): string[] {
    const resources = doc.context.lookup(leaf.get(RESOURCES), PDFDict);
    const categoryDict = doc.context.lookup(resources.get(category), PDFDict);
    return categoryDict
        .keys()
        .map((key) => key.decodeText())
        .sort();
}

function registerForm(doc: PDFDocument, content: string): PDFRef {
    return doc.context.register(
        doc.context.stream(content, { Type: "XObject", Subtype: "Form", BBox: [0, 0, 10, 10] }),
    );
}

async function buildSinglePageDocument(content: string, resources: Record<string, unknown>): Promise<PDFDocument> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    page.node.set(RESOURCES, doc.context.obj(resources as never));
    page.node.set(PDFName.of("Contents"), doc.context.register(doc.context.stream(content)));
    return doc;
}

describe("collectContentNames", () => {
    it("collects names used by any operator, including inside inline image dictionaries", () => {
        const content =
            "q /GS1 gs /CS0 cs /P1 scn BT /F1 12 Tf ET /Im1 Do BI /W 1 /H 1 /CS /CS2 ID \u0000/x\u00ff EI Q";

        expect(nameTexts(collectContentNames(bytes(content)))).toEqual([
            "CS",
            "CS0",
            "CS2",
            "F1",
            "GS1",
            "H",
            "Im1",
            "P1",
            "W",
        ]);
    });

    it("ignores names inside literal strings, hex strings and comments", () => {
        const content = "(text with /NotAName \\) and (nested /AlsoNot)) Tj <2F4E6F74> Tj % /Commented\n/Real Do";

        expect(nameTexts(collectContentNames(bytes(content)))).toEqual(["Real"]);
    });

    it("collects names inside dictionary operands and decodes #xx escapes", () => {
        const content = "/OC << /MCID 0 >> BDC /Im#20One Do EMC";

        expect(nameTexts(collectContentNames(bytes(content)))).toEqual(["Im One", "MCID", "OC"]);
    });

    it("returns undefined for content it cannot tokenise reliably", () => {
        expect({
            unterminatedString: collectContentNames(bytes("(never closed /Im1 Do")),
            unterminatedHexString: collectContentNames(bytes("<414243 /Im1 Do")),
            inlineImageWithoutEnd: collectContentNames(bytes("BI /W 1 ID \u0000\u0001")),
        }).toEqual({
            unterminatedString: undefined,
            unterminatedHexString: undefined,
            inlineImageWithoutEnd: undefined,
        });
    });
});

describe("pruneUnusedPageResources", () => {
    it("gives every page its own resources with only the forms it draws and removes inherited resources", async () => {
        const doc = await PDFDocument.load(await buildSharedResourcesPdf());
        const leaves = getLeaves(doc);

        const removedEntryCount = pruneUnusedPageResources(doc.context, leaves);

        expect({
            removedEntryCount,
            pageXObjects: leaves.map((leaf) => resourceKeys(doc, leaf, XOBJECT)),
            pageTreeStillHasResources: doc.catalog.Pages().has(RESOURCES),
        }).toEqual({
            removedEntryCount: 6,
            pageXObjects: SHARED_RESOURCE_XOBJECT_NAMES.map((name) => [name]),
            pageTreeStillHasResources: false,
        });
    });

    it("keeps resources used by a form XObject that inherits the page's resources", async () => {
        const doc = await buildSinglePageDocument("/Outer Do", {});
        const leaf = doc.getPages()[0].node;
        leaf.set(
            RESOURCES,
            doc.context.obj({
                XObject: {
                    Outer: registerForm(doc, "/Inner Do"),
                    Inner: registerForm(doc, "0 0 m 1 1 l S"),
                    Unused: registerForm(doc, "0 0 m 1 1 l S"),
                },
            }),
        );

        pruneUnusedPageResources(doc.context, [leaf]);

        expect(resourceKeys(doc, leaf, XOBJECT)).toEqual(["Inner", "Outer"]);
    });

    it("prunes a form XObject's own resources by its own content", async () => {
        const doc = await buildSinglePageDocument("/Outer Do", {});
        const nestedUsed = registerForm(doc, "0 0 m 1 1 l S");
        const nestedUnused = registerForm(doc, "0 0 m 1 1 l S");
        const outer = doc.context.register(
            doc.context.stream("/Used Do", {
                Type: "XObject",
                Subtype: "Form",
                BBox: [0, 0, 10, 10],
                Resources: { XObject: { Used: nestedUsed, Unused: nestedUnused } },
            }),
        );
        const leaf = doc.getPages()[0].node;
        leaf.set(RESOURCES, doc.context.obj({ XObject: { Outer: outer } }));

        pruneUnusedPageResources(doc.context, [leaf]);

        const outerForm = doc.context.lookup(outer) as unknown as { dict: PDFDict };
        const outerResources = doc.context.lookup(outerForm.dict.get(RESOURCES), PDFDict);
        const outerXObjects = doc.context.lookup(outerResources.get(XOBJECT), PDFDict);
        expect(outerXObjects.keys().map((key) => key.decodeText())).toEqual(["Used"]);
    });

    it("keeps implicit Default colour spaces that content never names", async () => {
        const doc = await buildSinglePageDocument("/CS0 cs 0 0 1 scn", {
            ColorSpace: { DefaultRGB: "DeviceRGB", CS0: "DeviceRGB", Unused: "DeviceGray" },
        });
        const leaf = doc.getPages()[0].node;

        pruneUnusedPageResources(doc.context, [leaf]);

        expect(resourceKeys(doc, leaf, COLOR_SPACE)).toEqual(["CS0", "DefaultRGB"]);
    });

    it("prunes pages that draw JPEG images instead of falling back to keeping every resource", async () => {
        const doc = await PDFDocument.load(await buildSharedResourcesPdf("jpeg"));
        const leaves = getLeaves(doc);

        pruneUnusedPageResources(doc.context, leaves);

        expect(leaves.map((leaf) => resourceKeys(doc, leaf, XOBJECT))).toEqual(
            SHARED_RESOURCE_XOBJECT_NAMES.map((name) => [name]),
        );
    });

    it("keeps resources used only by glyph procedures of a Type3 font without own resources", async () => {
        const doc = await buildSinglePageDocument("BT /T3 12 Tf (a) Tj ET", {});
        const leaf = doc.getPages()[0].node;
        const type3Font = doc.context.obj({
            Type: "Font",
            Subtype: "Type3",
            CharProcs: { a: doc.context.register(doc.context.stream("/Glyph Do")) },
        });
        leaf.set(
            RESOURCES,
            doc.context.obj({
                Font: { T3: doc.context.register(type3Font) },
                XObject: { Glyph: registerForm(doc, "0 0 m 1 1 l S"), Unused: registerForm(doc, "0 0 m 1 1 l S") },
            }),
        );

        pruneUnusedPageResources(doc.context, [leaf]);

        expect(resourceKeys(doc, leaf, XOBJECT)).toEqual(["Glyph"]);
    });

    it("keeps resources used only by a soft mask group without own resources", async () => {
        const doc = await buildSinglePageDocument("/GS1 gs 0 0 10 10 re f", {});
        const leaf = doc.getPages()[0].node;
        const softMaskGroup = registerForm(doc, "/MaskImage Do");
        leaf.set(
            RESOURCES,
            doc.context.obj({
                ExtGState: { GS1: { Type: "ExtGState", SMask: { S: "Luminosity", G: softMaskGroup } } },
                XObject: { MaskImage: registerForm(doc, "0 0 m 1 1 l S"), Unused: registerForm(doc, "0 0 m 1 1 l S") },
            }),
        );

        pruneUnusedPageResources(doc.context, [leaf]);

        expect(resourceKeys(doc, leaf, XOBJECT)).toEqual(["MaskImage"]);
    });

    it("leaves a page's resources untouched when its content cannot be tokenised", async () => {
        const doc = await PDFDocument.load(await buildSharedResourcesPdf());
        const leaves = getLeaves(doc);
        leaves[0].set(PDFName.of("Contents"), doc.context.register(doc.context.stream("(never closed /XA Do")));

        pruneUnusedPageResources(doc.context, leaves);

        expect(leaves.map((leaf) => resourceKeys(doc, leaf, XOBJECT))).toEqual([
            SHARED_RESOURCE_XOBJECT_NAMES,
            ["XB"],
            ["XC"],
        ]);
    });
});
