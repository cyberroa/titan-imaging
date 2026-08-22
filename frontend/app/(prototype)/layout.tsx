import { PrototypeFooter } from "@/components/prototype/PrototypeFooter";
import { PrototypeHeader } from "@/components/prototype/PrototypeHeader";

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PrototypeHeader />
      <main>{children}</main>
      <PrototypeFooter />
    </>
  );
}
