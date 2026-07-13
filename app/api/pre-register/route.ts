import { NextResponse } from "next/server";
import { preRegisterSchema } from "@/lib/preRegister/schema";
import { sendPreRegisterNotification } from "@/lib/preRegister/notify";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = preRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  // Honeypot заполнен — почти наверняка бот. Отвечаем «ок», но заявку не шлём.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    await sendPreRegisterNotification(parsed.data);
  } catch {
    return NextResponse.json({ error: "notify_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
