import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

const requireAdmin = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  return session && user?.isAdmin;
};

export const GET = async () => {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  const res: ApiResponse = { success: true, data: keys };
  return NextResponse.json(res);
};

export const POST = async (req: NextRequest) => {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  const key = `eb_${crypto.randomBytes(32).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: { name, key },
  });

  const res: ApiResponse = { success: true, data: { ...apiKey, key } };
  return NextResponse.json(res, { status: 201 });
};

export const DELETE = async (req: NextRequest) => {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await prisma.apiKey.update({ where: { id }, data: { active: false } });

  const res: ApiResponse = { success: true };
  return NextResponse.json(res);
};
