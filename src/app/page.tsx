import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import { PageLoadingState } from "@/components/ui/LoadingState";

export default function HomePage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <HomePageClient />
    </Suspense>
  );
}
