"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir directamente al dashboard
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative bg-grid">
      <div className="bg-glow fixed inset-0 pointer-events-none" />
      <div className="scanline" />
      
      <div className="flex flex-col items-center gap-6">
        <Logo size="lg" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando...</span>
        </div>
      </div>
    </div>
  );
}
