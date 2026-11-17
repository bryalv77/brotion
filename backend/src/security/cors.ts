/** Web runs on CLIENT_ORIGIN; localhost dev servers and origin-less native clients are always allowed. */
export function isAllowedOrigin(origin: string | undefined, clientOrigin: string | undefined): boolean {
  return (
    !origin ||
    origin === "null" ||
    origin === clientOrigin ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  );
}
