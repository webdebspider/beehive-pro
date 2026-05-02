/**
 * app/index.tsx
 *
 * Root entry point — redirects to the main Firebase hive dashboard.
 * The real dashboard lives at app/hive/index.tsx
 */

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/hive" />;
}