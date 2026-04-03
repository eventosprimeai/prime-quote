"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Calendar,
  DollarSign,
  Copy,
  ExternalLink,
  Loader2,
  X,
  Check,
  CheckCircle2,
  FileText,
  ArrowRight,
  CreditCard,
  PenLine,
  ImageIcon,
  Download,
  MessageCircle,
  ShieldCheck,
  ScrollText,
  Globe,
  Monitor
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/ui/logo";
import { ChatWidget } from "@/components/ui/chat-widget";
import Link from "next/link";
import { toast } from "sonner";
import * as Icons from "lucide-react";

interface QuoteSection {
  id: string;
  title: string;
  content: string;
  isVisible: boolean;
  order: number;
  templateSection: {
    key: string;
    icon: string | null;
  };
}

interface CustomSection {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  order: number;
}

interface PaymentMethod {
  type: string;
  name: string;
  bank: string;
  accountType: string;
  accountNumber: string;
  ruc: string;
  email: string;
  phone: string;
}

interface BusinessProfile {
  userId: string;
  companyName: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  taxId: string | null;
  paymentMethods: string | null;
  conditions: string | null;
}

interface Quote {
  id: string;
  token: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  projectName: string | null;
  projectPrice: number | null;
  quoteType: string;
  percentageValue: number | null;
  currency: string;
  status: string;
  paymentLink: string | null;
  logoUrl: string | null;
  themeColor: string | null;
  createdAt: string;
  template: {
    name: string;
  };
  user: {
    id: string;
    name: string;
    role: string;
    plan: string;
    profile: BusinessProfile | null;
  };
  sections: QuoteSection[];
  customSections: CustomSection[];
  messages?: any[];
  contract?: { id: string; content: string; metadata: string | null; signature: string | null; signedAt: string; } | null;
}

