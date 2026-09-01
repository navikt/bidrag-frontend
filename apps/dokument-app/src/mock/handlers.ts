import enhetMock from "./enhetMock";
import journalpostMock from "./journalpostMock";
import kodeverkMock from "./kodeverkMock";
import logMock from "./logMock";
import personMock from "./personMock";
import sakMock from "./sakMock";
import tokenMock from "./tokenMock";
export const handlers = [
    ...journalpostMock(),
    ...personMock(),
    ...enhetMock(),
    ...tokenMock(),
    ...logMock(),
    ...sakMock(),
    ...kodeverkMock(),
];
