import { ChatWidget } from "@/components/ChatWidget";
import { PrototypeFooter } from "@/components/prototype/PrototypeFooter";
import { PrototypeHeader } from "@/components/prototype/PrototypeHeader";
import { PrototypeSideVignette } from "@/components/prototype/PrototypeSideVignette";

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PrototypeHeader />
      <PrototypeSideVignette />
      <main className="relative z-0 bg-black">{children}</main>
      <PrototypeFooter />
      <ChatWidget />
    </>
  );
}
