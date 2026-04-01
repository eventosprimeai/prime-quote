"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, 
  FileText, 
  Zap, 
  Shield, 
  Layers,
  Check,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Logo, LogoMinimal } from "@/components/ui/logo";
import PricingCoverflow from "@/components/PricingCoverflow";
export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const features = [
    { icon: FileText, title: "Cotizaciones Premium", description: "Propuestas elegantes que impresionan" },
    { icon: Zap, title: "Instantáneo", description: "Enlaces únicos para compartir" },
    { icon: Shield, title: "Privado", description: "Tokens seguros para cada cliente" },
    { icon: Layers, title: "Flexible", description: "Plantillas personalizables" }
  ];

  return (
    <div className="min-h-screen bg-background relative bg-grid">
      {/* Background Glow */}
      <div className="bg-glow fixed inset-0 pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <Logo size="md" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link href="/admin/dashboard">
                  <button className="btn-neon-filled px-5 py-2.5 text-sm flex items-center gap-2">
                    Ir al Dashboard
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <button className="btn-neon-ghost px-4 py-2 text-sm">
                      Iniciar Sesión
                    </button>
                  </Link>
                  <Link href="/auth/register">
                    <button className="btn-neon-filled px-5 py-2.5 text-sm flex items-center gap-2">
                      Comenzar
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:border-neon-cyan/50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-neon-cyan" /> : <Menu className="w-5 h-5 text-neon-cyan" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden py-4 border-t border-border"
            >
                {user ? (
                  <Link href="/admin/dashboard">
                    <button className="btn-neon-filled w-full py-3 flex items-center justify-center gap-2">
                      Ir al Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <button className="btn-neon-ghost w-full py-3">
                        Iniciar Sesión
                      </button>
                    </Link>
                    <Link href="/auth/register">
                      <button className="btn-neon-filled w-full py-3 flex items-center justify-center gap-2">
                        Comenzar
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </>
                )}
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-magenta/40 bg-neon-magenta/5 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-neon-magenta animate-pulse" />
              <span className="text-sm font-medium text-neon-magenta">
                Consultor de Servicios de Desarrollo
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              Cotizaciones que{" "}
              <span className="text-neon-gradient">convierten</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Sistema profesional para generar propuestas digitales elegantes. 
              Comparte enlaces únicos y cierra más proyectos.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth/register" className="w-full sm:w-auto">
                <button className="btn-neon-filled w-full sm:w-auto px-8 py-4 text-lg flex items-center justify-center gap-2">
                  Crear Cotización
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <button className="btn-neon w-full sm:w-auto px-8 py-4 text-lg">
                  Iniciar Sesión
                </button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-14 pt-10 border-t border-border/50"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center"
                      style={{ 
                        background: i % 2 === 0 
                          ? "linear-gradient(135deg, oklch(0.75 0.18 195 / 30%), oklch(0.7 0.25 330 / 30%))" 
                          : "linear-gradient(135deg, oklch(0.7 0.25 330 / 30%), oklch(0.65 0.25 300 / 30%))"
                      }}
                    >
                      <Check className="w-4 h-4 text-neon-cyan" />
                    </div>
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl text-neon-cyan">+500 cotizaciones</p>
                  <p className="text-sm text-muted-foreground">generadas este mes</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que <span className="text-neon-cyan">necesitas</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Herramientas diseñadas para profesionales
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-neon p-5 sm:p-6 group"
              >
                <div className="w-12 h-12 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 flex items-center justify-center mb-4 group-hover:border-neon-cyan group-hover:bg-neon-cyan/10 transition-all">
                  <feature.icon className="w-6 h-6 text-neon-cyan" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Coverflow Integrado */}
      <PricingCoverflow />

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="card-neon card-neon-magenta p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl opacity-50" style={{
                background: "linear-gradient(90deg, transparent, oklch(0.7 0.25 330 / 30%), oklch(0.75 0.18 195 / 30%), transparent)",
                backgroundSize: "200% 100%",
                animation: "gradient-shift 5s linear infinite"
              }} />
              
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="mx-auto mb-6"
                >
                  <Logo size="lg" showText={false} />
                </motion.div>

                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  ¿Listo para <span className="text-neon-magenta">comenzar</span>?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                  Únete a profesionales que ya usan Prime Quote para crear propuestas que convierten.
                </p>

                <Link href="/auth/register">
                  <button className="btn-neon-accent px-10 py-4 text-lg flex items-center gap-2 mx-auto">
                    Crear Cuenta Gratis
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
