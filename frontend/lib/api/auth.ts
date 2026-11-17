import type {
  UserDTO,
  RegisterRequest,
  LoginRequest,
  NativeSessionTokens,
} from "@notion-clone/shared";
import {
  request,
  persistNativeTokens,
  clearCredentials,
} from "@/lib/api/client";

type AuthResponse = { user: UserDTO; tokens?: NativeSessionTokens };

export function getMe(): Promise<UserDTO> {
  return request<UserDTO>("me");
}

export async function login(body: LoginRequest): Promise<UserDTO> {
  const res = await request<AuthResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  await persistNativeTokens(res);
  return res.user;
}

export async function register(body: RegisterRequest): Promise<UserDTO> {
  const res = await request<AuthResponse>("auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  await persistNativeTokens(res);
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    await request<void>("auth/logout", { method: "POST", body: "{}" });
  } finally {
    await clearCredentials();
  }
}
