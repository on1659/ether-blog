import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  const res: ApiResponse = { success: true, data: projects };
  return NextResponse.json(res);
};

export const POST = async (req: NextRequest) => {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, icon, gradient, tags, githubUrl, deployUrl } = body;

  if (!name) {
    return NextResponse.json({ success: false, error: "name is required" }, { status: 400 });
  }

  // Auto-assign order to the end
  const maxOrder = await prisma.project.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? -1) + 1;

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      icon: icon || "📦",
      gradient: gradient || "from-[#3182F6] to-[#1D4ED8]",
      tags: tags || [],
      githubUrl: githubUrl || null,
      deployUrl: deployUrl || null,
      order,
    },
  });

  const res: ApiResponse = { success: true, data: project };
  return NextResponse.json(res, { status: 201 });
};
