"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Eye,
  Copy,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  contactName: string | null;
  email: string | null;
  phone: string | null;
  projectName: string | null;
  status: string;
  createdAt: string;
  projectPrice: number | null;
  currency: string;
}

export default function HistorialPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteToken, setDeleteToken] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch("/api/quotes");
      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (error) {
      console.error(error);
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/cotizacion/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleDelete = async () => {
    if (!deleteToken) return;
    
    try {
      const response = await fetch(`/api/quotes/${deleteToken}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar");
      }
      
      setQuotes(prev => prev.filter(q => q.token !== deleteToken));
      toast.success("Cotización eliminada");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar cotización");
    } finally {
      setDeleteToken(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      viewed: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      accepted: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    const labels: Record<string, string> = {
      draft: "Borrador",
      sent: "Enviada",
      viewed: "Vista",
      accepted: "Aceptada",
      rejected: "Rechazada",
    };
    return <Badge className={`${styles[status]} border-0`}>{labels[status]}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const filteredQuotes = quotes.filter(q => 
    q.companyName.toLowerCase().includes(search.toLowerCase()) ||
    q.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    q.contactName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Logo size="sm" showText={false} />
              <div>
                <span className="font-semibold text-neon-cyan">Historial</span>
                <p className="text-xs text-muted-foreground">{quotes.length} cotizaciones</p>
              </div>
            </div>
          </div>

          <Link href="/admin/nueva">
            <button className="btn-neon-filled px-4 py-2 text-sm">
              Nueva Cotización
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar cotizaciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quotes List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <Card className="border-border/50 border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-medium mb-2">
                {search ? "Sin resultados" : "Sin cotizaciones"}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {search ? "Intenta con otros términos" : "Comienza creando tu primera cotización"}
              </p>
              {!search && (
                <Link href="/admin/nueva">
                  <Button>
                    Crear Cotización
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="border-border/50 card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{quote.companyName}</h3>
                          {getStatusBadge(quote.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {quote.projectName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {quote.projectName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(quote.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {formatCurrency(quote.projectPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link href={`/cotizacion/${quote.token}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyLink(quote.token)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/cotizacion/${quote.token}`} target="_blank">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Abrir en nueva pestaña
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(quote.token)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar enlace
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteToken(quote.token)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteToken} onOpenChange={() => setDeleteToken(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cotización será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
