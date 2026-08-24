import { z } from "zod";

export interface SamhandlerBroadcastMessage {
    /** Identen til samhandler */
    samhandlerId?: string;
    /** Navn på samhandler */
    navn?: string;
    /** Offentlig id for samhandlere. */
    offentligId?: string;
}

export const SamhandlerBroadcastMessageSchema = z.object({
    samhandlerId: z.string().optional(),
    navn: z.string().optional(),
    offentligId: z.string().optional(),
});
