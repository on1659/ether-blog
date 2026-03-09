import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import type { ApiResponse } from "@/types";

export const authenticateApiKey = async (
  req: NextRequest
): Promise<{ authenticated: boolean; response?: NextResponse }> => {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    const body: ApiResponse = {
      success: false,
      error: "Missing or invalid Authorization header",
    };
    return {
      authenticated: false,
      response: NextResponse.json(body, { status: 401 }),
    };
  }

  const token = authHeader.slice(7);

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: token },
    });

    if (!apiKey || !apiKey.active) {
      const body: ApiResponse = {
        success: false,
        error: "Invalid or inactive API key",
      };
      return {
        authenticated: false,
        response: NextResponse.json(body, { status: 401 }),
      };
    }

    // Update lastUsed
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    return { authenticated: true };
  } catch {
    const body: ApiResponse = {
      success: false,
      error: "Authentication error",
    };
    return {
      authenticated: false,
      response: NextResponse.json(body, { status: 500 }),
    };
  }
};
