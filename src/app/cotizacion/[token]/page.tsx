"use client";

import { useState, useEffect, use } from "react";
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
  FileText,
  ArrowRight,
  CreditCard,
  PenLine,
  ImageIcon,
  Download,
  MessageCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/ui/logo";
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
  currency: string;
  status: string;
  logoUrl: string | null;
  createdAt: string;
  template: {
    name: string;
  };
  user: {
    name: string;
    profile: BusinessProfile | null;
  };
  sections: QuoteSection[];
  customSections: CustomSection[];
}

export default function CotizacionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${token}`);
      if (!response.ok) {
        setError("Cotización no encontrada");
        return;
      }
      const data = await response.json();
      setQuote(data);
    } catch (err) {
      setError("Error al cargar la cotización");
    } finally {
      setIsLoading(false);
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Enlace copiado al portapapeles");
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return FileText;
    const Icon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
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
              const PageIcon = page.icon ? (Icons as Record<string, React.ComponentType<{ className?: string }>>)[page.icon] || FileText : FileText;
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="fixed bottom-20 right-10 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none"
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/">
              <Logo size="md" />
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
            {/* Client Logo */}
            {quote.logoUrl && (
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

            {quote.projectPrice && (
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
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <Accordion type="single" collapsible defaultValue={visibleSections[0]?.templateSection?.key} className="space-y-5">
            {visibleSections.map((section, index) => {
              const Icon = getIcon(section.templateSection.icon);
              const sectionKey = section.templateSection?.key || `section-${index}`;
              
              return (
                <motion.div
                  key={sectionKey}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.08 }}
                >
                  <AccordionItem 
                    value={sectionKey}
                    className="border border-border/30 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden data-[state=open]:bg-card/80 data-[state=open]:border-primary/30 data-[state=open]:shadow-lg data-[state=open]:shadow-primary/5 transition-all"
                  >
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

            {/* Custom Sections */}
            {quote.customSections.map((cs, index) => (
              <motion.div
                key={`custom-${cs.id}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: (visibleSections.length + index) * 0.08 }}
              >
                <AccordionItem
                  value={`custom-${cs.id}`}
                  className="border border-border/30 rounded-2xl bg-card/50 backdrop-blur-sm overflow-hidden data-[state=open]:bg-card/80 data-[state=open]:border-accent/30 data-[state=open]:shadow-lg data-[state=open]:shadow-accent/5 transition-all"
                >
                  <AccordionTrigger className="px-7 py-6 hover:no-underline hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center group-hover:from-accent/20 group-hover:to-primary/20 transition-colors group-hover:scale-110 duration-300">
                        <PenLine className="w-6 h-6 text-accent" />
                      </div>
                      <span className="text-xl font-semibold text-left">{cs.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-7 pb-7">
                    <Separator className="mb-7 bg-border/50" />
                    <div className="space-y-5">
                      {(() => {
                        let parsed: any = null;
                        try {
                          parsed = JSON.parse(cs.content || "{}");
                        } catch {
                          return <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{cs.content}</p>;
                        }

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
                                  <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="w-full md:w-1/2 rounded-xl overflow-hidden border border-border/30 shadow-xl shadow-primary/5">
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

                            {parsed.type === "image_full_width" && cs.imageUrl && (
                              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="w-full rounded-2xl overflow-hidden border border-border/30 shadow-2xl shadow-primary/10 relative group">
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src={cs.imageUrl} alt={cs.title} className="w-full h-auto object-cover max-h-[600px]" />
                              </motion.div>
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
            ))}
          </Accordion>
        </div>
      </section>

      {/* Dynamic Payment Info */}
      {(paymentMethods.length > 0 || profile?.conditions) && (
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden">
                <div className="absolute inset-0 gradient-border-animated rounded-2xl pointer-events-none" />
                
                <CardContent className="p-10 relative">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                  
                  <div className="text-center mb-10 relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", delay: 0.3 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 glow-primary"
                    >
                      <CreditCard className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-3">¿Listo para comenzar?</h3>
                    <p className="text-muted-foreground text-lg">
                      {profile?.conditions || "Para iniciar el proyecto, realiza el pago del valor acordado"}
                    </p>
                  </div>

                  {quote.projectPrice && (
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="p-7 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 text-center relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-sm text-muted-foreground mb-3 relative">Primer pago (50%)</p>
                        <p className="text-4xl font-bold text-gradient mb-3 relative">
                          {formatCurrency(quote.projectPrice * 0.5)}
                        </p>
                        <p className="text-sm text-muted-foreground relative">Para iniciar el desarrollo</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="p-7 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 text-center relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-sm text-muted-foreground mb-3 relative">Pago final (50%)</p>
                        <p className="text-4xl font-bold text-gradient mb-3 relative">
                          {formatCurrency(quote.projectPrice * 0.5)}
                        </p>
                        <p className="text-sm text-muted-foreground relative">Al momento de la entrega</p>
                      </motion.div>
                    </div>
                  )}

                  {/* Dynamic Payment Methods */}
                  {paymentMethods.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6 relative">
                      {paymentMethods.map((pm, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="p-6 rounded-xl bg-muted/30 border border-border/30"
                        >
                          <p className="font-semibold mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-primary text-sm font-bold">
                                {String.fromCharCode(65 + i)}
                              </span>
                            </span>
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
              <Logo size="md" />
            </Link>
          </motion.div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
