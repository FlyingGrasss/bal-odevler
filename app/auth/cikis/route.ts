import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth";
import { appUrl } from "@/lib/utils";

export async function GET() {
  await destroyCurrentSession();
  return NextResponse.redirect(appUrl("/"));
}