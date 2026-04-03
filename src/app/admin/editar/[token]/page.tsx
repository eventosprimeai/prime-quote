"use client";

import React, { useId } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PencilRuler, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EditQuotePlaceholderPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Aurora Background */}
      <div className="aurora-bg" />
      <div className="aurora-orbs">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="card-elevated overflow-hidden border-accent/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent" />
          <CardContent className="p-8 text-center flex flex-col items-center">
            
            <div className="w-20 h-20 rounded-2xl bg-muted/80 flex items-center justify-center mb-6 relative group">
              <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl group-hover:bg-accent/40 transition-colors" />
              <PencilRuler className="w-10 h-10 text-accent relative z-10" />
            </div>

            <h1 className="text-2xl font-bold mb-3">Edición en Desarrollo</h1>
            
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              El módulo de edición en vivo (permitiendo re-escribir cotizaciones del token <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-primary">{token}</span>) está programado para la <strong>siguiente gran iteración</strong>, tal como se definió en el roadmap. 
            </p>

            <div className="bg-accent/5 border border-accent/10 rounded-lg p-4 mb-8 text-left w-full">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Alternativa actual
              </h3>
              <p className="text-xs text-muted-foreground">
                Si cometiste un error, puedes <strong>Descargar el JSON</strong> desde el panel y volver a <strong>Importarlo</strong>. Eso te generará una copia que no modificará el enlace existente.
              </p>
            </div>

            <Button 
              onClick={() => router.push('/admin/dashboard')}
              className="w-full btn-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Regresar al Dashboard
            </Button>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
