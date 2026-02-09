import { Suspense } from "react";
import QuickBookPage from "./components/QuickBookClient";
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuickBookPage />
    </Suspense>
  );
}
