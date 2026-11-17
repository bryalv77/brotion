import { Redirect } from "expo-router";

/**
 * Entry point: everyone lands in the app. New visitors get a local guest
 * notebook (no account, works offline); signing in is optional and reachable
 * from the sidebar.
 */
export default function Index() {
  return <Redirect href="/(app)/" />;
}
