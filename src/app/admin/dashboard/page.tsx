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
  Bell,
  Download,
  Upload,
  Pencil,
  Lock,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
    role: "user",
    count: 0,
    limit: 10
  });
  const [unreadMap, setUnreadMap] = useState<Record<string, { count: number }>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteToken, setDeleteToken] = useState<string | null>(null);

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

  const handleDownloadQuote = async (e: React.MouseEvent, token: string, companyName: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/quotes/${token}/export`);
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${companyName.replace(/[^a-zA-Z0-9]/g, '_')}-${token}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Cotización descargada como JSON');
    } catch {
      toast.error('Error al descargar la cotización');
    }
  };

  const handleImportQuote = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/quotes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Import failed');
      toast.success(`Cotización importada: ${result.token}`);
      fetchQuotes();
    } catch (err: any) {
      toast.error(err.message || 'Error al importar');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleCopyLink = (e: React.MouseEvent, token: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/cotizacion/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleDeleteQuote = async () => {
    if (!deleteToken) return;
    try {
      const response = await fetch(`/api/quotes/${deleteToken}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar");
      setQuotes(prev => prev.filter(q => q.token !== deleteToken));
      toast.success("Cotización eliminada");
      // Recalc stats
      const remaining = quotes.filter(q => q.token !== deleteToken);
      setStats({
        total: remaining.length,
        draft: remaining.filter(q => q.status === "draft").length,
        sent: remaining.filter(q => q.status === "sent" || q.status === "viewed").length,
        accepted: remaining.filter(q => q.status === "accepted").length,
      });
    } catch {
      toast.error("Error al eliminar cotización");
    } finally {
      setDeleteToken(null);
    }
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
        {usage.plan === "FREE" && usage.role !== "admin" && (
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

          {/* Import Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <label htmlFor="import-file">
              <Card className="card-elevated cursor-pointer group overflow-hidden">
                <CardContent className="p-4 sm:p-5 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                      {isImporting ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" /> : <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Importar Cotización</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Restaurar desde archivo JSON
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </label>
            <input id="import-file" type="file" accept=".json" onChange={handleImportQuote} className="hidden" />
          </motion.div>
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
                            {/* Edit/Lock button */}
                            {quote.status !== 'accepted' ? (
                              <Link href={`/admin/editar/${quote.token}`} onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-muted/50 hover:bg-primary/10 transition-colors"
                                  title="Editar Cotización"
                                >
                                  <Pencil className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-muted-foreground hover:text-primary" />
                                </button>
                              </Link>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toast.info('La edición está bloqueada por seguridad. Puedes usar la función de extensión en el enlace activo.');
                                }}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-muted/30 cursor-not-allowed"
                                title="Edición bloqueada (Contrato Firmado)"
                              >
                                <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-muted-foreground/50" />
                              </button>
                            )}

                            {/* Download button */}
                            <button
                              onClick={(e) => handleDownloadQuote(e, quote.token, quote.companyName)}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-muted/50 hover:bg-muted/80 transition-colors"
                              title="Descargar Respaldo JSON"
                            >
                              <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-muted-foreground hover:text-foreground" />
                            </button>
                            <span className="text-sm sm:text-base font-semibold text-gradient hidden sm:block">
                              {formatCurrency(quote.projectPrice)}
                            </span>
                            {getStatusBadge(quote.status)}

                            {/* Three-dot menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-muted/50 hover:bg-muted/80 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                <DropdownMenuItem asChild>
                                  <Link href={`/cotizacion/${quote.token}`} target="_blank">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Abrir en nueva pestaña
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleCopyLink(e, quote.token)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar enlace
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteToken(quote.token); }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                        {/* Subtle text for accepted quotes */}
                        {quote.status === 'accepted' && (
                          <div className="mt-3 py-2 px-3 rounded-md bg-accent/5 border border-accent/10 flex items-start gap-2">
                            <Lock className="w-3.5 h-3.5 text-accent/70 mt-0.5 shrink-0" />
                            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                              Por políticas antifraude, esta cotización es inmutable tras su firma digital. Tu cliente o tú pueden solicitar o añadir nuevos servicios en la pestaña <span className="font-semibold text-accent/80">Ampliar Contrato</span> directamente en el enlace de la cotización.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteToken} onOpenChange={() => setDeleteToken(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cotización será eliminada permanentemente junto con todas sus secciones, mensajes e historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuote} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
