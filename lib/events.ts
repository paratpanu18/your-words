import { EventEmitter } from "node:events";

export type RoomEventPayload =
  | { type: "message"; message: { id: number; text: string } }
  | { type: "status"; status: "open" | "paused" | "closed" }
  | { type: "realtime"; realtime: boolean };

const globalForEvents = globalThis as unknown as {
  __yourWordsRoomEvents?: EventEmitter;
};

/**
 * In-process pub/sub used by the SSE stream endpoint. Works for a single
 * self-hosted server instance (which is our deployment model).
 */
export function getRoomEvents(): EventEmitter {
  if (!globalForEvents.__yourWordsRoomEvents) {
    const emitter = new EventEmitter();
    // Many attendees can hold a stream open at once.
    emitter.setMaxListeners(0);
    globalForEvents.__yourWordsRoomEvents = emitter;
  }
  return globalForEvents.__yourWordsRoomEvents;
}

export function publishRoomEvent(
  roomId: number,
  payload: RoomEventPayload,
): void {
  getRoomEvents().emit(`room:${roomId}`, payload);
}