export default function CotizacionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // States for Extensions / Capture
  const [isUploadingCapture, setIsUploadingCapture] = useState(false);
  const [showExtensionInput, setShowExtensionInput] = useState(false);
  const [extensionText, setExtensionText] = useState("");
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Optional service selections
  const [enabledOptionals, setEnabledOptionals] = useState<Record<string, boolean>>({});
  const [optionalsLocked, setOptionalsLocked] = useState(false);

  // Contract modal & client signing
  const [showContractModal, setShowContractModal] = useState(false);
  const [clientSigner, setClientSigner] = useState<{ email: string; name: string } | null>(null);
  const [isCheckingSigner, setIsCheckingSigner] = useState(false);
  const contractBottomRef = useRef<HTMLDivElement>(null);

  // Must declare before useEffects that consume it
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchUser();
    fetchQuote();
    checkClientSigner();
  }, [token]);

  // Detect return from Google OAuth (client_verified or sign_error)
  useEffect(() => {
    const verified = searchParams.get('client_verified');
    const signError = searchParams.get('sign_error');
    if (verified === '1') {
      checkClientSigner();
      window.history.replaceState({}, '', `/cotizacion/${token}`);
    }
    if (signError === 'owner_cannot_sign') {
      toast.error('El propietario de la cotización no puede firmar su propio contrato.');
      window.history.replaceState({}, '', `/cotizacion/${token}`);
    }
  }, [searchParams]);

  // ─── Referral Engine ────────────────────────────────────────────

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (!refCode) return;

    // Notificar al API Hub silenciosamente (fire & forget)
    const registerTouch = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_HUB_URL || "http://localhost:3006"}/api/referral/touch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref_code: refCode,
            source_app: "primequote",
            quote_token: token,
            landing_url: window.location.href,
          }),
        });
      } catch {
        // Silencioso — nunca interrumpir la experiencia del cliente
      }
    };

    registerTouch();
  }, [searchParams, token]);
  // ─────────────────────────────────────────────────────────────────

  const fetchUser = async () => {
    try {
       const res = await fetch("/api/auth/me");
       if (res.ok) {
         const data = await res.json();
         setCurrentUser(data.user);
       }
    } catch {}
  };

  const checkClientSigner = async () => {
    setIsCheckingSigner(true);
    try {
      const res = await fetch(`/api/auth/client-signer?token=${token}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verified) setClientSigner({ email: data.email, name: data.name });
        else setClientSigner(null);
      }
    } catch {} finally {
      setIsCheckingSigner(false);
    }
  };

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${token}`);
      if (!response.ok) {
        setError("Cotización no encontrada");
        return;
      }
      const data = await response.json();
      setQuote(data);
      // Fetch optionals after quote loads
      fetchOptionals();
    } catch (err) {
      setError("Error al cargar la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptionals = async () => {
    try {
      const res = await fetch(`/api/quotes/${token}/optionals`);
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, boolean> = {};
        (data.selections || []).forEach((s: any) => { map[s.customSectionId] = s.enabled; });
        setEnabledOptionals(map);
        setOptionalsLocked(data.locked || false);
      }
    } catch {}
  };

  const handleToggleOptional = async (sectionId: string, enabled: boolean) => {
    if (optionalsLocked) return;
    setEnabledOptionals(prev => ({ ...prev, [sectionId]: enabled }));
    try {
      await fetch(`/api/quotes/${token}/optionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSectionId: sectionId, enabled }),
      });
    } catch {
      setEnabledOptionals(prev => ({ ...prev, [sectionId]: !enabled }));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  /**
   * Genera un hash corto del userId para el sistema de referidos.
   * No expone el ID real — solo un hash reproducible de 12 chars.
   */
  const generateRefCode = (userId: string): string => {
    // Simple hash: XOR de charCodes + base36. No requiere crypto en cliente.
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  };

  const handleCopyLink = () => {
    // Generar URL con ?ref= si el usuario logueado es el creador de la cotización
    let shareUrl = window.location.href.split("?")[0]; // URL base sin params
    if (currentUser?.id) {
      const refCode = generateRefCode(currentUser.id);
      shareUrl = `${shareUrl}?ref=${refCode}`;
    }
    navigator.clipboard.writeText(shareUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleApprove = async () => {
    if (!quote) return;
    setIsApproving(true);
    
    try {
      const response = await fetch(`/api/quotes/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: "Aprobación Electrónica del Cliente" })
      });

      if (!response.ok) {
        throw new Error("Error al aprobar");
      }

      toast.success("Cotización aprobada. Contrato Generado Exitosamente.");
      fetchQuote(); // Reload to get contract and messages
    } catch (err) {
      toast.error("Hubo un problema al aprobar la cotización.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleExtension = async () => {
    if (!quote) return;
    if (!extensionText.trim()) { toast.error("El texto de la extensión no puede estar vacío"); return; }
    
    setIsSubmittingExtension(true);
    
    const isProfessional = currentUser && currentUser.id === quote.user.profile?.userId;
    const action = isProfessional ? "DIRECT_EXTENSION" : "REQUEST_MODIFICATION";

    try {
      const response = await fetch(`/api/quotes/${token}/contract/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extensionText, action })
      });

      if (!response.ok) {
        throw new Error("Error al enviar extensión");
      }

      toast.success(isProfessional ? "Extensión agregada formalmente al contrato" : "Solicitud de modificación enviada");
      setExtensionText("");
      setShowExtensionInput(false);
      fetchQuote(); // Reload to get contract and messages
    } catch (err) {
      toast.error("Hubo un problema al procesar la extensión.");
    } finally {
      setIsSubmittingExtension(false);
    }
  };

  const handleApproveModification = async (messageId: string) => {
     try {
       const res = await fetch(`/api/quotes/${token}/messages/${messageId}/approve`, { method: "POST" });
       if (!res.ok) throw new Error();
       toast.success("Solicitud aprobada e integrada al contrato");
       fetchQuote();
     } catch {
       toast.error("Error al aprobar solicitud");
     }
  };

  const handleCaptureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !quote) return;
    
    setIsUploadingCapture(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "payment_capture");
    formData.append("quoteId", quote.id);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir captura");
      }

      toast.success("Captura de pago enviada con éxito");
      fetchQuote();
    } catch (err) {
      toast.error("Hubo un problema procesando la imagen de captura.");
    } finally {
      setIsUploadingCapture(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return FileText;
    const Icon = (Icons as any)[iconName] as React.ElementType;
    return Icon || Icons.FileText;
  };

  const parseContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return { type: "text", text: content };
    }
  };

  const renderContent = (content: string) => {
    const parsed = parseContent(content);
    
    if (parsed.type === "text") {
      return (
        <div className="space-y-5">
          {parsed.text && (
            <p className="text-muted-foreground leading-relaxed text-lg">{parsed.text}</p>
          )}
          {parsed.items && (
            <div className="grid gap-4 mt-6">
              {parsed.items.map((item: { title?: string; subtitle?: string; description?: string }, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-4 p-5 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 hover:bg-muted/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    {item.title && <h4 className="font-semibold text-lg">{item.title}</h4>}
                    {item.subtitle && <p className="text-muted-foreground mt-1">{item.subtitle}</p>}
                    {item.description && <p className="text-muted-foreground text-sm mt-2">{item.description}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {parsed.link && (
            <motion.a
              href={parsed.link.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 transition-all text-sm font-semibold group"
            >
              <ExternalLink className="w-5 h-5" />
              {parsed.link.text}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          )}
        </div>
      );
    }

    if (parsed.type === "list") {
      return (
        <div className="grid gap-4">
          {parsed.items?.map((item: { title?: string; subtitle?: string; items?: string[] }, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="p-5 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-all"
            >
              {item.title && <h4 className="font-semibold text-lg mb-2">{item.title}</h4>}
              {item.subtitle && <p className="text-muted-foreground">{item.subtitle}</p>}
              {item.items && (
                <ul className="mt-4 space-y-2">
                  {item.items.map((subItem: string, j: number) => (
                    <li key={j} className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent shrink-0" />
                      {subItem}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      );
    }

    if (parsed.type === "timeline") {
      return (
        <div className="relative pl-8 py-4">
          <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-accent to-transparent rounded-full" />
          {parsed.items?.map((item: { title: string; description: string }, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative pb-8 last:pb-0"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.1, type: "spring" }}
                className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-4 ring-background shadow-lg shadow-primary/30"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </motion.div>
              <h4 className="font-semibold text-lg">{item.title}</h4>
              <p className="text-muted-foreground mt-1">{item.description}</p>
            </motion.div>
          ))}
        </div>
      );
    }

    if (parsed.type === "architecture") {
      return (
        <div className="space-y-6">
          {parsed.intro && <p className="text-muted-foreground text-lg">{parsed.intro}</p>}
          <div className="grid gap-5">
            {parsed.pages?.map((page: { title: string; icon?: string; sections?: string[] }, i: number) => {
              const PageIcon = page.icon ? ((Icons as any)[page.icon] as React.ElementType) || FileText : FileText;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <PageIcon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg">{page.title}</h4>
                  </div>
                  {page.sections && (
                    <ul className="space-y-2 ml-1">
                      {page.sections.map((section: string, j: number) => (
                        <li key={j} className="flex items-center gap-3 text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent shrink-0" />
                          {section}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    }

    if (parsed.type === "payment") {
      return (
        <div className="space-y-6">
          {parsed.items?.map((item: { title?: string; subtitle?: string; description?: string }, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-5 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                {item.title && <h4 className="font-semibold text-lg">{item.title}</h4>}
                {item.subtitle && <p className="text-muted-foreground mt-1">{item.subtitle}</p>}
                {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden bg-grid">
        <div className="bg-glow fixed inset-0 pointer-events-none" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center relative z-10">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6"
          >
            <Logo size="lg" showText={false} />
          </motion.div>
          <p className="text-muted-foreground text-lg">Cargando cotización...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <div className="absolute inset-0 gradient-mesh" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-md w-full text-center border-red-500/30 bg-card/80 backdrop-blur-xl shadow-2xl">
            <CardContent className="pt-12 pb-12 relative">
              <div className="absolute inset-0 bg-red-500/5 rounded-2xl" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6"
              >
                <X className="w-10 h-10 text-red-500" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">Cotización no encontrada</h2>
              <p className="text-muted-foreground">
                El enlace que intentas acceder no existe o ha sido eliminado.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const visibleSections = quote.sections.filter(s => s.isVisible);
  const profile = quote.user?.profile;
  let paymentMethods: PaymentMethod[] = [];

  if (profile?.paymentMethods) {
    try {
      paymentMethods = JSON.parse(profile.paymentMethods);
    } catch {
      paymentMethods = [];
    }
  }

  const isSuiteOrAdmin = quote.user.plan === "SUITE" || quote.user.role === "admin";
  let isCustomTheme = false;
  let useWhiteLabel = false;
  let glow1 = ""; 
  let glow2 = ""; 

  if (isSuiteOrAdmin && quote.themeColor) {
    if (quote.themeColor.startsWith("{")) {
       try {
         const parsed = JSON.parse(quote.themeColor);
         if (parsed.preset === "custom") {
           glow1 = parsed.glow1;
           glow2 = parsed.glow2;
           isCustomTheme = true;
         }
         useWhiteLabel = !!parsed.whiteLabel;
       } catch (e) {}
    } else if (quote.themeColor !== "default") {
       // Backup for old quotes that used text preset
       switch (quote.themeColor) {
         case "ocean": glow1 = "#0ea5e9"; glow2 = "#2563eb"; isCustomTheme = true; break; 
         case "emerald": glow1 = "#10b981"; glow2 = "#059669"; isCustomTheme = true; break; 
         case "ruby": glow1 = "#f43f5e"; glow2 = "#e11d48"; isCustomTheme = true; break; 
         case "amethyst": glow1 = "#d946ef"; glow2 = "#9333ea"; isCustomTheme = true; break; 
       }
       useWhiteLabel = true;
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-50" />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className={`fixed top-20 left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none ${isCustomTheme ? 'opacity-60' : 'bg-primary/20'}`}
        style={isCustomTheme ? { backgroundColor: glow1 } : undefined}
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className={`fixed bottom-20 right-10 w-80 h-80 rounded-full blur-3xl pointer-events-none ${isCustomTheme ? 'opacity-60' : 'bg-accent/15'}`}
        style={isCustomTheme ? { backgroundColor: glow2 } : undefined}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/">
              {useWhiteLabel && quote.logoUrl ? (
                <img src={quote.logoUrl} alt="Company Logo" className="h-10 object-contain" />
              ) : (
                <Logo size="md" />
              )}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button 
              onClick={handleCopyLink}
              className="btn-neon px-4 py-2 text-sm flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar enlace
            </button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="text-center"
          >
            {quote.logoUrl && !useWhiteLabel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-8"
              >
                <div className="w-32 h-32 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center p-4">
                  <img
                    src={quote.logoUrl}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="secondary" className="mb-6 px-5 py-2 text-sm font-medium bg-primary/10 border-primary/20 text-primary">
                Propuesta de Servicios
              </Badge>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {quote.projectName || quote.template.name}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground mb-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full"
              >
                <Building2 className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{quote.companyName}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-full"
              >
                <Calendar className="w-5 h-5 text-accent" />
                <span>{formatDate(quote.createdAt)}</span>
              </motion.div>
            </div>

            {(quote.quoteType === "SINGLE" || quote.quoteType === "SPLIT" || quote.quoteType === "CUSTOM" || quote.quoteType === "FIXED" || !quote.quoteType) && quote.projectPrice && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 backdrop-blur-sm"
              >
                <DollarSign className="w-8 h-8 text-primary" />
                <span className="text-4xl md:text-5xl font-bold text-gradient">
                  {formatCurrency(quote.projectPrice)}
                </span>
              </motion.div>
            )}

            {quote.quoteType === "PERCENTAGE" && quote.percentageValue && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/20 backdrop-blur-sm shadow-lg shadow-green-500/5 group hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-inner group-hover:rotate-12 transition-transform">
                  <span className="text-2xl font-bold drop-shadow-md">%</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
                    {quote.percentageValue}%
                  </span>
                  <span className="text-sm md:text-base font-semibold text-green-500 uppercase tracking-widest mt-1">
                    Participación de Ganancias
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Legacy template sections in expanded accordion */}
          {visibleSections.length > 0 && (
            <Accordion type="multiple" defaultValue={visibleSections.map((s, i) => s.templateSection?.key || `section-${i}`)} className="space-y-5">
              {visibleSections.map((section, index) => {
                const Icon = getIcon(section.templateSection.icon);
                const sectionKey = section.templateSection?.key || `section-${index}`;
                return (
                  <motion.div key={sectionKey} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: index * 0.08 }}>
                    <AccordionItem value={sectionKey} className="border border-border/30 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden data-[state=open]:bg-card/80 data-[state=open]:border-primary/30 data-[state=open]:shadow-lg data-[state=open]:shadow-primary/5 transition-all">
                      <AccordionTrigger className="px-7 py-6 hover:no-underline hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors group-hover:scale-110 duration-300">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-xl font-semibold text-left">{section.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-7 pb-7">
                        <Separator className="mb-7 bg-border/50" />
                        {renderContent(section.content)}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                );
              })}
            </Accordion>
          )}

          {/* Custom Sections — Mixed Rendering */}
          {(() => {
            const filteredSections = quote.customSections.filter(cs => {
              try { const p = JSON.parse(cs.content || "{}"); return p.type !== "contract_clause"; } catch { return true; }
            });

            // Group sections: consecutive non-divider sections go into accordion groups
            const groups: { type: 'accordion' | 'divider'; items: typeof filteredSections }[] = [];
            let currentAccordion: typeof filteredSections = [];

            filteredSections.forEach(cs => {
              let parsed: any = {};
              try { parsed = JSON.parse(cs.content || "{}"); } catch {}
              if (parsed.type === 'image_full_width' || parsed.type === 'section_heading') {
                if (currentAccordion.length > 0) {
                  groups.push({ type: 'accordion', items: [...currentAccordion] });
                  currentAccordion = [];
                }
                groups.push({ type: 'divider', items: [cs] });
              } else {
                currentAccordion.push(cs);
              }
            });
            if (currentAccordion.length > 0) {
              groups.push({ type: 'accordion', items: [...currentAccordion] });
            }

            // Calculate optionals total for dynamic price
            const optionalsTotal = filteredSections.reduce((acc, cs) => {
              try {
                const p = JSON.parse(cs.content || "{}");
                if (p.hasPrice && !p.includeInTotal && enabledOptionals[cs.id]) {
                  const iva = p.hasIva ? 1 + ((p.ivaPercent || 15) / 100) : 1;
                  return acc + ((p.price || 0) * iva);
                }
              } catch {}
              return acc;
            }, 0);

            return groups.map((group, gIdx) => {
              if (group.type === 'divider') {
                const cs = group.items[0];
                let parsed: any = {};
                try { parsed = JSON.parse(cs.content || "{}"); } catch {}

                if (parsed.type === 'image_full_width' && cs.imageUrl) {
                  return (
                    <motion.div key={`divider-${cs.id}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="w-full overflow-hidden cursor-pointer -mx-6 sm:mx-0 sm:rounded-2xl" onClick={() => setLightboxSrc(cs.imageUrl)}>
                      <img src={cs.imageUrl} alt={cs.title} className="w-full h-auto object-cover max-h-[600px] block" />
                    </motion.div>
                  );
                }

                if (parsed.type === 'section_heading') {
                  return (
                    <motion.div key={`heading-${cs.id}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="py-10 text-center">
                      <div className="flex items-center gap-4 justify-center mb-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        <div className="w-3 h-3 rounded-full bg-primary/30" />
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gradient">{cs.title}</h2>
                      {parsed.description && <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{parsed.description}</p>}
                      <div className="flex items-center gap-4 justify-center mt-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                        <div className="w-3 h-3 rounded-full bg-accent/30" />
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                      </div>
                    </motion.div>
                  );
                }
                return null;
              }

              // Accordion group
              const defaultValues = group.items.map(cs => `custom-${cs.id}`);
              return (
                <Accordion key={`group-${gIdx}`} type="multiple" defaultValue={defaultValues} className="space-y-5">
                  {group.items.map((cs, index) => {
                    let parsed: any = {};
                    try { parsed = JSON.parse(cs.content || "{}"); } catch {}
                    const isOptional = parsed.hasPrice && !parsed.includeInTotal;
                    const optionalEnabled = enabledOptionals[cs.id] || false;

                    return (
                      <motion.div key={`custom-${cs.id}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: index * 0.08 }}>
                        <AccordionItem value={`custom-${cs.id}`} className="border border-border/30 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden data-[state=open]:bg-card/80 data-[state=open]:border-accent/30 data-[state=open]:shadow-lg data-[state=open]:shadow-accent/5 transition-all">
                          <AccordionTrigger className="px-7 py-6 hover:no-underline hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center gap-5 w-full">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center group-hover:from-accent/20 group-hover:to-primary/20 transition-colors group-hover:scale-110 duration-300">
                                <PenLine className="w-6 h-6 text-accent" />
                              </div>
                              <span className="text-xl font-semibold text-left flex-1">{cs.title}</span>
                              {/* Optional price badge */}
                              {isOptional && parsed.price && (
                                <div className="flex items-center gap-3 mr-2" onClick={e => e.stopPropagation()}>
                                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${optionalEnabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    +{formatCurrency(parsed.price * (parsed.hasIva ? 1 + ((parsed.ivaPercent || 15) / 100) : 1))}
                                  </span>
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleOptional(cs.id, !optionalEnabled); }}
                                    disabled={optionalsLocked}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${optionalEnabled ? 'bg-primary' : 'bg-muted-foreground/30'} ${optionalsLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${optionalEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                  </button>
                                </div>
                              )}
                              {/* Mandatory price */}
                              {parsed.hasPrice && parsed.includeInTotal && parsed.price && (
                                <span className="text-sm font-semibold text-primary mr-2 bg-primary/10 px-3 py-1 rounded-full">
                                  {formatCurrency(parsed.price * (parsed.hasIva ? 1 + ((parsed.ivaPercent || 15) / 100) : 1))}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-7 pb-7">
                            <Separator className="mb-7 bg-border/50" />
                            <div className="space-y-5">
                              {(() => {
                                if (!parsed || typeof parsed !== 'object') {
                                  return <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{cs.content}</p>;
                                }
                                return (
                                  <div className="space-y-6">
                                    {(parsed.type === "standard" || parsed.type === "title_desc_img_right" || parsed.type === "title_desc_img_left") && (
                                      <div className={`flex flex-col gap-6 ${parsed.type === "title_desc_img_right" ? "md:flex-row" : parsed.type === "title_desc_img_left" ? "md:flex-row-reverse" : ""}`}>
                                        <div className="flex-1 space-y-4">
                                          {parsed.description && <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{parsed.description}</p>}
                                        </div>
                                        {cs.imageUrl && (parsed.type === "title_desc_img_right" || parsed.type === "title_desc_img_left") && (
                                          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="w-full md:w-1/2 rounded-xl overflow-hidden border border-border/30 shadow-xl shadow-primary/5 cursor-pointer" onClick={() => setLightboxSrc(cs.imageUrl)}>
                                            <img src={cs.imageUrl} alt={cs.title} className="w-full h-auto object-cover max-h-96" />
                                          </motion.div>
                                        )}
                                      </div>
                                    )}
                                    {parsed.type === "title_desc_button" && (
                                      <div className="space-y-6">
                                        {parsed.description && <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{parsed.description}</p>}
                                        {parsed.buttonUrl && (
                                          <a href={parsed.buttonUrl} target="_blank" rel="noopener noreferrer">
                                            <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all text-base font-semibold text-white">
                                              Acceder al enlace <ExternalLink className="w-4 h-4 ml-2" />
                                            </Button>
                                          </a>
                                        )}
                                      </div>
                                    )}
                                    {parsed.type === "contact" && (
                                      <div className="flex flex-col items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 max-w-lg">
                                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                          <MessageCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                          <h4 className="text-xl font-semibold mb-1">Ponte en contacto</h4>
                                          <p className="text-muted-foreground">Conversemos directamente por WhatsApp para aclarar cualquier duda sobre esta propuesta.</p>
                                        </div>
                                        <a href={`https://api.whatsapp.com/send?phone=${parsed.phoneNumber?.replace(/\D/g, '')}&text=${encodeURIComponent(parsed.messageText || "Hola, quiero más información sobre la cotización")}`} target="_blank" rel="noopener noreferrer" className="w-full mt-2">
                                          <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl text-md flex items-center gap-2 shadow-lg shadow-green-500/20">
                                            <MessageCircle className="w-5 h-5" /> Enviar Mensaje
                                          </Button>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    );
                  })}
                </Accordion>
              );
            });
          })()}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxSrc(null)}
        >
          <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
            <X className="w-6 h-6" />
          </button>
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25 }}
            src={lightboxSrc}
            alt="Imagen ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
            onClick={e => e.stopPropagation()}
          />
        </motion.div>
      )}

      {/* Dynamic Payment Info & Contract Hub */}
      {(paymentMethods.length > 0 || profile?.conditions || quote.status === "accepted") && (
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            {quote.status !== "accepted" ? (
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden">
                  <div className="absolute inset-0 gradient-border-animated rounded-2xl pointer-events-none" />
                  <CardContent className="p-10 relative">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                    
                    <div className="text-center mb-10 relative">
                      <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", delay: 0.3 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 glow-primary">
                        <CreditCard className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-3xl font-bold mb-3">¿Listo para comenzar?</h3>
                      <p className="text-muted-foreground text-lg mb-8">
                        {profile?.conditions || "Para iniciar el proyecto, aprueba esta cotización revisando detalladamente la propuesta superior."}
                      </p>
                      
                      <div id="contract-action-section" className="mt-8 border-t border-border/50 pt-8">
                        {clientSigner ? (
                          <>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-5 justify-center">
                              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                              <p className="text-sm text-green-400 font-semibold">{clientSigner.name} &mdash; {clientSigner.email}</p>
                            </div>
                            <Button
                              disabled={isApproving}
                              onClick={handleApprove}
                              className="btn-neon w-full sm:w-auto h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                            >
                              {isApproving ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <PenLine className="w-6 h-6 mr-3" />}
                              Aprobar y Firmar Digitalmente
                            </Button>
                            <p className="text-xs text-muted-foreground mt-3">
                              Al firmar, aceptas íntegramente el contrato. Esta acción es irreversible.
                            </p>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => setShowContractModal(true)}
                              className="btn-neon w-full sm:w-auto h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                            >
                              <ScrollText className="w-6 h-6 mr-3" />
                              Ver Contrato
                            </Button>
                            <p className="text-xs text-muted-foreground mt-3">
                              Revisa el contrato completo y firma digitalmente al final.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {(quote.quoteType === "SPLIT" || quote.quoteType === "FIXED" || !quote.quoteType) && quote.projectPrice && (
                      <div className="grid md:grid-cols-2 gap-6 mb-10">
                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="p-7 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 text-center relative overflow-hidden group">
                          <p className="text-sm text-muted-foreground mb-3 relative">Primer pago (50%)</p>
                          <p className="text-4xl font-bold text-gradient mb-3 relative">{formatCurrency(quote.projectPrice * 0.5)}</p>
                          <p className="text-sm text-muted-foreground relative">Para iniciar el desarrollo</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="p-7 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 text-center relative overflow-hidden group">
                          <p className="text-sm text-muted-foreground mb-3 relative">Pago final (50%)</p>
                          <p className="text-4xl font-bold text-gradient mb-3 relative">{formatCurrency(quote.projectPrice * 0.5)}</p>
                          <p className="text-sm text-muted-foreground relative">Al momento de la entrega</p>
                        </motion.div>
                      </div>
                    )}
                    {quote.quoteType === "SINGLE" && quote.projectPrice && (
                      <div className="mb-10 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-center relative overflow-hidden group">
                        <p className="text-sm text-muted-foreground mb-3 relative">Pago Único (100%)</p>
                        <p className="text-4xl font-bold text-gradient mb-3 relative">{formatCurrency(quote.projectPrice)}</p>
                        <p className="text-sm text-muted-foreground relative">Liquidación total programada</p>
                      </div>
                    )}
                    {quote.quoteType === "PERCENTAGE" && quote.percentageValue && (
                      <div className="mb-10 p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 text-center relative overflow-hidden group">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 relative z-10 text-green-500"><span className="text-3xl font-bold">%</span></div>
                        <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400 mb-2 relative">{quote.percentageValue}% de Participación en Utilidades</p>
                      </div>
                    )}
                    {paymentMethods.length > 0 && (
                      <div className="grid md:grid-cols-2 gap-6 relative">
                        {paymentMethods.map((pm, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.1 }} className="p-6 rounded-xl bg-muted/30 border border-border/30">
                            <p className="font-semibold mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-primary text-sm font-bold">{String.fromCharCode(65 + i)}</span></span>
                              {pm.type || `Método ${i + 1}`}
                            </p>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              {pm.name && <p><span className="font-medium text-foreground">{pm.name}</span></p>}
                              {pm.bank && <p>{pm.bank}{pm.accountType ? ` - ${pm.accountType}` : ""}</p>}
                              {pm.accountNumber && <p>Cuenta: {pm.accountNumber}</p>}
                              {pm.ruc && <p>{pm.ruc}</p>}
                              {pm.email && <p>{pm.email}</p>}
                              {pm.phone && <p>Tel: {pm.phone}</p>}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-card to-accent/5 overflow-hidden relative shadow-2xl shadow-green-500/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl opacity-50" />
                 
                  <CardContent className="p-6 md:p-12 relative text-left">
                    <div className="flex items-center gap-3 text-green-500 font-bold bg-green-500/10 px-6 py-3 rounded-full border border-green-500/20 w-fit mb-8">
                       <CheckCircle2 className="w-5 h-5" /> Contrato Digital Activo
                    </div>

                    {/* Contract Content — Formal Legal Document */}
                    {quote.contract && (
                      <div className="space-y-0 text-foreground/85 leading-relaxed bg-muted/10 rounded-xl border border-border/50 overflow-hidden">
                        
                        {/* Formal Header */}
                        <div className="bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 px-8 py-6 border-b border-border/50 text-center">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans font-semibold mb-2">Documento Legal Vinculante</p>
                          <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif tracking-tight">
                            ACUERDO DE SERVICIOS PROFESIONALES
                          </h2>
                          <p className="text-sm text-muted-foreground font-mono mt-2">
                            Contrato N.&deg; {quote.token.substring(0, 8).toUpperCase()}-{new Date(quote.createdAt).getFullYear()}
                          </p>
                        </div>

                        <div className="px-8 py-8 space-y-8 font-serif text-[0.95rem]">

                          {/* Parties Section */}
                          <div className="space-y-4 pb-6 border-b border-border/40">
                            <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-foreground">Entre las Partes</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold mb-1">Prestador de Servicios</p>
                                <p className="font-bold text-foreground text-lg font-sans">{quote.user.profile?.companyName || quote.user.name}</p>
                                {quote.user.profile?.taxId && <p className="text-sm text-muted-foreground font-sans mt-0.5">RUC/NIT: {quote.user.profile.taxId}</p>}
                              </div>
                              <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold mb-1">Contratante</p>
                                <p className="font-bold text-foreground text-lg font-sans">{quote.companyName}</p>
                                {quote.contactName && <p className="text-sm text-muted-foreground font-sans mt-0.5">Representado por: {quote.contactName}</p>}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground font-sans">
                              Celebrado en la fecha <span className="font-semibold text-foreground">{formatDate(quote.createdAt)}</span>, respecto al proyecto denominado <span className="font-semibold text-foreground">&ldquo;{quote.projectName || "Servicios Profesionales"}&rdquo;</span>.
                            </p>
                          </div>

                          {/* Contract Body / Legal Terms */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-foreground">Cuerpo del Contrato</h3>
                            {(() => {
                              try {
                                const c = JSON.parse(quote.contract.content);
                                const paragraphs = c.legalTerms.split('\n\n');
                                return paragraphs.map((paragraph: string, idx: number) => (
                                  <div key={idx} className="flex gap-3">
                                    <span className="text-xs font-mono text-muted-foreground/60 mt-1 shrink-0 w-6 text-right">{idx + 1}.</span>
                                    <p className="whitespace-pre-wrap flex-1">{paragraph}</p>
                                  </div>
                                ));
                              } catch {
                                return <p className="whitespace-pre-wrap">{quote.contract.content}</p>;
                              }
                            })()}
                          </div>

                          {/* Contract Clauses from custom sections */}
                          {(() => {
                            const contractClauses = quote.customSections.filter(cs => {
                              try { const p = JSON.parse(cs.content || "{}"); return p.type === "contract_clause"; } catch { return false; }
                            });
                            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
                            if (contractClauses.length === 0) return null;
                            return (
                              <div className="space-y-4 pt-6 border-t border-border/40">
                                <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-foreground">Cl&aacute;usulas Adicionales</h3>
                                <div className="space-y-5">
                                  {contractClauses.map((clause, idx) => {
                                    let parsed: any = {};
                                    try { parsed = JSON.parse(clause.content || "{}"); } catch {}
                                    return (
                                      <div key={clause.id} className="pl-4 border-l-2 border-amber-500/40 space-y-1">
                                        <p className="font-bold font-sans text-foreground flex items-center gap-2">
                                          <span className="text-amber-500 font-serif">{romanNumerals[idx] || `${idx + 1}`}.</span>
                                          {clause.title}
                                        </p>
                                        {parsed.description && (
                                          <p className="whitespace-pre-wrap text-foreground/80 pl-6">{parsed.description}</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Signature Block — with forensic metadata */}
                          <div className="pt-6 border-t border-border/40 space-y-4">
                            <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-foreground">Firma y Validaci&oacute;n</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold">Firma Criptogr&aacute;fica</p>
                                <p className="font-mono text-xs break-all text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">{quote.contract.signature}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold">Fecha de Firma</p>
                                <p className="text-foreground font-sans font-medium">{new Date(quote.contract.signedAt).toLocaleString("es-EC")}</p>
                                <p className="text-xs text-muted-foreground font-sans">Hora del servidor registrada</p>
                              </div>
                            </div>
                            {/* Forensic metadata from Google OAuth */}
                            {(() => {
                              try {
                                const meta = JSON.parse(quote.contract.metadata || '{}');
                                if (!meta.clientEmail && !meta.ipAddress) return null;
                                return (
                                  <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
                                    <p className="text-xs uppercase tracking-wider font-sans font-semibold text-green-400 flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4" /> Verificaci&oacute;n del Firmante
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-3 text-xs font-sans">
                                      {meta.clientEmail && (
                                        <div className="flex items-start gap-2">
                                          <ShieldCheck className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-muted-foreground">Correo verificado</p>
                                            <p className="text-foreground font-medium">{meta.clientEmail}</p>
                                          </div>
                                        </div>
                                      )}
                                      {meta.authMethod && (
                                        <div className="flex items-start gap-2">
                                          <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-muted-foreground">M&eacute;todo de autenticaci&oacute;n</p>
                                            <p className="text-foreground font-medium">{meta.authMethod}</p>
                                          </div>
                                        </div>
                                      )}
                                      {meta.ipAddress && meta.ipAddress !== 'Unknown' && (
                                        <div className="flex items-start gap-2">
                                          <Globe className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-muted-foreground">Direcci&oacute;n IP</p>
                                            <p className="text-foreground font-mono">{meta.ipAddress}</p>
                                          </div>
                                        </div>
                                      )}
                                      {meta.userAgent && meta.userAgent !== 'Unknown' && (
                                        <div className="flex items-start gap-2">
                                          <Monitor className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-muted-foreground">Dispositivo</p>
                                            <p className="text-foreground truncate" title={meta.userAgent}>
                                              {meta.userAgent.includes('Mobile') ? '📱 Móvil' : '💻 Escritorio'}
                                              {meta.userAgent.includes('Chrome') ? ' · Chrome' : meta.userAgent.includes('Firefox') ? ' · Firefox' : meta.userAgent.includes('Safari') ? ' · Safari' : ''}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              } catch { return null; }
                            })()}
                          </div>

                          {/* Legal Footer */}
                          <div className="pt-6 border-t border-border/40">
                            <p className="text-xs text-muted-foreground font-sans text-center leading-relaxed italic">
                              Este documento constituye un acuerdo legal vinculante entre las partes firmantes. 
                              Cualquier modificaci&oacute;n posterior deber&aacute; realizarse mediante adenda formal con consentimiento mutuo. 
                              La firma digital tiene la misma validez legal que una firma manuscrita conforme a la legislaci&oacute;n vigente sobre comercio electr&oacute;nico.
                            </p>
                          </div>

                          {/* Extensions Render */}
                          {quote.contract.metadata && (() => { try { return JSON.parse(quote.contract.metadata).length > 0; } catch { return false; } })() && (
                            <div className="pt-6 border-t-2 border-dashed border-primary/30 space-y-4">
                              <h3 className="font-sans font-bold text-primary flex items-center gap-2"><PenLine className="w-5 h-5" /> Adendas y Extensiones Aprobadas</h3>
                              <div className="space-y-4 font-sans">
                                {(() => { try { return JSON.parse(quote.contract.metadata); } catch { return []; } })().map((ext: any, idx: number) => (
                                  <div key={idx} className="bg-primary/5 border border-primary/20 p-4 rounded-lg relative overflow-hidden">
                                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                     <p className="text-sm text-foreground pl-3">{ext.text}</p>
                                     <p className="text-xs text-muted-foreground mt-2 text-right">{new Date(ext.date).toLocaleString("es-EC")}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Modification Request Input */}
                          {showExtensionInput && (
                            <div className="p-6 bg-background rounded-xl border border-primary/30 font-sans">
                              <h4 className="font-bold mb-3">{currentUser?.id === quote.user.profile?.userId ? "A\u00f1adir Cl\u00e1usula Extensiva" : "Solicitar Modificaci\u00f3n del Contrato"}</h4>
                              <textarea className="w-full bg-muted p-4 rounded-lg outline-none min-h-[100px] resize-y border border-border focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Escribe el texto detallado..." value={extensionText} onChange={(e) => setExtensionText(e.target.value)} />
                              <div className="flex justify-end gap-3 mt-4">
                                 <Button variant="ghost" onClick={() => setShowExtensionInput(false)}>Cancelar</Button>
                                 <Button className="btn-primary" disabled={isSubmittingExtension} onClick={handleExtension}>
                                   {isSubmittingExtension ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                                 </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Post-Contract Action Hub */}
                    <div className="mt-10 border-t border-border/50 pt-10 font-sans flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-3">
                         <Button variant="outline" className="h-12 px-6 rounded-xl font-semibold border-primary/30 hover:bg-primary/10" onClick={() => {
                            if (!currentUser) return window.location.href = "/auth/login";
                            setShowExtensionInput(!showExtensionInput);
                         }}>
                            {currentUser?.id === quote.user.profile?.userId ? "Extender Contrato" : "Solicitar Cambio"}
                         </Button>
                       </div>

                       <div className="flex items-center gap-3 w-full md:w-auto">
                         {quote.paymentLink && (
                           <a href={quote.paymentLink} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                             <Button className="w-full md:w-auto h-14 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg shadow-green-500/20 rounded-xl transition-all hover:scale-105">
                                <DollarSign className="w-5 h-5 mr-2" /> Realizar Pago
                             </Button>
                           </a>
                         )}

                         <div className="relative w-full md:w-auto">
                           <input type="file" id="capture-upload" accept="image/*" className="hidden" onChange={handleCaptureUpload} disabled={isUploadingCapture} />
                           <label htmlFor="capture-upload" className="block w-full">
                             <Button asChild variant="outline" className="w-full h-14 px-8 border-primary text-primary hover:bg-primary hover:text-white font-bold text-lg rounded-xl transition-all cursor-pointer">
                               <div>
                                 {isUploadingCapture ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ImageIcon className="w-5 h-5 mr-2" />}
                                 Enviar Capture
                               </div>
                             </Button>
                           </label>
                         </div>
                       </div>
                    </div>

                    {/* Payment Captures & Modification Threads */}
                    {quote.messages && quote.messages.length > 0 && (
                      <div className="mt-12 space-y-6">
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-primary" /> Hilo de Registro Inmutable
                        </h3>
                        {quote.messages.map((msg: any) => (
                          <div key={msg.id} className="p-5 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-3">
                               <Badge variant={msg.type === "PAYMENT_CAPTURE" ? "secondary" : msg.type.includes("MODIFICATION") ? "outline" : "secondary"}>
                                 {msg.type === "PAYMENT_CAPTURE" ? "Comprobante de Pago" : msg.type === "MODIFICATION_REQUEST" ? "Solicitud de Cliente" : msg.type === "MODIFICATION_APPROVED" ? "Solicitud Aprobada" : msg.type}
                               </Badge>
                               <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString("es-EC")}</span>
                            </div>
                            <p className="text-foreground">{msg.text}</p>
                            {msg.imageUrl && (
                              <div className="mt-4 rounded-xl overflow-hidden border border-border max-w-sm cursor-zoom-in hover:brightness-110 transition-all">
                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                   <img src={msg.imageUrl} alt="Captura de Pago" className="w-full h-auto object-cover" />
                                </a>
                              </div>
                            )}
                            {msg.type === "MODIFICATION_REQUEST" && currentUser?.id === quote.user.profile?.userId && (
                               <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 rounded-lg font-bold shadow-md shadow-primary/20" onClick={() => handleApproveModification(msg.id)}>
                                 <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar e Instaurar en Contrato
                               </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/30 py-10 px-6 bg-muted/20 relative">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-5"
          >
            <Link href="/">
              {useWhiteLabel && quote.logoUrl ? (
                <img src={quote.logoUrl} alt="Company Logo" className="h-12 object-contain opacity-70 hover:opacity-100 transition-opacity" />
              ) : (
                <Logo size="md" />
              )}
            </Link>
          </motion.div>
          <div className="flex flex-col items-center justify-center mt-4 gap-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {quote.companyName}. Todos los derechos reservados.
            </p>
            <Link href="/legal" target="_blank" className="text-muted-foreground/40 hover:text-primary transition-colors text-xs font-medium">
              Acuerdos Legales, Privacidad y Cookies
            </Link>
          </div>
          {quote.user.plan === "FREE" && quote.user.role !== "admin" && (
            <p className="text-xs text-muted-foreground/60 mt-2 font-medium">
              Powered by <a href="https://quote.eventosprimeai.com" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Prime Quote</a>
            </p>
          )}
        </div>
      </footer>

      {/* Floating Chat */}
      <ChatWidget token={token} />

      {/* ════════════════════════════════════════════════════════
          CONTRACT MODAL — Ver Contrato → Identificarse → Firmar
          ════════════════════════════════════════════════════════ */}
      {showContractModal && quote && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="min-h-full flex items-start justify-center py-6 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-4xl bg-card border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 overflow-hidden"
            >
              {/* Close button — fixed top-right */}
              <button
                onClick={() => setShowContractModal(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-muted/60 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Formal Header — identical to signed contract */}
              <div className="bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 px-8 py-8 border-b border-border/50 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans font-semibold mb-2">Documento Legal Vinculante</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif tracking-tight">
                  ACUERDO DE SERVICIOS PROFESIONALES
                </h2>
                <p className="text-sm text-muted-foreground font-mono mt-2">
                  Contrato N.&deg; {quote.token.substring(0, 8).toUpperCase()}-{new Date(quote.createdAt).getFullYear()}
                </p>
              </div>

              {/* Contract Body */}
              <div className="px-8 py-8 space-y-8 font-serif text-[0.95rem] text-foreground/85 leading-relaxed">

                {/* Parties Section */}
                <div className="space-y-4 pb-6 border-b border-border/40">
                  <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-foreground">Entre las Partes</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold mb-1">Prestador de Servicios</p>
                      <p className="font-bold text-foreground text-lg font-sans">{quote.user.profile?.companyName || quote.user.name}</p>
                      {quote.user.profile?.taxId && <p className="text-sm text-muted-foreground font-sans mt-0.5">RUC/NIT: {quote.user.profile.taxId}</p>}
                    </div>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold mb-1">Contratante</p>
                      <p className="font-bold text-foreground text-lg font-sans">{quote.companyName}</p>
                      {quote.contactName && <p className="text-sm text-muted-foreground font-sans mt-0.5">Representado por: {quote.contactName}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">
                    Celebrado en la fecha <span className="font-semibold text-foreground">{formatDate(quote.createdAt)}</span>, respecto al proyecto denominado <span className="font-semibold text-foreground">&ldquo;{quote.projectName || "Servicios Profesionales"}&rdquo;</span>.
                  </p>
                </div>

                {/* Contract Body — Sections */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-foreground">Cuerpo del Contrato</h3>
                  <p className="text-sm font-sans text-muted-foreground">
                    El presente contrato de prestación de servicios es celebrado por una parte entre &quot;{quote.user.profile?.companyName || quote.user.name}&quot; (en adelante &quot;El Profesional&quot;) y por la otra parte &quot;{quote.companyName}&quot; (en adelante &quot;El Cliente&quot;). Ambas partes acuerdan la ejecución de las siguientes acciones y servicios de acuerdo a la propuesta técnico-comercial detallada a continuación:
                  </p>

                  {/* Template sections */}
                  {[...quote.sections].filter(s => s.isVisible).map((s, idx) => {
                    let parsed: any = {};
                    try { parsed = JSON.parse(s.content); } catch {}
                    const desc = parsed.text || parsed.description || parsed.intro || "Detalle especificado en propuesta técnica.";
                    return (
                      <div key={s.id} className="flex gap-3">
                        <span className="text-xs font-mono text-muted-foreground/60 mt-1 shrink-0 w-6 text-right">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="font-bold font-sans text-foreground">{s.title.toUpperCase()}</p>
                          <p className="whitespace-pre-wrap">{desc}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom sections (non-clause) */}
                  {quote.customSections.filter(cs => {
                    try { return JSON.parse(cs.content || '{}').type !== 'contract_clause'; } catch { return true; }
                  }).map((cs, idx) => {
                    let parsed: any = {};
                    try { parsed = JSON.parse(cs.content || '{}'); } catch {}
                    const desc = parsed.text || parsed.description || parsed.intro || "Condición personalizada adjunta.";
                    const offset = quote.sections.filter(s => s.isVisible).length;
                    return (
                      <div key={cs.id} className="flex gap-3">
                        <span className="text-xs font-mono text-muted-foreground/60 mt-1 shrink-0 w-6 text-right">{offset + idx + 1}.</span>
                        <div className="flex-1">
                          <p className="font-bold font-sans text-foreground">{cs.title.toUpperCase()}</p>
                          <p className="whitespace-pre-wrap">{desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Special contract clauses (roman numerals) */}
                {(() => {
                  const contractClauses = quote.customSections.filter(cs => {
                    try { return JSON.parse(cs.content || '{}').type === 'contract_clause'; } catch { return false; }
                  });
                  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
                  if (contractClauses.length === 0) return null;
                  return (
                    <div className="space-y-4 pt-6 border-t border-border/40">
                      <h3 className="text-lg font-bold font-sans uppercase tracking-wider text-foreground">Cl&aacute;usulas Adicionales</h3>
                      <div className="space-y-5">
                        {contractClauses.map((clause, idx) => {
                          let parsed: any = {};
                          try { parsed = JSON.parse(clause.content || '{}'); } catch {}
                          return (
                            <div key={clause.id} className="pl-4 border-l-2 border-amber-500/40 space-y-1">
                              <p className="font-bold font-sans text-foreground flex items-center gap-2">
                                <span className="text-amber-500 font-serif">{romanNumerals[idx] || `${idx + 1}`}.</span>
                                {clause.title}
                              </p>
                              {parsed.description && (
                                <p className="whitespace-pre-wrap text-foreground/80 pl-6">{parsed.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* General Clauses */}
                <div className="space-y-2 pt-6 border-t border-border/40">
                  <p className="whitespace-pre-wrap">CLÁUSULAS ESPECIALES:{'\n'}Ambos comparecientes declaran su absoluta conformidad con lo estipulado en este documento extendido. Toda solicitud de modificación o extensión sobre los servicios descritos deberá ser solicitada electrónicamente en la presente plataforma.</p>
                  <p className="whitespace-pre-wrap">Al presionar el botón de firma, el Cliente autoriza el inicio inmediato de las actividades, y aprueba digitalmente este acuerdo formalizando la cotización en un compromiso vinculante de servicios profesionales.</p>
                </div>

                {/* Price */}
                {quote.projectPrice && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold mb-2">Valor Total Acordado</p>
                    <p className="text-4xl font-bold text-gradient font-sans">{formatCurrency(quote.projectPrice)}</p>
                  </div>
                )}

                {/* Legal Footer */}
                <div className="pt-6 border-t border-border/40">
                  <p className="text-xs text-muted-foreground font-sans text-center leading-relaxed italic">
                    Este documento constituye un acuerdo legal vinculante entre las partes firmantes.
                    Cualquier modificaci&oacute;n posterior deber&aacute; realizarse mediante adenda formal con consentimiento mutuo.
                    La firma digital tiene la misma validez legal que una firma manuscrita conforme a la legislaci&oacute;n vigente sobre comercio electr&oacute;nico.
                  </p>
                </div>

                {/* ── SIGN BLOCK ── */}
                <div ref={contractBottomRef} className="pt-8 border-t-2 border-dashed border-primary/30 space-y-5">
                  {clientSigner ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-green-400 font-sans">Identidad verificada con Google</p>
                          <p className="text-xs text-muted-foreground font-sans">{clientSigner.name} &mdash; {clientSigner.email}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-sans text-center">
                        Al presionar el botón confirmas haber leído y aceptado íntegramente este contrato.{' '}
                        <strong className="text-foreground">Esta acción es irreversible.</strong>
                      </p>
                      <Button
                        disabled={isApproving}
                        onClick={handleApprove}
                        className="btn-neon w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                      >
                        {isApproving
                          ? <Loader2 className="w-5 h-5 animate-spin mr-3" />
                          : <PenLine className="w-5 h-5 mr-3" />
                        }
                        Aprobar y Firmar Digitalmente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-3 text-center">
                        <h4 className="font-bold text-lg font-sans">Verificación de Identidad Requerida</h4>
                        <p className="text-sm text-muted-foreground font-sans max-w-lg mx-auto">
                          Para formalizar este acuerdo, necesitamos verificar tu identidad. Este proceso garantiza la validez legal del contrato para ambas partes.
                        </p>
                      </div>

                      {/* What gets recorded — serious tone */}
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                        <p className="text-xs uppercase tracking-wider font-sans font-semibold text-amber-400 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Registro Criptográfico de Firma
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2 text-xs font-sans text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Correo electrónico verificado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Dirección IP del firmante</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Monitor className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Dispositivo y navegador utilizado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Fecha, hora exacta y zona horaria</span>
                          </div>
                        </div>
                        <p className="text-xs text-amber-200/60 font-sans">
                          Estos datos se almacenan de forma inmutable y constituyen evidencia legal de la firma digital conforme a la normativa de comercio electrónico vigente.
                        </p>
                      </div>

                      {/* Google button — dark background, high contrast */}
                      <div className="text-center">
                        <a
                          href={`/api/auth/google?mode=client_sign&quoteToken=${token}`}
                          className="inline-flex items-center justify-center gap-3 w-full sm:w-auto h-14 px-10 rounded-xl bg-gray-900 text-white font-bold text-base shadow-xl border border-gray-700 hover:bg-gray-800 hover:shadow-2xl transition-all"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Verificar mi Identidad con Google
                        </a>
                        <p className="text-xs text-muted-foreground/50 font-sans mt-3">
                          No se creará ninguna cuenta. Solo se verifica tu correo para vincularlo al contrato.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

