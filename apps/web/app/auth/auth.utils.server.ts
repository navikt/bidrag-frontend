import {expiresIn, getToken, parseAzureUserToken, requestOboToken, validateToken} from "@navikt/oasis"
import type {NavUser} from "./NavUser.ts";

export async function getOnBehalfOfToken(user: NavUser, audience: string) {
    const token = user.token
    if (!token) {
        console.error('Missing token')
        throw new Response('Missing token', {status: 401})
    }

    const valid = await validateToken(token)
    if (!valid.ok) {
        console.error(`Failed to validate token: ${valid.error}`)
        throw new Response('Token validation failed', {status: 401})
    }

    const obo = await requestOboToken(token, audience)
    if (!obo.ok) {
        console.error(`Failed to get OBO token: ${obo.error}`)
        throw new Response('Unauthorized', {status: 401})
    }

    return obo.token
}

export function parseToken(token: string): NavUser {
    if (!token) {
        throw new Error('Missing token')
    }
    const parse = parseAzureUserToken(token);
    if (parse.ok) {
        return {
            NAVident: parse.NAVident,
            name: parse.preferred_username,
            token,
        }
    }
    throw new Error("Failed to parse Azure user token")
}
