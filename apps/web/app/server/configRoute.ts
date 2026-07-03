import type { ConfigResponse } from "~/api/types/configResponse.ts";

/** Brukes til å sende config fra backend til frontend */
export async function loader() {
    const bisysUrl = process.env.BISYS_URL;
    const body: ConfigResponse = {
        bisysBaseUrl: bisysUrl,
    };
    return Response.json(body);
}
