"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CookiesBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const cookieConsent = localStorage.getItem("prime_cookie_consent");
    if (!cookieConsent) {
      // Pequeño delay estilizado
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("prime_cookie_consent", "accepted");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-sm z-[100]"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-5 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50" />
             <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-neon-cyan/10 rounded-full blur-2xl" />
            
             <div className="flex justify-between items-start mb-3 relative z-10">
               <div className="flex items-center gap-2 text-primary">
                 <Cookie className="h-5 w-5" />
                 <h3 className="font-bold text-sm">Privacidad y Cookies</h3>
               </div>
               <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                 <X className="h-4 w-4" />
               </button>
             </div>
             
             <p className="text-xs text-muted-foreground mb-4 relative z-10 leading-relaxed">
               Utilizamos cookies esenciales para el funcionamiento de contratos digitales y sesiones de seguridad. Al continuar navegando, aceptas nuestra <Link href="/legal" className="text-primary hover:underline font-medium">Política de Cookies y Privacidad</Link>.
             </p>
             
             <div className="flex gap-2 relative z-10">
               <Button onClick={acceptCookies} className="w-full text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                 Entendido y Aceptar
               </Button>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
