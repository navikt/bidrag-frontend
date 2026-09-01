import { DefaultRestService } from "@navikt/bidrag-ui-common";
import _ from "lodash";

import { isEmpty } from "../common/utils/ObjectUtils";
import environment from "../environment";
import type {
    JournalpostDto,
    JournalpostResponse,
    LagreJournalpostRequest,
    RegistrerJournalpostRequest,
} from "../types/api/JournalpostTypes";
import UserError from "../types/api/UserError";
import { HTTPStatus } from "../types/enum/HttpStatus";
import { type Journalpost, JournalpostMapper } from "../types/journalpost";
import PersonService from "./PersonService";

export default class JournalpostService extends DefaultRestService {
    constructor() {
        super(
            `bidrag-dokument${environment.system.legacyEnvironment ? `-${environment.system.legacyEnvironment}` : ""}`,
            environment.url.bidragDokument + "/bidrag-dokument",
        );
    }

    async registrerJournalpost(
        journalpostId: string,
        paloggetenhet: string,
        journalpost: RegistrerJournalpostRequest,
    ): Promise<RegistrerJournalpostRequest> {
        if (isEmpty(journalpostId) || isEmpty(paloggetenhet) || isEmpty(journalpost)) {
            throw new Error("Beklager, det skjedde feil ved registrering av journalpost.");
        }

        const response = await this.patch(
            `/journal/${journalpostId}`,
            JSON.stringify(journalpost),
            this.createHeaders(paloggetenhet),
        );

        if (!response.ok) {
            throw new Error(`Det skjedde feil ved registrering av journalpost. ${response.data}`);
        }

        return journalpost;
    }

    async lagreJournalpost(
        journalpostId: string,
        paloggetEnhet: string,
        journalpost: LagreJournalpostRequest,
    ): Promise<void> {
        const response = await this.patch(
            `/journal/${journalpostId}`,
            JSON.stringify(journalpost),
            this.createHeaders(paloggetEnhet),
        );
        if (!response.ok) {
            throw response;
        }
    }

    async hentJournalpost(journalpostid: string, saksnummer?: string): Promise<Journalpost> {
        if (isEmpty(journalpostid)) {
            return { dokumenter: [], sakstilknytninger: [] } as Journalpost;
        }
        if (!isEmpty(saksnummer)) {
            return this.hentJournalpostBySak(journalpostid, saksnummer);
        }
        return this.hentJournalpostById(journalpostid);
    }

    private async hentJournalpostById(journalpostid: string): Promise<Journalpost> {
        if (_.isEmpty(journalpostid)) {
            return;
        }
        const response = await this.get<JournalpostResponse>("/journal/" + journalpostid);

        if (!response.ok) {
            switch (response.status) {
                case HTTPStatus.UNAUTHORIZED:
                case HTTPStatus.FORBIDDEN:
                    throw new UserError(`Beklager, du har ingen tilgang til oppgave med id ${journalpostid}`);
                case HTTPStatus.NOT_FOUND:
                    throw new UserError(`Beklager, fant ingen oppgave med id ${journalpostid}`);
                default:
                    throw new UserError(
                        "Beklager, det skjedde en feil ved lasting av oppgave. Vennligst prøv å laste siden på nytt.",
                    );
            }
        }

        return this.toJournalpost(response.data);
    }

    private async hentJournalpostBySak(journalpostid: string, saksnummer: string): Promise<Journalpost> {
        const response = await this.get<JournalpostResponse>(`/journal/${journalpostid}?saksnummer=${saksnummer}`);
        if (!response.ok) {
            switch (response.status) {
                case HTTPStatus.UNAUTHORIZED:
                case HTTPStatus.FORBIDDEN:
                    throw new UserError(
                        `Beklager, du har ingen tilgang til sak ${saksnummer} og journalpost ${journalpostid}`,
                    );
                case HTTPStatus.NOT_FOUND:
                    throw new UserError(
                        `Beklager, fant ingen journalpost med id ${journalpostid} og saksnummer ${saksnummer}`,
                    );
                default:
                    throw new UserError(
                        `Beklager, det skjedde en feil ved lasting av journalpost med id ${journalpostid} og saksnummer ${saksnummer}. Vennligst prøv å laste siden på nytt.`,
                    );
            }
        }

        return this.toJournalpost(response.data, saksnummer);
    }

    async convertAktoerIdToFnr(journalpost: JournalpostDto): Promise<JournalpostDto> {
        if (journalpost?.gjelderAktor?.type === "AKTOERID") {
            const aktoerId = journalpost.gjelderAktor.ident;
            const person = await new PersonService().getPerson(aktoerId);
            journalpost.gjelderAktor.ident = person.ident;
            journalpost.gjelderAktor.type = "FNR";
        }
        return journalpost;
    }

    private async toJournalpost(journalpostResponse: JournalpostResponse, saksnummer?: string): Promise<Journalpost> {
        journalpostResponse.journalpost = await this.convertAktoerIdToFnr(journalpostResponse.journalpost);
        return new JournalpostMapper(
            journalpostResponse.journalpost,
            saksnummer,
            journalpostResponse.sakstilknytninger,
        ).map();
    }

    async hentJournalposterForSak(sakId: string): Promise<Journalpost[]> {
        const response = await this.get<Journalpost[]>("/saker/" + sakId + "?fagomrade=BID");

        if (!response.ok) {
            switch (response.status) {
                case HTTPStatus.FORBIDDEN:
                    throw new UserError(`Beklager, du har ingen tilgang til sak ${sakId}`);
                case HTTPStatus.NOT_FOUND:
                    throw new UserError(`Beklager, fant ingen sak med id ${sakId}`);
                default:
                    throw new UserError(
                        `Beklager, det skjedde en feil ved lasting av sak med id ${sakId}. Vennligst prøv å laste siden på nytt.`,
                    );
            }
        }

        return response.data;
    }
}
