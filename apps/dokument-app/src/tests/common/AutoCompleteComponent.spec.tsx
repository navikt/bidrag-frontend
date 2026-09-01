import { fireEvent, render } from "@testing-library/react";
import { expect } from "chai";
import React from "react";
import sinon from "sinon";

import AutoSuggest from "../../common/components/autosuggest/AutoSuggest";

const optionsList = [
    "Donna Duck",
    "Daisy Duck",
    "Gladstone Gander",
    "Granny de Spell",
    "Søknad om Bidrag",
    "Søknad om Bidrag for Barn > 18",
    "Søknad",
    "Dokumentasjon tilsynsutg",
    "Søknad om Ettergivelse",
    "Søknad om Avskrivning direkte betalt",
    "Klage på Avskrivning direkte betalt",
    "Søknad om Refusjon",
    "Søknad om Bidrag uten innkreving",
];
function validateAutoSuggest(
    searchTerm: string,
    expectedNumberOfResults: number,
    expectedFirstResultText?: string,
    options = optionsList,
) {
    // when
    render(<AutoSuggest label={"label"} changeInnhold={sinon.spy()} options={options} />);

    fireEvent.change(document.querySelector("input"), { target: { value: searchTerm } });

    const resultOptions = document.querySelectorAll("li");
    // then
    expect(resultOptions.length).to.eq(expectedNumberOfResults);
    if (expectedFirstResultText) {
        expect(resultOptions.item(0).textContent).to.eq(expectedFirstResultText);
    }
}

describe("AutoComplete for beskrivelse input", () => {
    it("should return many correct suggestion that start with farskap and klage combo", () => {
        // given
        const searchterm = "farskap klage";
        const options = ["klage på noe annet", "klage på forskudd", "klage", "klage med vedlegg", "klage på farskap"];
        validateAutoSuggest(searchterm, 1, "klage på farskap", options);
    });

    it("should return many correct suggestion that start with Klage ved should return Klage med vedlegg", () => {
        // given
        const searchterm = "klage ved";
        const options = ["klage på noe annet", "klage på forskudd", "klage", "klage med vedlegg", "klage på farskap"];
        validateAutoSuggest(searchterm, 1, "klage med vedlegg", options);
    });

    it("should return many correct suggestion that start with Klage bet should return Klage på Avskrivning direkte betalt", () => {
        // given
        const searchterm = "klage bet";
        const options = ["Klage på Avskrivning direkte betalt"];
        validateAutoSuggest(searchterm, 1, "Klage på Avskrivning direkte betalt", options);
    });

    it("should return many correct suggestion that start with Kl should return Klage på Avskrivning direkte betalt", () => {
        // given
        const searchterm = "kla";
        const options = ["Klage på Avskrivning direkte betalt"];
        validateAutoSuggest(searchterm, 1, "Klage på Avskrivning direkte betalt", options);
    });

    it("should return many correct suggestion that start with Klage på Avskrivning direkte betalt", () => {
        // given
        const searchterm = "klage betalt";
        const options = ["Klage på Avskrivning direkte betalt"];
        validateAutoSuggest(searchterm, 1, "Klage på Avskrivning direkte betalt", options);
    });
    it("should return many correct suggestion that start with søknad betalt", () => {
        // given
        const searchterm = "sø betalt";
        validateAutoSuggest(searchterm, 1, "Søknad om Avskrivning direkte betalt");
    });

    it("should return many correct suggestion that start with søknad om", () => {
        // given
        const searchterm = "sø o";
        validateAutoSuggest(searchterm, 6, "Søknad om Bidrag");
    });

    it("should return another 1 correct suggestion based on 1 word and 2 start chars in norwegian query for søknad om bidrag", () => {
        // given
        const searchterm = "søkn o b";
        validateAutoSuggest(searchterm, 4, "Søknad om Bidrag");
    });

    it("should return another 1 correct suggestion based on 1 word and 2 start chars in norwegian query for bidrag", () => {
        // given
        const searchterm = "søk o ref";
        validateAutoSuggest(searchterm, 1, "Søknad om Refusjon");
    });

    it("should return 1 correct suggestion based on 1 word and 2 start chars in norwegian query for bidrag", () => {
        // given
        const searchterm = "søk b u innkreving";
        validateAutoSuggest(searchterm, 1, "Søknad om Bidrag uten innkreving");
    });

    it("should return 1 correct suggestion based on 3 start chars in norwegian query for bidrag", () => {
        // given
        const searchterm = "s b u";
        validateAutoSuggest(searchterm, 1, "Søknad om Bidrag uten innkreving");
    });

    it("should return 4 correct suggestion based on half typed correct norwegian query for Bidrag and the first is the closest match", () => {
        // GIVEN
        const searchTerm = "S";
        validateAutoSuggest(searchTerm, 8, "Søknad");
    });

    it("should return 3 correct suggestion based on another correct norwegian query for Bidrag and the first is the closest match", () => {
        // GIVEN
        const searchTerm = "Søknad";
        validateAutoSuggest(searchTerm, 7, "Søknad");
    });

    it("should return 2 correct suggestion based on another correct norwegian query for Bidrag", () => {
        // GIVEN
        const searchTerm = "Søknad om Bidrag";
        validateAutoSuggest(searchTerm, 3, "Søknad om Bidrag");
    });

    it("should return correct suggestion based on another correct query", () => {
        // GIVEN
        const searchTerm = "granny de spell";
        validateAutoSuggest(searchTerm, 1, "Granny de Spell");
    });

    it("should return correct suggestion based on query based on two lowercase letters", () => {
        // GIVEN
        const searchTerm = "g s";
        validateAutoSuggest(searchTerm, 1, "Granny de Spell");
    });

    it("should return correct suggestion based on query based on two uppercase letters", () => {
        // GIVEN
        const searchTerm = "G S";
        validateAutoSuggest(searchTerm, 1, "Granny de Spell");
    });

    it("should return correct suggestion based on query based on one uppercase letters", () => {
        // GIVEN
        const searchTerm = "D";
        validateAutoSuggest(searchTerm, 6);
    });

    it("should return all suggestion when no input", () => {
        // GIVEN
        const searchTermNotInOptions = " ";
        validateAutoSuggest(searchTermNotInOptions, 13);
    });

    it("should return empty suggestion based on word not in options list", () => {
        // GIVEN
        const searchTermNotInOptions = "Rex";
        validateAutoSuggest(searchTermNotInOptions, 0);
    });

    it("should return correct suggestion based on correct query", () => {
        // GIVEN
        const searchTerm = "daisy duck";
        validateAutoSuggest(searchTerm, 1, "Daisy Duck");
    });

    it("should return correct suggestion based on simple one word query", () => {
        // GIVEN
        const searchTerm = "daisy";
        validateAutoSuggest(searchTerm, 1, "Daisy Duck");
    });
});
