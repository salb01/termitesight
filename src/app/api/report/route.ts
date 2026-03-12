import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    ok: true,
    message: "Use client-side WDO PDF export for now.",
    payload: body
  });
}
