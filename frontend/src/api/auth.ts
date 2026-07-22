import { request } from "./client.js";
import type { UserDTO, RegisterRequest, LoginRequest } from "@notion-clone/shared";

export function getMe(): Promise<UserDTO> {
  return request<UserDTO>("me");
}

export function login(body: LoginRequest): Promise<UserDTO> {
  return request<UserDTO>("auth/login", { method: "POST", body: JSON.stringify(body) });
}

export function register(body: RegisterRequest): Promise<UserDTO> {
  return request<UserDTO>("auth/register", { method: "POST", body: JSON.stringify(body) });
}

export function logout(): Promise<void> {
  return request<void>("auth/logout", { method: "POST", body: "{}" });
}

export function refresh(): Promise<UserDTO> {
  return request<UserDTO>("auth/refresh", { method: "POST", body: "{}" });
}
