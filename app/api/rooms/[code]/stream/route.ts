import { getRoomByCode, listMessagesAfter } from "@/lib/queries";
import { hasRoomAccess } from "@/lib/auth";
import { getRoomEvents } from "@/lib/events";
import type { RoomEventPayload } from "@/lib/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = getRoomByCode(code);
  if (!room) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.pin && !(await hasRoomAccess(room.code))) {
    return Response.json({ error: "PIN required" }, { status: 403 });
  }

  const after = Number(new URL(request.url).searchParams.get("after") ?? "0");
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (
        payload:
          | RoomEventPayload
          | { type: "hello"; status: string; realtime: boolean },
      ) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(ping);
        getRoomEvents().off(`room:${room.id}`, listener);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Catch up on anything missed between page load and stream start.
      const backlog = listMessagesAfter(room.id, Number.isFinite(after) ? after : 0);
      send({
        type: "hello",
        status: room.status,
        realtime: room.realtime === 1,
      });
      for (const m of backlog) {
        send({ type: "message", message: { id: m.id, text: m.text } });
      }

      const listener = (payload: RoomEventPayload) => send(payload);
      getRoomEvents().on(`room:${room.id}`, listener);

      // Comment pings keep proxies from closing the idle connection.
      const ping = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          cleanup();
        }
      }, 25_000);

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
