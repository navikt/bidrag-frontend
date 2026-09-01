import { FileUtils, SecuritySessionUtils } from "@navikt/bidrag-ui-common";
import { render, waitFor } from "@testing-library/react";
import { expect } from "chai";
import React from "react";

import OpenDocument from "../../../pages/opendocument/OpenDocument";
import CookieService from "../../../services/CookieService";
import DokumentService from "../../../services/DokumentService";
import { DokumentFormat } from "../../../types/api/DokumentTypes";
import { sinonSandbox } from "../../resources/mocha.init";
import { sleep } from "../../utils/TestDomUtils";

describe("OpenDocumentPage", () => {
    it("Should open bidrag dokument", async () => {
        // given
        const journalpostId = "BID-12323";
        const dokumentreferanse = "213123";
        const windowOpenStub = sinonSandbox.stub(window, "open");
        const dokumentServiceStub = sinonSandbox.stub(DokumentService.prototype, "getDokumentUrl").resolves("url");
        sinonSandbox.stub(SecuritySessionUtils, "isLoggedIn").resolves(true);
        const dokumentMetadataStub = sinonSandbox
            .stub(DokumentService.prototype, "getDokumentMetadata")
            .resolves([{ dokumentreferanse, journalpostId, format: DokumentFormat.MBDOK, status: "" }]);
        render(<OpenDocument dokumentreferanse={dokumentreferanse} journalpostId={journalpostId} open />);
        await waitFor(() => expect(document.querySelector("iframe")).is.not.null, { timeout: 1000 });
        sinonSandbox.assert.calledWith(dokumentServiceStub, dokumentreferanse, journalpostId);
        sinonSandbox.assert.calledWith(dokumentMetadataStub, journalpostId, dokumentreferanse);
        sinonSandbox.assert.notCalled(windowOpenStub);
        await sleep(500);
    });

    it("Should open joark dokument", async () => {
        // given
        const journalpostId = "JOARK-12323";
        const dokumentreferanse = "213123";
        const windowOpenStub = sinonSandbox.stub(window, "open");
        sinonSandbox.stub(SecuritySessionUtils, "isLoggedIn").resolves(true);
        sinonSandbox.stub(CookieService.prototype, "updateSessionAuthCookie").resolves(null);
        const dokumentServiceStub = sinonSandbox.stub(DokumentService.prototype, "getDokumentUrl").resolves("url");
        sinonSandbox.stub(FileUtils, "dataToFileUrl").returns("fileurl");
        const dokumentStub = sinonSandbox
            .stub(DokumentService.prototype, "getDokument")
            .resolves(Buffer.from("validPdfByte64", "base64"));
        const dokumentMetadataStub = sinonSandbox
            .stub(DokumentService.prototype, "getDokumentMetadata")
            .resolves([{ dokumentreferanse, journalpostId, format: DokumentFormat.PDF, status: "" }]);
        render(<OpenDocument dokumentreferanse={dokumentreferanse} journalpostId={journalpostId} open />);
        await waitFor(() => sinonSandbox.assert.called(windowOpenStub));
        sinonSandbox.assert.calledWith(windowOpenStub, `fileurl`);
        sinonSandbox.assert.calledWith(dokumentMetadataStub, journalpostId, dokumentreferanse);
        sinonSandbox.assert.calledWith(dokumentStub, journalpostId, dokumentreferanse);
        sinonSandbox.assert.notCalled(dokumentServiceStub);
        expect(document.querySelector("iframe")).is.null;
    });
});
