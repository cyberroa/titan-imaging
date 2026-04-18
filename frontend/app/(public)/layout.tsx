import { Suspense } from "react";
import { ChatWidget } from "@/components/ChatWidget";
import { ConsentBanner } from "@/components/ConsentBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageViewTracker } from "@/components/PageViewTracker";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="pt-[4.5rem] md:pt-24">{children}</div>
      <Footer />
      <ChatWidget />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <ConsentBanner />
    </>
  );
}
