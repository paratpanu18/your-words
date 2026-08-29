import { NextResponse } from "next/server";
import { createRoom, getRoomByCode } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const placeholder =
    typeof body?.placeholder === "string" ? body.placeholder.trim() : "";
  const footerText =
    typeof body?.footerText === "string" ? body.footerText.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const realtime = body?.realtime === true;

  if (!name || name.length > 80) {
    return NextResponse.json(
      { error: "Room name must be 1-80 characters" },
      { status: 400 },
    );
  }
  if (description.length > 200) {
    return NextResponse.json(
      { error: "Description must be at most 200 characters" },
      { status: 400 },
    );
  }
  if (placeholder.length > 100) {
    return NextResponse.json(
      { error: "Placeholder must be at most 100 characters" },
      { status: 400 },
    );
  }
  if (footerText.length > 120) {
    return NextResponse.json(
      { error: "Footer text must be at most 120 characters" },
      { status: 400 },
    );
  }
  if (pin && !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN must be 4-8 digits" },
      { status: 400 },
    );
  }

  let room;
  try {
    room = createRoom({
      name,
      pin: pin || null,
      description: description || null,
      placeholder: placeholder || null,
      footerText: footerText || null,
      realtime,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not create room" },
      { status: 500 },
    );
  }

  const created = getRoomByCode(room.code)!;
  return NextResponse.json({
    ok: true,
    room: {
      id: created.id,
      code: created.code,
      name: created.name,
      description: created.description,
      placeholder: created.placeholder,
      footer_text: created.footer_text,
      pin: created.pin,
      realtime: created.realtime === 1,
      status: created.status,
    },
  });
}
