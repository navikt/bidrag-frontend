// @ts-nocheck

const system = {
    isTest: process.env.NODE_ENV === "TEST",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    environment: process.env.ENVIRONMENT,
    legacyEnvironment: process.env.LEGACY_ENVIRONMENT,
};

const url = {
    bisys: process.env.BISYS_URL,
    bidragDokumentUi: process.env.BIDRAGDOKUMENTUI_URL,
    bidragDokumentArkivering: process.env.BIDRAG_DOKUMENT_ARKIVERING_URL,
    bidragDokument: process.env.BIDRAG_DOKUMENT_URL,
    bidragPerson: process.env.BIDRAG_PERSON_URL,
    bidragSak: process.env.BIDRAG_SAK_URL,
    bidragSamhandler: process.env.BIDRAG_SAMHANDLER_URL,
    bidragOrganisasjon: process.env.BIDRAG_ORGANISASJON_URL,
    staticfiles: process.env.STATIC_FILES_URL,
    deployEnv: process.env.DEPLOY_ENV,
};

export default { url, system };
