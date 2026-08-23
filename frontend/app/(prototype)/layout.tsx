import { ChatWidget } from "@/components/ChatWidget";
import { PrototypeFooter } from "@/components/prototype/PrototypeFooter";
import { PrototypeHeader } from "@/components/prototype/PrototypeHeader";

/** Workbench-style charcoal grid — preview only on /prototype. */
function PrototypeSiteGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#101014]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#101014]">
      <PrototypeSiteGrid />
      <div className="relative z-10">
        <PrototypeHeader />
        <main>{children}</main>
        <PrototypeFooter />
        <ChatWidget />
      </div>
    </div>
  );
}
