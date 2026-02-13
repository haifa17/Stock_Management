import { Suspense } from "react";
import QuickBookPage from "./components/QuickBookClient";
import Loading from "../loading";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <QuickBookPage />
    </Suspense>
  );
}
