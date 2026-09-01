import sinon, { type SinonSandbox, type SinonStub } from "sinon";

import { RedirectTo } from "../../../common/utils/RedirectUtils";
import EnhetService from "../../../services/EnhetService";
import JournalpostService from "../../../services/JournalpostService";
import KodeverkService from "../../../services/KodeverkService";
import SakService from "../../../services/SakService";
import { enhetPersonResponse } from "../testdata";
import { mockHentAvvik, mockSendAvvik } from "./MockAvvikService";
import mockBidragDokumentService from "./MockBidragService";
import {
    mockHentEnhetInfo,
    mockHentEnhetList,
    mockHentJournalforendeEnheter,
    mockPersonGeografiskEnhet,
} from "./MockEnhetService";
import { mockHentJournalpost, mockLagreJournalpost, mockRegistrereJournalpost } from "./MockJournalpostService";
import mockKodeverkService from "./MockKodeverkService";
import { mockPersonGetAdresse, mockPersonService } from "./MockPersonService";
import { mockRedirectService } from "./MockRedirectUtils";
import { mockSakService } from "./MockSakService";

export function mockServices(sinonSandbox: SinonSandbox = sinon.createSandbox()) {
    mockBidragDokumentService(sinonSandbox);
    mockHentJournalpost(sinonSandbox);
    // mockKanDistribuereJournalpost(sinonSandbox);
    // mockDistribuerJournalpost(sinonSandbox);
    mockPersonService(sinonSandbox);
    mockLagreJournalpost(sinonSandbox);
    mockRegistrereJournalpost(sinonSandbox);
    mockHentAvvik(sinonSandbox);
    mockHentEnhetList(sinonSandbox);
    mockHentJournalforendeEnheter(sinonSandbox);
    mockRedirectService(sinonSandbox);
    mockSakService(sinonSandbox);
    mockKodeverkService(sinonSandbox);
    mockPersonGeografiskEnhet(enhetPersonResponse, sinonSandbox);
    mockHentEnhetInfo(sinonSandbox);
    mockPersonGetAdresse(sinonSandbox);
    mockSendAvvik(true, sinonSandbox);
    return sinonSandbox;
}

export const serviceStubs = () => ({
    // personStub: PersonService.prototype.getPerson as SinonStub,
    // personAdresseStub: PersonService.prototype.getPersonAdresse as SinonStub,
    hentSakStub: SakService.prototype.hentSak as SinonStub,
    hentSakerForPersonStub: SakService.prototype.hentSakerForPerson as SinonStub,
    hentJournalpostStub: JournalpostService.prototype.hentJournalpost as SinonStub,
    // distribuerJournalpostStub: DistribusjonService.prototype.distribuerJournalpost as SinonStub,
    // kanDistribuereJournalpostStub: DistribusjonService.prototype.kanDistribuereJournalpost as SinonStub,
    registrerJournalpostStub: JournalpostService.prototype.registrerJournalpost as SinonStub,
    hentPersonGeografiskEnhetStub: EnhetService.prototype.hentPersonGeografiskEnhet as SinonStub,
    hentEnhetInfoStub: EnhetService.prototype.hentEnhetInfo as SinonStub,
    oppgaveListeStub: RedirectTo.oppgaveListe as SinonStub,
    behandleSakRedirectStub: RedirectTo.behandleSak as SinonStub,
    sakshistorikkRedirectStub: RedirectTo.sakshistorikk as SinonStub,
    lagreJournalpostStub: JournalpostService.prototype.lagreJournalpost as SinonStub,
    hentPostnummereStub: KodeverkService.prototype.getPostnummere as SinonStub,
    hentLandkoderStub: KodeverkService.prototype.getLandkoder as SinonStub,
    // sendAvvikStub: AvvikService.prototype.sendAvvik as SinonStub,
});
