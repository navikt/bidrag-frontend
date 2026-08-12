'use server'
import {env} from "./env.server.ts";

// @ts-nocheck
const system = {
    isTest: env.NODE_ENV === "test",
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
    environment: "",//env.ENVIRONMENT, //TODO Does not exist. in bidrag-ui it seems to be empty in samhandler.
};

const url = {
    bidragSamhandler: env.BIDRAG_SAMHANDLER_URL,
    bisysUrl: env.BISYS_URL,
    bidragSak: env.BIDRAG_SAK_URL,
};

export default {url, system};
