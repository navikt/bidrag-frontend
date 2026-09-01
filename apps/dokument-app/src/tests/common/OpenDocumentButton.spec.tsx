import { FileUtils, SecuritySessionUtils } from "@navikt/bidrag-ui-common";
import { fireEvent, waitFor } from "@testing-library/react";
import { expect } from "chai";
import React from "react";

import OpenDocumentButton from "../../common/components/dokument/OpenDocumentButton";
import CookieService from "../../services/CookieService";
import DokumentService from "../../services/DokumentService";
import { DokumentFormat } from "../../types/api/DokumentTypes";
import { sinonSandbox } from "../resources/mocha.init";
import { mountWithStore } from "../utils/StoreInitializer";
import { sleep } from "../utils/TestDomUtils";

const validPdfByte64 = "JVBERi0xLg10cmFpbGVyPDwvUm9vdDw8L1BhZ2VzPDwvS2lkc1s8PC9NZWRpYUJveFswIDAgMyAzXT4+XT4+Pj4+Pg==";

describe("OpenDocumentButton", () => {
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
        mountWithStore(<OpenDocumentButton dokumentreferanse={dokumentreferanse} journalpostId={journalpostId} />);

        await waitFor(() => fireEvent.click(document.querySelector(".view-document-button")));
        await waitFor(() => expect(document.querySelector("iframe")).is.not.null, { timeout: 1000 });
        sinonSandbox.assert.calledWith(dokumentMetadataStub, journalpostId, dokumentreferanse);
        sinonSandbox.assert.calledWith(dokumentServiceStub, dokumentreferanse, journalpostId);
        sinonSandbox.assert.notCalled(windowOpenStub);
        await sleep(500);
    });

    it("Should open joark dokument", async () => {
        // given
        const journalpostId = "JOARK-12323";
        const dokumentreferanse = "213123";
        const windowOpenStub = sinonSandbox.stub(window, "open");
        sinonSandbox.stub(CookieService.prototype, "updateSessionAuthCookie").resolves();
        sinonSandbox.stub(SecuritySessionUtils, "isLoggedIn").resolves(true);
        const dokumentServiceStub = sinonSandbox.stub(DokumentService.prototype, "getDokumentUrl").resolves("url");

        sinonSandbox.stub(FileUtils, "dataToFileUrl").returns("fileurl");
        const dokumentStub = sinonSandbox
            .stub(DokumentService.prototype, "getDokument")
            .resolves(Buffer.from(validPdfByte64, "base64"));
        const dokumentMetadataStub = sinonSandbox
            .stub(DokumentService.prototype, "getDokumentMetadata")
            .resolves([{ dokumentreferanse, journalpostId, format: DokumentFormat.PDF, status: "" }]);
        mountWithStore(<OpenDocumentButton dokumentreferanse={dokumentreferanse} journalpostId={journalpostId} />);
        await waitFor(() => fireEvent.click(document.querySelector(".view-document-button")));
        await waitFor(() => sinonSandbox.assert.called(windowOpenStub));
        sinonSandbox.assert.calledWith(windowOpenStub, `fileurl`);
        sinonSandbox.assert.calledWith(dokumentStub, journalpostId, dokumentreferanse);
        sinonSandbox.assert.calledWith(dokumentMetadataStub, journalpostId, dokumentreferanse);
        sinonSandbox.assert.notCalled(dokumentServiceStub);
        expect(document.querySelector("iframe")).is.null;
    });
});
