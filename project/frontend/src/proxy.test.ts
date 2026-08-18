import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/proxy";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.hoisted(() => {
  process.env.JWT_ACCESS_SECRET_KEY = "access-secret";
  process.env.JWT_REFRESH_SECRET_KEY = "refresh-secret";
  process.env.BACKEND_API_URL = "http://localhost:3001";
});

vi.mock("@/lib/api/http.client", () => ({ apiRequest }));

vi.mock("next/server", () => {
  const makeResponse = (status = 200) => ({
    status,
    headers: new Map<string, string>(),
    cookies: { set: vi.fn() },
  });
  return {
    NextRequest: class {},
    NextResponse: {
      next: vi.fn(() => makeResponse(200)),
      redirect: vi.fn(() => makeResponse(307)),
      json: vi.fn(() => makeResponse(200)),
    },
  };
});

const mockMeResponse = (id: string, role: string) => {
  apiRequest.mockImplementation(async (url: string) => {
    if (url === "/api/auth/me") {
      return { data: { id, role } };
    }
    return undefined;
  });
};

const createRequest = (
  pathname: string,
  {
    accessToken,
    refreshToken,
  }: { accessToken?: string; refreshToken?: string } = {},
) =>
  ({
    nextUrl: { pathname, search: "" },
    url: `http://localhost:3000${pathname}`,
    cookies: {
      get: vi.fn((name: string) => {
        if (name === "access_token" && accessToken)
          return { value: accessToken };
        if (name === "refresh_token" && refreshToken)
          return { value: refreshToken };
        return undefined;
      }),
    },
    headers: new Headers(),
  }) as unknown as NextRequest;

describe("proxy middleware", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    vi.mocked(NextResponse.next).mockClear();
    vi.mocked(NextResponse.redirect).mockClear();
    vi.mocked(NextResponse.json).mockClear();
  });

  it("lets public routes through without tokens", async () => {
    const req = createRequest("/");

    const res = await proxy(req);

    expect(apiRequest).not.toHaveBeenCalled();
    expect(res).toBeTruthy();
    expect(vi.mocked(NextResponse.next)).toHaveBeenCalled();
  });

  it("redirects a non-admin user away from /admin", async () => {
    mockMeResponse("u1", "USER");

    await proxy(createRequest("/admin", { accessToken: "at" }));

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/403", "http://localhost:3000/admin"),
    );
    const [result] = vi.mocked(NextResponse.redirect).mock.results;
    const res = result?.value as { headers: Map<string, string> };
    expect(res.headers.get("x-middleware-cache")).toBe("no-cache");
  });

  it("allows an admin user on admin routes and injects identity headers", async () => {
    mockMeResponse("u1", "ADMIN");

    await proxy(createRequest("/admin/dashboard", { accessToken: "at" }));

    expect(NextResponse.redirect).not.toHaveBeenCalled();
    const last = vi.mocked(NextResponse.next).mock.calls.at(-1)?.[0] as
      | { request: { headers: Headers } }
      | undefined;
    expect(last?.request.headers.get("x-user-id")).toBe("u1");
    expect(last?.request.headers.get("x-user-role")).toBe("ADMIN");
  });

  it("redirects a logged-in user away from /auth", async () => {
    mockMeResponse("u1", "USER");

    await proxy(createRequest("/auth", { accessToken: "at" }));

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/", "http://localhost:3000/auth"),
    );
  });

  it("redirects anonymous users on protected routes to the login page", async () => {
    await proxy(createRequest("/profile"));

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL(
        "/auth?mode=login&callbackUrl=%2Fprofile",
        "http://localhost:3000/profile",
      ),
    );
  });

  it("silently refreshes tokens via the backend when the access token is missing", async () => {
    apiRequest.mockResolvedValue({
      data: {
        tokens: { accessToken: "new-at", refreshToken: "new-rt" },
        user: { id: "u1", role: "USER" },
      },
    });

    const res = await proxy(createRequest("/profile", { refreshToken: "rt" }));

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST" }),
    );
    expect(NextResponse.next).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });

  it("rejects api routes with 401 when not authenticated", async () => {
    await proxy(createRequest("/api/foo"));

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Unauthorized" },
      { status: 401 },
    );
  });
});
