"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

interface Version {
  id: string;
  version: string;
  title: string;
  description: string;
  createdAt: string;
}

export default function ActualizacionesPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const response = await fetch("/api/versions");
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="aurora-bg" />
      
      <header className="sticky top-0 z-50 glass-dark border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 sm:h-16 gap-4">
            <Link href="/admin/dashboard" className="shrink-0">
              <Button variant="ghost" size="icon" className="group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex-1">
              <Logo size="sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-neon-cyan mb-4">
            Novedades y Actualizaciones
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las últimas mejoras, características y correcciones que hemos implementado para mejorar tu experiencia.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : versions.length === 0 ? (
          <Card className="card-elevated border-dashed bg-card/30">
            <CardContent className="py-16 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
              <p className="text-muted-foreground">
                Estamos preparando grandes novedades. Vuelve pronto para enterarte.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-4 sm:ml-8 space-y-12 pb-12">
            {versions.map((version, index) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-8 sm:pl-12"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-background border-4 border-primary shadow-[0_0_10px_rgba(34,211,238,0.5)]" />

                <Card className={`card-elevated overflow-hidden ${index === 0 ? 'border-primary/50 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : ''}`}>
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={index === 0 ? "default" : "secondary"} className="font-mono text-sm px-3">
                            v{version.version}
                          </Badge>
                          {index === 0 && (
                            <Badge className="bg-neon-magenta text-white hover:bg-neon-magenta">Más reciente</Badge>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold">{version.title}</h2>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full shrink-0 w-fit">
                        <Clock className="w-4 h-4 mr-2" />
                        {formatDate(version.createdAt)}
                      </div>
                    </div>

                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-li:text-muted-foreground prose-a:text-neon-cyan hover:prose-a:text-neon-magenta prose-strong:text-foreground">
                      <ReactMarkdown>{version.description}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
