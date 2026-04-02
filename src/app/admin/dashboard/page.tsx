"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  History,
  ArrowRight,
  Loader2,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  UserCircle,
  LogOut,
  Sparkles,
  MessageCircle,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

interface Quote {
  id: string;
  token: string;
  companyName: string;
  projectName: string | null;
  status: string;
  createdAt: string;
  projectPrice: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0
  });
  const [usage, setUsage] = useState({
    plan: "FREE",
    count: 0,
    limit: 10
  });
  const [unreadMap, setUnreadMap] = useState<Record<string, { count: number }>>({});
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    fetchQuotes();
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const fetchQuotes = async () => {
    try {
      const response = await fetch("/api/quotes");
      const data = await response.json();
      setQuotes(data.quotes || []);
      if (data.usage) {
        setUsage(data.usage);
      }
      
      const quotesList = data.quotes || [];
      const total = quotesList.length;
      const draft = quotesList.filter((q: Quote) => q.status === "draft").length;
      const sent = quotesList.filter((q: Quote) => q.status === "sent" || q.status === "viewed").length;
      const accepted = quotesList.filter((q: Quote) => q.status === "accepted").length;
      setStats({ total, draft, sent, accepted });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnread = async () => {
    try {
      const res = await fetch('/api/chat/unread');
      if (res.ok) {
        const data = await res.json();
        setTotalUnread(data.totalUnread || 0);
        const map: Record<string, { count: number }> = {};
        if (data.quotes) {
          for (const [qId, info] of Object.entries(data.quotes as Record<string, { count: number }>)) {
            map[qId] = { count: info.count };
          }
        }
        setUnreadMap(map);
      }
    } catch (e) {
      console.error(e);
    }
  };


  const getStatusBadge = (status: string) => {
    const config: Record<string, { class: string; label: string }> = {
      draft: { class: "badge-draft", label: "Borrador" },
      sent: { class: "badge-sent", label: "Enviada" },
      viewed: { class: "badge-viewed", label: "Vista" },
      accepted: { class: "badge-accepted", label: "Aceptada" },
      rejected: { class: "badge-rejected", label: "Rechazada" },
    };
    const { class: className, label } = config[status] || config.draft;
    return <span className={`badge-status ${className}`}>{label}</span>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-EC", {
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    { title: "Total", value: stats.total, icon: FileText, color: "primary" },
    { title: "Borradores", value: stats.draft, icon: Clock, color: "muted" },
    { title: "Enviadas", value: stats.sent, icon: TrendingUp, color: "tertiary" },
    { title: "Aceptadas", value: stats.accepted, icon: CheckCircle2, color: "success" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Aurora Background */}
      <div className="aurora-bg" />
      <div className="aurora-orbs">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/">
              <Logo size="sm" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/admin/perfil">
                <Button variant="ghost" size="sm">
                  <UserCircle className="w-4 h-4 mr-1.5" />
                  Perfil
                </Button>
              </Link>
              <Link href="/admin/historial">
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4 mr-1.5" />
                  Historial
                </Button>
              </Link>
              <Link href="/admin/actualizaciones">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4 mr-1.5" />
                  Novedades
                </Button>
              </Link>
              <Link href="/admin/nueva">
                <Button variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nueva
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1.5" />
                Salir
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="py-3 space-y-2 border-t border-border/50">
                  <Link href="/admin/perfil" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      <UserCircle className="w-4 h-4 mr-2" />
                      Perfil
                    </Button>
                  </Link>
                  <Link href="/admin/historial" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      <History className="w-4 h-4 mr-2" />
                      Historial
                    </Button>
                  </Link>
                  <Link href="/admin/actualizaciones" className="block">
                    <Button variant="ghost" className="w-full justify-start relative">
                      <Bell className="w-4 h-4 mr-2" />
                      Novedades
                    </Button>
                  </Link>
                  <Link href="/admin/nueva" className="block">
                    <Button variant="default" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Cotización
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 relative z-10">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">Bienvenido</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona tus cotizaciones desde aquí
          </p>
        </motion.div>

        {/* Usage Limits (if FREE) */}
        {usage.plan === "FREE" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="card-elevated border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/5 to-transparent relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-neon-cyan" />
                      Plan Gratuito
                    </h3>
                    <span className="text-sm font-medium">{usage.count} / {usage.limit} usadas</span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${usage.count >= usage.limit ? "bg-red-500" : "bg-neon-cyan"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((usage.count / usage.limit) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  {usage.count >= usage.limit && (
                    <p className="text-xs text-red-400 mt-2 font-medium">Has alcanzado el límite gratuito.</p>
                  )}
                </div>
                <Button 
                  className="btn-primary whitespace-nowrap relative z-10 w-full sm:w-auto"
                  onClick={() => window.open('https://wa.me/593999999999?text=Hola,%20quiero%20actualizar%20mi%20cuenta%20de%20Prime%20Quote%20a%20STARTER', '_blank')}
                >
                  Actualizar a Starter ($9/mes)
                </Button>
                {/* Background glow decoration */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-neon-cyan/10 blur-3xl pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="card-elevated p-3 sm:p-4 sm:p-5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/admin/nueva">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card className="card-elevated cursor-pointer group overflow-hidden">
                <CardContent className="p-4 sm:p-5 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Nueva Cotización</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Crea una propuesta profesional
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link href="/admin/historial">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card className="card-elevated cursor-pointer group overflow-hidden">
                <CardContent className="p-4 sm:p-5 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shrink-0">
                      <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Historial</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Gestiona tus cotizaciones
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </div>

        {/* Recent Quotes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recientes</h2>
            {quotes.length > 5 && (
              <Link href="/admin/historial">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  Ver todas
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : quotes.length === 0 ? (
            <Card className="card-elevated border-dashed">
              <CardContent className="py-10 sm:py-12 text-center">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4"
                >
                  <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground/50" />
                </motion.div>
                <h3 className="font-semibold mb-1.5">Sin cotizaciones</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Crea tu primera propuesta profesional
                </p>
                <Link href="/admin/nueva">
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Nueva Cotización
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {quotes.slice(0, 5).map((quote, index) => (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.03 }}
                >
                  <Link href={`/cotizacion/${quote.token}`}>
                    <Card className="card-elevated cursor-pointer group">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base truncate">{quote.companyName}</h4>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <span className="truncate">{quote.projectName || "Sin proyecto"}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">{formatDate(quote.createdAt)}</span>
                            </div>
                          </div>
                          
                          {/* Right side */}
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Unread chat badge */}
                            {unreadMap[quote.id] && unreadMap[quote.id].count > 0 && (
                              <div className="relative">
                                <MessageCircle className="w-5 h-5 text-primary" />
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                                  {unreadMap[quote.id].count}
                                </span>
                              </div>
                            )}
                            <span className="text-sm sm:text-base font-semibold text-gradient hidden sm:block">
                              {formatCurrency(quote.projectPrice)}
                            </span>
                            {getStatusBadge(quote.status)}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
