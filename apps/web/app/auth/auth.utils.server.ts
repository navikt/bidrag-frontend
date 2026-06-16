import {expiresIn, getToken, parseAzureUserToken, requestOboToken, validateToken} from "@navikt/oasis"

export async function getOnBehalfOfToken(request: Request, audience: string) {
    const token = getToken(request)
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

    if (expiresIn(obo.token) <= 0) {
        console.error('Expired token')
        throw new Response('Expired token', {status: 401})
    }

    return obo.token
}

type NavUser = {
    NAVident: string
    name: string
}

export function getUser(request: Request): NavUser {
    const token = getToken(request)
    console.log("token", token)
    if (!token) {
        throw new Error('Missing token')
    }
    const parse = parseAzureUserToken(token);
    if (parse.ok) {
        return {
            NAVident: parse.NAVident,
            name: parse.preferred_username,
        }
    }
    console.log("Parsed token ", parse)
    throw new Error("Failed to parse Azure user token")
}
