"use server";

import { redirect } from "next/navigation";
import { RegisterDto, LoginBaseDto, IAuthResponseDto } from "./auth.dto";
import { cookies, headers } from "next/headers";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { handleError } from "@/lib/utils.lib";
import { revalidatePath } from "next/cache";
import { AuthService } from "./auth.service";
import { GoogleLoginDto } from "@/dto/google-login.dto";
import { jwtDecode } from "jwt-decode";

export async function registerAction(data: RegisterDto) {
  let isSuccess = false;

  try {
    const headerList = await headers();
    const ipAddress = headerList.get("x-forwarded-for") || "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";
    const res: IAuthResponseDto | null | undefined = await AuthService.register(
      data,
      {
        ipAddress,
        userAgent,
      },
    );
    if (res) {
      isSuccess = true;
      const cookieStore = await cookies();
      //storing tokens authentication
      cookieStore.set("access_token", res.tokens.accessToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.accessTokenExpireIn,
      });
      cookieStore.set("refresh_token", res.tokens.refreshToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.refreshTokenExpireIn,
      });
    }
  } catch (err: unknown) {
    return handleError(err);
  }
  if (isSuccess) {
    redirect("/");
  }
}

export async function loginBaseAction(data: LoginBaseDto) {
  let isSuccess = false;

  try {
    const headerList = await headers();
    const ipAddress = headerList.get("x-forwarded-for") || "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";
    const res: IAuthResponseDto | null | undefined =
      await AuthService.loginBase(data, {
        ipAddress,
        userAgent,
      });
    if (res) {
      isSuccess = true;
      const cookieStore = await cookies();
      //storing tokens authentication
      cookieStore.set("access_token", res.tokens.accessToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.accessTokenExpireIn,
      });
      cookieStore.set("refresh_token", res.tokens.refreshToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.refreshTokenExpireIn,
      });
    }
  } catch (err: unknown) {
    return handleError(err);
  }
  if (isSuccess) {
    redirect("/");
  }
}

export async function loginGoogleAction(token: GoogleLoginDto) {
  let isSuccess = false;

  try {
    const headerList = await headers();
    const ipAddress = headerList.get("x-forwarded-for") || "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";
    const res: IAuthResponseDto | null | undefined =
      await AuthService.loginGoogle(token, {
        ipAddress,
        userAgent,
      });
    if (res) {
      isSuccess = true;
      const cookieStore = await cookies();

      cookieStore.set("access_token", res.tokens.accessToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.accessTokenExpireIn,
      });
      cookieStore.set("refresh_token", res.tokens.refreshToken, {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax",
        path: "/",
        maxAge: EnvConfig.refreshTokenExpireIn,
      });
    }
  } catch (err) {
    return handleError(err);
  }
  if (isSuccess) {
    redirect("/");
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const headerList = await headers();

  // 1. Lấy userId từ Header (đã được Proxy/Middleware giải mã hoặc refresh hộ)
  const userId = headerList.get("X-User-Id");

  // 2. Lấy refreshToken để xóa chính xác session đó trong DB
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    if (userId && refreshToken) {
      // Gọi service để xóa session trong Database
      await AuthService.logout(userId, refreshToken);
    }
  } catch (err: unknown) {
    console.error("error at logout action", err);
  }

  // 3. Xóa sạch dấu vết ở trình duyệt cho dù DB có lỗi hay không
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");

  // Ép trang web render lại để cập nhật trạng thái UI (ẩn avatar, hiện nút login)
  revalidatePath("/");
  redirect("/auth?mode=login");
}

export async function refreshAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;

    if (!token) throw new Error("No refresh token found");

    // 1. Giải mã token để lấy userId (chỉ decode, verify sẽ do Service làm)
    const payload = jwtDecode(token); // Bạn dùng jose hoặc thư viện decode
    const userId = payload?.sub;

    if (!userId) throw new Error("Invalid token payload");

    // 2. Gọi Service với ĐẦY ĐỦ 2 tham số
    const res = await AuthService.refresh(userId, token);

    // Vì Service của bạn trả về raw object {user, tokens},
    // ta sẽ xử lý kết quả trực tiếp ở đây
    if (res.tokens) {
      const cookieOptions = {
        httpOnly: true,
        secure: EnvConfig.nodeValue === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      cookieStore.set("access_token", res.tokens.accessToken, {
        ...cookieOptions,
        maxAge: EnvConfig.accessTokenExpireIn,
      });

      cookieStore.set("refresh_token", res.tokens.refreshToken, {
        ...cookieOptions,
        maxAge: EnvConfig.refreshTokenExpireIn,
      });

      return { success: true };
    }
  } catch (err: unknown) {
    return handleError(err);
  }
}
