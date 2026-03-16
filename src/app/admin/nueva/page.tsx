"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, ArrowLeft, ArrowRight, Building2, User, Mail, Phone,
  FileText, DollarSign, Save, Loader2, Check, Settings2, Plus,
  Trash2, ImageIcon, Upload, X, LayoutTemplate, MessageCircle, Image as ImageIcon2,
  Link as LinkIcon, CreditCard, AlignLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import * as Icons from "lucide-react";

interface Template {
  id: string;
  name: string;
  sections: any[];
}

export type BlockType = 
  | "title_desc_img_right"
  | "title_desc_img_left"
  | "title_desc_button"
  | "image_full_width"
  | "standard"
  | "contact";

interface CustomBlock {
  id: string;
  type: BlockType;
  title: string;
  description: string;
  buttonUrl?: string;
  phoneNumber?: string;
  messageText?: string;
  imageFile?: File | null;
  imageUrl?: string;
}

const BLOCK_TYPES = [
  { id: "title_desc_img_right", label: "Texto + Imagen (Derecha)", icon: LayoutTemplate },
  { id: "title_desc_img_left", label: "Imagen + Texto (Izquierda)", icon: LayoutTemplate },
  { id: "title_desc_button", label: "Texto + Botón Enlace", icon: LinkIcon },
  { id: "image_full_width", label: "Imagen a lo ancho", icon: ImageIcon2 },
  { id: "standard", label: "Estándar (Solo texto)", icon: AlignLeft },
  { id: "contact", label: "Contacto (WhatsApp)", icon: MessageCircle },
];

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form data
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectName, setProjectName] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [quoteType, setQuoteType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [projectPrice, setProjectPrice] = useState("");
  const [percentageValue, setPercentageValue] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  
  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Legacy Sections for Admin
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<{key: string; title: string; icon: string; content: string; isVisible: boolean}[]>([]);

  // New Custom Blocks
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [showAddBlock, setShowAddBlock] = useState(false);
  
  // Draft block state
  const [draftBlockType, setDraftBlockType] = useState<BlockType>("standard");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftMsg, setDraftMsg] = useState("");
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const blockImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user is admin
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user?.role === "admin") {
          setIsAdmin(true);
          fetchTemplates();
        }
      });
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
        setSections(data[0].sections
          .filter((s: any) => s.key !== 'payment')
          .map((s: any) => ({
            key: s.key, title: s.title, icon: s.icon || "FileText", content: s.content, isVisible: false
        })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.FileText;
    return Icon;
  };

  const toggleSection = (key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, isVisible: !s.isVisible } : s));
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("El archivo excede 5MB");
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return logoUrl;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", logoFile);
      formData.append("type", "logo");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error subiendo logo");
      const data = await res.json();
      return data.url;
    } catch {
      toast.error("Error al subir logo");
      return "";
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBlockImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("El archivo excede 5MB");
    setDraftImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setDraftImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addBlock = () => {
    if ((draftBlockType !== "image_full_width" && draftBlockType !== "contact") && !draftTitle.trim()) {
      return toast.error("El título es requerido");
    }

    setCustomBlocks(prev => [
      ...prev,
      {
        id: `block-${Date.now()}`,
        type: draftBlockType,
        title: draftTitle,
        description: draftDesc,
        buttonUrl: draftUrl,
        phoneNumber: draftPhone,
        messageText: draftMsg,
        imageFile: draftImageFile,
        imageUrl: draftImagePreview,
      }
    ]);

    resetDraft();
    setShowAddBlock(false);
    toast.success("Sección agregada");
  };

  const resetDraft = () => {
    setDraftTitle("");
    setDraftDesc("");
    setDraftUrl("");
    setDraftPhone("");
    setDraftMsg("");
    setDraftImageFile(null);
    setDraftImagePreview("");
  };

  const removeBlock = (id: string) => {
    setCustomBlocks(prev => prev.filter(b => b.id !== id));
  };

  const uploadBlockImages = async (): Promise<{ title: string; content: string; imageUrl?: string }[]> => {
    const results: { title: string; content: string; imageUrl?: string }[] = [];
    
    for (const block of customBlocks) {
      let upUrl = "";
      if (block.imageFile) {
        const formData = new FormData();
        formData.append("file", block.imageFile);
        formData.append("type", "reference");
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            upUrl = data.url;
          }
        } catch (err) {
          console.error(err);
        }
      }

      const contentObj = {
        type: block.type,
        description: block.description,
        buttonUrl: block.buttonUrl,
        phoneNumber: block.phoneNumber,
        messageText: block.messageText
      };

      results.push({
        title: block.title || block.type,
        content: JSON.stringify(contentObj),
        imageUrl: upUrl || undefined,
      });
    }
    return results;
  };

  const handleCreate = async () => {
    if (!companyName.trim()) {
      return toast.error("El nombre de la empresa es requerido");
    }

    setIsLoading(true);
    try {
      const finalLogoUrl = logoFile ? await uploadLogo() : logoUrl;
      const processedBlocks = await uploadBlockImages();

      // Only include legacy sections if admin and they exist
      const reqSections = isAdmin ? sections.filter(s => s.isVisible).map(s => ({ key: s.key, content: s.content, isVisible: true })) : [];

      const payload = {
        templateId: selectedTemplate?.id || "default", // will be ignored or matched in API
        companyName,
        contactName,
        email,
        phone,
        projectName,
        internalNotes,
        quoteType,
        percentageValue: percentageValue ? parseFloat(percentageValue) : null,
        projectPrice: projectPrice ? parseFloat(projectPrice) : null,
        paymentLink: paymentLink.trim() || null,
        currency: "USD",
        logoUrl: finalLogoUrl || null,
        sections: reqSections,
        customSections: processedBlocks,
      };

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Error al crear cotización");

      const quote = await response.json();
      toast.success("Cotización creada exitosamente");
      router.push(`/cotizacion/${quote.token}`);
    } catch (error) {
      toast.error("Error al crear la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  const renderDraftForm = () => {
    switch (draftBlockType) {
      case "contact":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Teléfono de WhatsApp (Ej: +593987654321)</Label>
              <Input placeholder="+593..." value={draftPhone} onChange={e => setDraftPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mensaje Predefinido</Label>
              <Textarea placeholder="Hola, quiero información sobre..." value={draftMsg} onChange={e => setDraftMsg(e.target.value)} />
            </div>
          </div>
        );
      case "image_full_width":
        return (
          <div className="space-y-2">
            <Label>Imagen a pantalla completa</Label>
            <input ref={blockImageRef} type="file" accept="image/*" onChange={handleBlockImageSelect} className="hidden" />
            {draftImagePreview ? (
              <div className="relative h-40 rounded-lg overflow-hidden border border-border">
                <img src={draftImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => { setDraftImageFile(null); setDraftImagePreview(""); }} className="absolute m-2 top-0 right-0 p-1 rounded-full bg-red-500 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => blockImageRef.current?.click()} className="w-full h-24 border-dashed">
                <ImageIcon className="w-6 h-6 mr-2" /> Subir Imagen
              </Button>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título de la Sección</Label>
              <Input placeholder="Ej: Diseño de Interfaz" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Detalle de los servicios..." rows={3} value={draftDesc} onChange={e => setDraftDesc(e.target.value)} />
            </div>
            
            {draftBlockType === "title_desc_button" && (
              <div className="space-y-2">
                <Label>URL del Botón</Label>
                <Input placeholder="https://..." value={draftUrl} onChange={e => setDraftUrl(e.target.value)} />
              </div>
            )}

            {(draftBlockType === "title_desc_img_right" || draftBlockType === "title_desc_img_left") && (
              <div className="space-y-2">
                <Label>Imagen Adjunta</Label>
                <input ref={blockImageRef} type="file" accept="image/*" onChange={handleBlockImageSelect} className="hidden" />
                {draftImagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                    <img src={draftImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => { setDraftImageFile(null); setDraftImagePreview(""); }} className="absolute m-1 top-0 right-0 p-1 rounded-full bg-red-500 text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => blockImageRef.current?.click()} className="w-full">
                    <ImageIcon className="w-4 h-4 mr-2" /> Elegir Imagen
                  </Button>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-semibold">Nueva Cotización</span>
                <p className="text-xs text-muted-foreground">Paso {step} de 4</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }, (_, i) => i + 1).map((s) => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Información del Cliente</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Nombre de la empresa *</Label><Input placeholder="Empresa S.A." value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Persona de contacto</Label><Input placeholder="Juan Pérez" value={contactName} onChange={e => setContactName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Correo electrónico</Label><Input type="email" placeholder="correo@empresa.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Teléfono</Label><Input placeholder="+593 99 999 9999" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Nombre del proyecto</Label><Input placeholder="Desarrollo Web Corporativo" value={projectName} onChange={e => setProjectName(e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Tipo de Cobro</Label>
                      <Select value={quoteType} onValueChange={(val: "FIXED" | "PERCENTAGE") => setQuoteType(val)}>
                        <SelectTrigger><SelectValue placeholder="Seleccione el tipo de cobro" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIXED">Cobro Fijo</SelectItem>
                          <SelectItem value="PERCENTAGE">Porcentaje de Participación (Socios)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {quoteType === "FIXED" ? (
                      <div className="space-y-2"><Label>Precio del proyecto (USD)</Label><Input type="number" placeholder="600.00" value={projectPrice} onChange={e => setProjectPrice(e.target.value)} /></div>
                    ) : (
                      <div className="space-y-2"><Label>Porcentaje de Participación (%)</Label><Input type="number" placeholder="25" value={percentageValue} onChange={e => setPercentageValue(e.target.value)} /></div>
                    )}
                    <div className="space-y-2"><Label>Enlace de Pago WooCommerce (Opcional)</Label><Input placeholder="https://eventosprimeai.com/..." value={paymentLink} onChange={e => setPaymentLink(e.target.value)} type="url" /></div>
                    <div className="space-y-2"><Label>Notas internas</Label><Textarea placeholder="Notas privadas..." value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} /></div>
                  </div>
                  <div className="flex justify-end pt-4"><Button onClick={() => setStep(2)} disabled={!companyName.trim()}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button></div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" /> Constructor de Cotización</CardTitle>
                  <p className="text-sm text-muted-foreground">Construye tu propuesta agregando bloques de contenido.</p>
                </CardHeader>
                <CardContent>
                  
                  {isAdmin && sections.length > 0 && (
                    <div className="mb-8">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="admin-templates" className="border rounded-lg bg-card overflow-hidden">
                          <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 font-semibold text-muted-foreground group">
                              <FileText className="w-4 h-4 text-primary" /> 
                              <span className="group-hover:text-foreground transition-colors">Plantillas Predeterminadas (Para testear apariencia)</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4 px-4 bg-muted/10">
                            <div className="space-y-2 mt-2">
                              {sections.map(section => {
                                const Icon = getIcon(section.icon);
                                return (
                                  <div key={section.key} className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${section.isVisible ? "border-primary/50 bg-primary/5" : "border-border/50 bg-background hover:border-primary/30"}`} onClick={() => toggleSection(section.key)}>
                                    <Icon className={`w-5 h-5 ${section.isVisible ? "text-primary" : "text-muted-foreground"}`} /> 
                                    <span className="flex-1">{section.title}</span> 
                                    <Checkbox checked={section.isVisible} onCheckedChange={() => toggleSection(section.key)} />
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}

                  <div className="space-y-4">
                    {customBlocks.map((block, i) => (
                      <div key={block.id} className="p-4 rounded-xl border bg-card relative group flex gap-4 pr-12">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          {BLOCK_TYPES.find(t => t.id === block.type)?.icon && React.createElement(BLOCK_TYPES.find(t => t.id === block.type)!.icon, { className: "w-5 h-5 text-accent" })}
                        </div>
                        <div>
                          <h4 className="font-bold text-accent">{block.title || BLOCK_TYPES.find(t => t.id === block.type)?.label}</h4>
                          {block.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{block.description}</p>}
                          {block.type === 'contact' && <p className="text-sm text-muted-foreground mt-1">Tel: {block.phoneNumber}</p>}
                        </div>
                        <Button variant="ghost" className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" size="icon" onClick={() => removeBlock(block.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {showAddBlock && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                        <Card className="border-accent/30 bg-accent/5">
                          <CardContent className="pt-5 space-y-4">
                            <div className="space-y-2">
                              <Label>Selecciona un tipo de bloque</Label>
                              <Select value={draftBlockType} onValueChange={(val) => { setDraftBlockType(val as BlockType); resetDraft(); }}>
                                <SelectTrigger><SelectValue placeholder="Elige un formato..." /></SelectTrigger>
                                <SelectContent>
                                  {BLOCK_TYPES.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Separator className="bg-accent/20" />
                            
                            {renderDraftForm()}

                            <div className="flex gap-2 pt-4">
                              <Button onClick={addBlock} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="w-4 h-4 mr-2" /> Agregar Item</Button>
                              <Button variant="ghost" onClick={() => setShowAddBlock(false)}>Cancelar</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showAddBlock && (
                    <Button variant="outline" onClick={() => setShowAddBlock(true)} className="w-full mt-4 h-14 border-dashed border-2 hover:border-accent hover:text-accent transition-colors">
                      <Plus className="w-5 h-5 mr-2" /> Agregar Nuevo Item
                    </Button>
                  )}

                  <div className="flex justify-between pt-8">
                    <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 w-4 h-4" /> Atrás</Button>
                    <Button onClick={() => setStep(3)} disabled={!isAdmin && customBlocks.length === 0}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Logo del Cliente</CardTitle></CardHeader>
                <CardContent>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                  <div className="flex flex-col items-center py-8">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="w-48 h-48 rounded-2xl bg-muted/30 border flex items-center justify-center p-6">
                          <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        </div>
                        <button onClick={() => { setLogoFile(null); setLogoPreview(""); setLogoUrl(""); }} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => logoInputRef.current?.click()} className="w-48 h-48 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-3">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Subir logo</span>
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2 w-4 h-4" /> Atrás</Button>
                    <Button onClick={() => setStep(4)}>{logoPreview ? "Continuar" : "Omitir"} <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Resumen</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> {companyName}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {contactName && <p>Contacto: {contactName}</p>}
                      {email && <p>Email: {email}</p>}
                      {quoteType === "FIXED" && projectPrice && <p className="col-span-2 font-bold text-primary text-lg mt-2">${parseFloat(projectPrice).toLocaleString("es-EC")}</p>}
                      {quoteType === "PERCENTAGE" && percentageValue && <p className="col-span-2 font-bold text-primary text-lg mt-2">{percentageValue}% Participación</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Bloques incluidos ({customBlocks.length + (isAdmin ? sections.filter(s => s.isVisible).length : 0)})</h4>
                    <div className="flex flex-wrap gap-2">
                      {isAdmin && sections.filter(s => s.isVisible).map(s => <Badge key={s.key} variant="secondary">{s.title}</Badge>)}
                      {customBlocks.map(cs => <Badge key={cs.id} variant="secondary" className="bg-accent/10 text-accent">{cs.title || BLOCK_TYPES.find(t => t.id === cs.type)?.label}</Badge>)}
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="mr-2 w-4 h-4" /> Atrás</Button>
                    <Button onClick={handleCreate} disabled={isLoading}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="mr-2 w-4 h-4" /> Crear Cotización</>}</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
