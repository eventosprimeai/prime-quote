"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if authenticated, redirect accordingly
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/auth/login");
        }
      })
      .catch(() => {
        router.replace("/auth/login");
      });
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
