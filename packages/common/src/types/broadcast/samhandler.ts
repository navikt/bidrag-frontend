import { z } from "zod";

export interface SamhandlerBroadcastMessage {
    samhandlerId?: string;
    navn?: string;
    offentligId?: string;
}

export const SamhandlerBroadcastMessageSchema = z.object({
    samhandlerId: z.string().optional(),
    navn: z.string().optional(),
    offentligId: z.string().optional(),
});
