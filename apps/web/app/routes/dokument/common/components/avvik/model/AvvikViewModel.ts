import { AvvikType } from "../../../../types/api/AvvikTypes";

export abstract class AvvikViewModel {
    public title: string;
    public type: AvvikType;
    public stepIndicators: string[];

    protected constructor(title: string, type: AvvikType, stepIndicators: string[] = []) {
        this.title = title;
        this.type = type;
        this.stepIndicators = stepIndicators;
    }
}
export class FarskapUtelukketModel extends AvvikViewModel {
    constructor() {
        super("Farskap utelukket", AvvikType.FARSKAP_UTELUKKET, ["Farskap utelukket"]);
    }
}
export class InngTilUtgDokumentViewModel extends AvvikViewModel {
    constructor() {
        super("Endre fra inngående til utgående", AvvikType.INNG_TIL_UTG_DOKUMENT, ["Inngående til utgående"]);
    }
}

export class TrekkJournalpostViewModel extends AvvikViewModel {
    constructor() {
        super("Trekk journalpost", AvvikType.TREKK_JOURNALPOST, ["Trekk journalpost"]);
    }
}

export class OverforTilAnnenEnhetViewModel extends AvvikViewModel {
    constructor() {
        super("Overfør til annen enhet", AvvikType.OVERFOR_TIL_ANNEN_ENHET, ["Overfør enhet"]);
    }
}

export class BestillOriginalViewModel extends AvvikViewModel {
    constructor() {
        super("Bestill original", AvvikType.BESTILL_ORIGINAL, ["Bestill original"]);
    }
}

export class FeilforeSakViewModel extends AvvikViewModel {
    constructor() {
        super("Feilføre", AvvikType.FEILFORE_SAK, ["Feilføre"]);
    }
}

export class BestillReskanningViewModel extends AvvikViewModel {
    constructor() {
        super("Bestill reskanning", AvvikType.BESTILL_RESKANNING, ["Bestill reskanning"]);
    }
}

export class SlettJournalpostViewModel extends AvvikViewModel {
    constructor() {
        super("Slett dokument under produksjon", AvvikType.SLETT_JOURNALPOST, ["Slett dokument"]);
    }
}

export class EndreFagomradeViewModel extends AvvikViewModel {
    constructor() {
        super("Endre fagområde", AvvikType.ENDRE_FAGOMRADE, ["Endre fagområde", "Skriv ut og skann"]);
    }
}

export class KopierFraAnnenFagomradeViewModel extends AvvikViewModel {
    constructor() {
        super("Kopier fra annen fagområde", AvvikType.KOPIER_FRA_ANNEN_FAGOMRADE, [
            "Velg dokumenter",
            "Se gjennom og rediger",
            "Knytt til sak",
            "Sammendrag",
        ]);
    }
}

export class SendTilFagomradeViewModel extends AvvikViewModel {
    constructor() {
        super("Send kopi til fagområde", AvvikType.SEND_TIL_FAGOMRADE, ["Velg fagområde", "Skriv ut og skann"]);
    }
}

export class EndreFagomradeJoarkViewModel extends AvvikViewModel {
    constructor() {
        super("Endre fagområde", AvvikType.ENDRE_FAGOMRADE, ["Endre fagområde"]);
    }
}

export class BestillSplittingViewModel extends AvvikViewModel {
    constructor() {
        super("Bestill splitting", AvvikType.BESTILL_SPLITTING, ["Bestill splitting"]);
    }
}

export class RegistrerReturViewModel extends AvvikViewModel {
    constructor() {
        super("Registrer retur", AvvikType.REGISTRER_RETUR, ["Registrer retur"]);
    }
}

export class BestillNyDistribusjonViewModel extends AvvikViewModel {
    constructor() {
        super("Bestill ny distribusjon", AvvikType.BESTILL_NY_DISTRIBUSJON, ["Bestill ny distribusjon"]);
    }
}

export class ManglerAdresseViewModel extends AvvikViewModel {
    constructor() {
        super("Mangler adresse", AvvikType.MANGLER_ADRESSE, ["Avbryt distribusjon"]);
    }
}
