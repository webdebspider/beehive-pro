/**
 * app/index.tsx
 *
 * Root entry point — redirects to the Firebase hive dashboard.
 */

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/hive" />;
}