"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, ArrowLeft, ArrowRight, Building2, User, Mail, Phone,
  FileText, DollarSign, Save, Loader2, Check, Settings2, Plus,
  Trash2, ImageIcon, Upload, X, LayoutTemplate, MessageCircle, Image as ImageIcon2,
  Link as LinkIcon, CreditCard, AlignLeft, Bot, GripVertical, Copy, Focus,
  Pencil, Package, BookmarkPlus, Scale, Eye, Shield, AlertTriangle, ExternalLink, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type BlockType = 
  | "title_desc_img_right"
  | "title_desc_img_left"
  | "title_desc_button"
  | "image_full_width"
  | "standard"
  | "contract_clause"
  | "section_heading";

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
  hasPrice?: boolean;
  price?: number;
  hasIva?: boolean;
  ivaPercent?: number;
  includeInTotal?: boolean;
}

interface SavedTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  buttonUrl?: string | null;
  phoneNumber?: string | null;
  messageText?: string | null;
  hasPrice: boolean;
  price?: number | null;
  hasIva: boolean;
  ivaPercent?: number | null;
  includeInTotal: boolean;
}

interface SavedPackage {
  id: string;
  name: string;
  description?: string | null;
  sections: { id: string; order: number; template: SavedTemplate }[];
}

const BLOCK_TYPES = [
  { id: "standard", label: "Estándar (Solo texto)", icon: AlignLeft },
  { id: "title_desc_img_right", label: "Texto + Imagen (Derecha)", icon: LayoutTemplate },
  { id: "title_desc_img_left", label: "Imagen + Texto (Izquierda)", icon: LayoutTemplate },
  { id: "title_desc_button", label: "Texto + Botón Enlace", icon: LinkIcon },
  { id: "image_full_width", label: "Imagen de portada", icon: ImageIcon2 },
  { id: "section_heading", label: "Titular para nuevo grupo", icon: FileText },
  { id: "contract_clause", label: "Cláusula adicional de contrato", icon: Scale },
];

function SortableItem({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative z-10 w-full mb-4 group">
      <div {...attributes} {...listeners} className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors flex items-center justify-center p-2 rounded-md hover:bg-muted">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="pl-10">{children}</div>
    </div>
  );
}

export default function EditarCotizacionPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectName, setProjectName] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [quoteType, setQuoteType] = useState<"SINGLE" | "SPLIT" | "CUSTOM" | "PERCENTAGE">("SINGLE");
  const [projectPrice, setProjectPrice] = useState("");
  const [percentageValue, setPercentageValue] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [pricingMode, setPricingMode] = useState<"global" | "sum_sections">("global");

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Blocks
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [draftBlockType, setDraftBlockType] = useState<BlockType>("standard");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftMsg, setDraftMsg] = useState("");
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const [draftHasPrice, setDraftHasPrice] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");
  const [draftHasIva, setDraftHasIva] = useState(false);
  const [draftIvaPercent, setDraftIvaPercent] = useState("15");
  const [draftIncludeInTotal, setDraftIncludeInTotal] = useState(true);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const blockImageRef = useRef<HTMLInputElement>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  // Saved Templates & Packages
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPackagesListModal, setShowPackagesListModal] = useState(false);
  const [previewingPackage, setPreviewingPackage] = useState<SavedPackage | null>(null);
  const [selectedPkgSections, setSelectedPkgSections] = useState<Set<string>>(new Set());

  // Pricing calc
  const hasSectionsWithPrice = customBlocks.some(b => b.hasPrice && b.price !== undefined);
  const calculatedTotal = customBlocks.reduce((acc, b) => {
    if (b.hasPrice && b.price !== undefined && b.includeInTotal) {
      const iva = b.hasIva ? 1 + ((b.ivaPercent || 15) / 100) : 1;
      return acc + (b.price * iva);
    }
    return acc;
  }, 0);

  // ─── Load existing quote ───────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetchQuote();
    fetchSavedTemplates();
    fetchSavedPackages();
  }, [token]);

  const fetchSavedTemplates = async () => {
    try {
      const res = await fetch("/api/section-templates");
      if (!res.ok) return;
      const data = await res.json();
      setSavedTemplates(data.templates || []);
    } catch (e) { console.error(e); }
  };

  const fetchSavedPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      if (!res.ok) return;
      const data = await res.json();
      setSavedPackages(data.packages || []);
    } catch (e) { console.error(e); }
  };

  const insertTemplateAsBlock = (tpl: SavedTemplate) => {
    const newBlock: CustomBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: tpl.type as BlockType,
      title: tpl.title,
      description: tpl.description || "",
      buttonUrl: tpl.buttonUrl || undefined,
      phoneNumber: tpl.phoneNumber || undefined,
      messageText: tpl.messageText || undefined,
      imageUrl: tpl.imageUrl || undefined,
      hasPrice: tpl.hasPrice,
      price: tpl.price ?? undefined,
      hasIva: tpl.hasIva,
      ivaPercent: tpl.ivaPercent ?? 15,
      includeInTotal: tpl.includeInTotal,
    };
    setCustomBlocks(prev => [...prev, newBlock]);
    toast.success(`Plantilla "${tpl.title}" agregada`);
  };

  const insertSelectedPackageSections = () => {
    if (!previewingPackage) return;
    const selected = previewingPackage.sections.filter(s => selectedPkgSections.has(s.id));
    const newBlocks: CustomBlock[] = selected.map((ps, i) => ({
      id: `block-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      type: ps.template.type as BlockType,
      title: ps.template.title,
      description: ps.template.description || "",
      buttonUrl: ps.template.buttonUrl || undefined,
      phoneNumber: ps.template.phoneNumber || undefined,
      messageText: ps.template.messageText || undefined,
      imageUrl: ps.template.imageUrl || undefined,
      hasPrice: ps.template.hasPrice,
      price: ps.template.price ?? undefined,
      hasIva: ps.template.hasIva,
      ivaPercent: ps.template.ivaPercent ?? 15,
      includeInTotal: ps.template.includeInTotal,
    }));
    setCustomBlocks(prev => [...prev, ...newBlocks]);
    toast.success(`${selected.length} secciones del paquete "${previewingPackage.name}" agregadas`);
    setPreviewingPackage(null);
  };

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/quotes/${token}`);
      if (!res.ok) {
        toast.error("Cotización no encontrada");
        router.push("/admin/dashboard");
        return;
      }
      const quote = await res.json();

      // Anti-fraud check
      if (quote.status === 'accepted') {
        setIsBlocked(true);
        setIsLoadingQuote(false);
        return;
      }

      // Fill form fields
      setCompanyName(quote.companyName || "");
      setContactName(quote.contactName || "");
      setEmail(quote.email || "");
      setPhone(quote.phone || "");
      setProjectName(quote.projectName || "");
      setInternalNotes(quote.internalNotes || "");
      setQuoteType((quote.quoteType as any) || "SINGLE");
      setProjectPrice(quote.projectPrice?.toString() || "");
      setPercentageValue(quote.percentageValue?.toString() || "");
      setPaymentLink(quote.paymentLink || "");
      setLogoUrl(quote.logoUrl || "");
      if (quote.logoUrl) setLogoPreview(quote.logoUrl);

      // Deserialize customSections → CustomBlock[]
      if (quote.customSections && quote.customSections.length > 0) {
        const blocks: CustomBlock[] = quote.customSections.map((cs: any) => {
          let parsed: any = {};
          try { parsed = JSON.parse(cs.content || "{}"); } catch {}
          return {
            id: cs.id,
            type: (parsed.type as BlockType) || "standard",
            title: cs.title || "",
            description: parsed.description || "",
            buttonUrl: parsed.buttonUrl || undefined,
            phoneNumber: parsed.phoneNumber || undefined,
            messageText: parsed.messageText || undefined,
            imageUrl: cs.imageUrl || undefined,
            hasPrice: parsed.hasPrice || false,
            price: parsed.price ?? undefined,
            hasIva: parsed.hasIva || false,
            ivaPercent: parsed.ivaPercent ?? 15,
            includeInTotal: parsed.includeInTotal !== undefined ? parsed.includeInTotal : true,
          };
        });
        setCustomBlocks(blocks);
        // Detect pricing mode
        const hasBlockPrices = blocks.some(b => b.hasPrice && b.price);
        if (hasBlockPrices && !quote.projectPrice) {
          setPricingMode("sum_sections");
        }
      }
    } catch (err) {
      toast.error("Error al cargar la cotización");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // ─── Block operations ──────────────────────────────────
  const addBlock = () => {
    if (draftBlockType !== "image_full_width" && !draftTitle.trim()) {
      return toast.error("El título es requerido");
    }
    const blockData: CustomBlock = {
      id: editingBlockId || `block-${Date.now()}`,
      type: draftBlockType,
      title: draftTitle,
      description: draftDesc,
      buttonUrl: draftUrl,
      phoneNumber: draftPhone,
      messageText: draftMsg,
      imageFile: draftImageFile,
      imageUrl: draftImagePreview,
      hasPrice: draftHasPrice,
      price: draftPrice ? parseFloat(draftPrice) : undefined,
      hasIva: draftHasIva,
      ivaPercent: draftIvaPercent ? parseFloat(draftIvaPercent) : 15,
      includeInTotal: draftIncludeInTotal,
    };
    if (editingBlockId) {
      setCustomBlocks(prev => prev.map(b => b.id === editingBlockId ? blockData : b));
      toast.success("Sección actualizada");
    } else {
      setCustomBlocks(prev => [...prev, blockData]);
      toast.success("Sección agregada");
    }
    resetDraft();
    setShowAddBlock(false);
  };

  const resetDraft = () => {
    setDraftTitle(""); setDraftDesc(""); setDraftUrl(""); setDraftPhone(""); setDraftMsg("");
    setDraftImageFile(null); setDraftImagePreview(""); setDraftHasPrice(false); setDraftPrice("");
    setDraftHasIva(false); setDraftIvaPercent("15"); setDraftIncludeInTotal(true); setEditingBlockId(null);
  };

  const editBlock = (block: CustomBlock) => {
    setEditingBlockId(block.id); setDraftBlockType(block.type); setDraftTitle(block.title); setDraftDesc(block.description);
    setDraftUrl(block.buttonUrl || ""); setDraftPhone(block.phoneNumber || ""); setDraftMsg(block.messageText || "");
    setDraftImagePreview(block.imageUrl || ""); setDraftImageFile(null);
    setDraftHasPrice(block.hasPrice || false); setDraftPrice(block.price?.toString() || "");
    setDraftHasIva(block.hasIva || false); setDraftIvaPercent(block.ivaPercent?.toString() || "15");
    setDraftIncludeInTotal(block.includeInTotal ?? true); setShowAddBlock(true);
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const removeBlock = (id: string) => setCustomBlocks(prev => prev.filter(b => b.id !== id));

  const handleBlockImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("El archivo excede 5MB");
    setDraftImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setDraftImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.url;
    } catch { toast.error("Error al subir logo"); return ""; }
    finally { setIsUploadingLogo(false); }
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
          if (res.ok) { const data = await res.json(); upUrl = data.url; }
        } catch (err) { console.error(err); }
      }
      const contentObj = {
        type: block.type, description: block.description, buttonUrl: block.buttonUrl,
        phoneNumber: block.phoneNumber, messageText: block.messageText,
        hasPrice: block.hasPrice, price: block.price, hasIva: block.hasIva,
        ivaPercent: block.ivaPercent, includeInTotal: block.includeInTotal
      };
      results.push({
        title: block.title || block.type,
        content: JSON.stringify(contentObj),
        imageUrl: upUrl || block.imageUrl || undefined,
      });
    }
    return results;
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCustomBlocks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveDragId(null);
  };

  // ─── Submit edit ───────────────────────────────────────
  const handleSaveEdits = async () => {
    if (!companyName.trim()) return toast.error("El nombre del cliente es requerido");
    setIsLoading(true);
    try {
      const finalLogoUrl = logoFile ? await uploadLogo() : logoUrl;
      const processedBlocks = await uploadBlockImages();

      const payload = {
        companyName, contactName, email, phone, projectName, internalNotes,
        quoteType,
        percentageValue: percentageValue ? parseFloat(percentageValue) : null,
        projectPrice: pricingMode === "sum_sections" ? calculatedTotal : (projectPrice ? parseFloat(projectPrice) : null),
        paymentLink: paymentLink.trim() || null,
        currency: "USD",
        logoUrl: finalLogoUrl || null,
        customSections: processedBlocks,
      };

      const res = await fetch(`/api/quotes/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      toast.success("Cotización actualizada exitosamente");
      router.push(`/cotizacion/${token}`);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la cotización");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────
  if (isLoadingQuote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="aurora-bg" />
        <div className="text-center relative z-10">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando cotización...</p>
        </div>
      </div>
    );
  }

  // ─── Blocked state (signed) ────────────────────────────
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
        <div className="aurora-bg" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <Card className="card-elevated overflow-hidden border-red-500/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Edición Protegida</h1>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Esta cotización ha sido firmada digitalmente por el cliente. Por políticas antifraude, 
                su contenido es <strong>inmutable</strong>. Puedes solicitar ampliaciones directamente en el enlace activo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button variant="outline" onClick={() => router.push('/admin/dashboard')} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
                </Button>
                <Button onClick={() => router.push(`/cotizacion/${token}`)} className="flex-1 btn-primary">
                  <Eye className="w-4 h-4 mr-2" /> Ver Cotización
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Steps config ──────────────────────────────────────
  const steps = [
    { num: 1, title: "Cliente", icon: Building2 },
    { num: 2, title: "Precio", icon: DollarSign },
    { num: 3, title: "Secciones", icon: FileText },
    { num: 4, title: "Revisar", icon: Check },
  ];

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background relative">
      <div className="aurora-bg" />
      <div className="aurora-orbs"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400">
              <Pencil className="w-3 h-3 mr-1" /> Modo Edición
            </Badge>
          </div>
        </div>
      </header>

      {/* Edit Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-primary/5 to-amber-500/10 border-b border-amber-500/20 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Estás editando la cotización <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">{token}</span>. 
            Los cambios se guardarán en el mismo enlace que ya fue compartido.
          </p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        <div className="flex items-center justify-center gap-1 sm:gap-3">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <button onClick={() => setStep(s.num)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm ${step === s.num ? 'bg-primary text-white font-semibold' : step > s.num ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          {/* Step 1: Client Info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Empresa o Cliente *</Label>
                      <Input placeholder="Nombre de la empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contacto</Label>
                      <Input placeholder="Nombre del contacto" value={contactName} onChange={e => setContactName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="correo@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input placeholder="+593 999 999 999" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre del Proyecto</Label>
                    <Input placeholder="Ej: Boda Johnson & Martinez" value={projectName} onChange={e => setProjectName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas internas (solo tú las ves)</Label>
                    <Textarea placeholder="Notas o comentarios privados..." value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} />
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <Label>Logo de tu empresa</Label>
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                    {logoPreview ? (
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg border border-border bg-muted/50 overflow-hidden flex items-center justify-center">
                          <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>Cambiar</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setLogoFile(null); setLogoPreview(""); setLogoUrl(""); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Subir Logo
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setStep(2)}>Siguiente <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Configuración de Precio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Modo de cotización</Label>
                    <Select value={quoteType} onValueChange={(v) => setQuoteType(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Precio Global</SelectItem>
                        <SelectItem value="PERCENTAGE">Participación (%)</SelectItem>
                        <SelectItem value="CUSTOM">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {quoteType === "PERCENTAGE" ? (
                    <div className="space-y-2">
                      <Label>Porcentaje de Participación</Label>
                      <div className="relative"><Input type="number" placeholder="Ej: 15" value={percentageValue} onChange={e => setPercentageValue(e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div>
                    </div>
                  ) : (
                    <>
                      {hasSectionsWithPrice && (
                        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                          <Label className="text-sm font-semibold">¿Cómo calcular el precio?</Label>
                          <div className="flex gap-3">
                            <button onClick={() => setPricingMode("global")} className={`flex-1 p-3 rounded-lg border text-sm text-center transition-all ${pricingMode === "global" ? "border-primary bg-primary/10 text-primary font-medium" : "border-border"}`}>Precio Global</button>
                            <button onClick={() => setPricingMode("sum_sections")} className={`flex-1 p-3 rounded-lg border text-sm text-center transition-all ${pricingMode === "sum_sections" ? "border-primary bg-primary/10 text-primary font-medium" : "border-border"}`}>Suma de Secciones<br /><span className="text-xs text-muted-foreground">${calculatedTotal.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</span></button>
                          </div>
                        </div>
                      )}
                      {pricingMode === "global" && (
                        <div className="space-y-2">
                          <Label>Precio Total (USD)</Label>
                          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input type="number" className="pl-7" placeholder="0.00" value={projectPrice} onChange={e => setProjectPrice(e.target.value)} /></div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Enlace de pago (opcional)</Label>
                    <Input placeholder="https://paypal.me/..." value={paymentLink} onChange={e => setPaymentLink(e.target.value)} />
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 w-4 h-4" /> Atrás</Button>
                    <Button onClick={() => setStep(3)}>Siguiente <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Sections */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Secciones de la Cotización</CardTitle>
                  <CardDescription>Edita, reorganiza o añade nuevas secciones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing blocks */}
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={(e) => setActiveDragId(e.active.id as string)}>
                    <SortableContext items={customBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      {customBlocks.map((block) => {
                        const blockInfo = BLOCK_TYPES.find(t => t.id === block.type);
                        return (
                          <SortableItem key={block.id} id={block.id}>
                            <div className="border border-border/30 rounded-xl p-4 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[0.65rem] h-5 shrink-0">{blockInfo?.label || block.type}</Badge>
                                    {block.hasPrice && block.price && (
                                      <Badge variant="secondary" className="text-[0.65rem] h-5 bg-primary/10">
                                        ${block.price.toFixed(2)}{block.hasIva ? ` +IVA` : ''}
                                        {!block.includeInTotal && <span className="ml-1 text-amber-400">(Opcional)</span>}
                                      </Badge>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-sm truncate">{block.title || "(Sin título)"}</h4>
                                  {block.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{block.description}</p>}
                                  {block.imageUrl && <div className="w-20 h-14 mt-2 rounded-md overflow-hidden border"><img src={block.imageUrl} alt="" className="w-full h-full object-cover" /></div>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => editBlock(block)}><Pencil className="w-3.5 h-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-red-500" onClick={() => removeBlock(block.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>

                  {customBlocks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay secciones. Agrega una para comenzar.</p>
                    </div>
                  )}

                  {/* Quick Actions: Templates & Packages */}
                  {!showAddBlock && (savedTemplates.length > 0 || savedPackages.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {savedTemplates.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setShowTemplatesModal(true)} className="text-xs">
                          <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Mis Plantillas ({savedTemplates.length})
                        </Button>
                      )}
                      {savedPackages.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setShowPackagesListModal(true)} className="text-xs">
                          <Package className="w-3.5 h-3.5 mr-1.5" /> Mis Paquetes ({savedPackages.length})
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Add block form */}
                  {showAddBlock ? (
                    <motion.div ref={editFormRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-dashed border-primary/30 rounded-xl p-5 space-y-4 bg-primary/5">
                      <div className="space-y-2">
                        <Label>Tipo de sección</Label>
                        <Select value={draftBlockType} onValueChange={(v) => { setDraftBlockType(v as BlockType); resetDraft(); setDraftBlockType(v as BlockType); setShowAddBlock(true); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BLOCK_TYPES.map(bt => <SelectItem key={bt.id} value={bt.id}>{bt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Common title/desc for most types */}
                      {draftBlockType !== "image_full_width" && (
                        <>
                          <div className="space-y-2">
                            <Label>Título *</Label>
                            <Input placeholder="Título de la sección" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea placeholder="Contenido detallado..." rows={4} value={draftDesc} onChange={e => setDraftDesc(e.target.value)} />
                          </div>
                        </>
                      )}

                      {/* Image upload: Cover */}
                      {draftBlockType === "image_full_width" && (
                        <div className="space-y-2">
                          <Label>Imagen de portada</Label>
                          <input ref={blockImageRef} type="file" accept="image/*" onChange={handleBlockImageSelect} className="hidden" />
                          {draftImagePreview ? (
                            <div className="relative h-40 rounded-lg overflow-hidden border">
                              <img src={draftImagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <button onClick={() => { setDraftImageFile(null); setDraftImagePreview(""); }} className="absolute m-2 top-0 right-0 p-1 rounded-full bg-red-500 text-white"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <Button variant="outline" onClick={() => blockImageRef.current?.click()} className="w-full h-24 border-dashed">
                              <ImageIcon className="w-6 h-6 mr-2" /> Subir Imagen de Portada
                            </Button>
                          )}
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/40 space-y-1.5">
                            <p className="text-xs font-semibold text-foreground/80">📐 Medida recomendada: <span className="text-primary">851 × 315 px</span> — JPG o WebP (imagen liviana)</p>
                            <p className="text-xs text-muted-foreground">¿No tienes la imagen lista? Usa esta plantilla de Canva, sube tu foto, ajústala y descárgala en JPG:</p>
                            <a href="https://canva.link/m7afwktr190r5jw" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                              <ExternalLink className="w-3 h-3" /> Abrir plantilla de portada en Canva
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Image upload: Text + Image */}
                      {(draftBlockType === "title_desc_img_right" || draftBlockType === "title_desc_img_left") && (
                        <div className="space-y-2">
                          <Label>Imagen Adjunta</Label>
                          <input ref={blockImageRef} type="file" accept="image/*" onChange={handleBlockImageSelect} className="hidden" />
                          {draftImagePreview ? (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                              <img src={draftImagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <button onClick={() => { setDraftImageFile(null); setDraftImagePreview(""); }} className="absolute m-1 top-0 right-0 p-1 rounded-full bg-red-500 text-white"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <Button variant="outline" onClick={() => blockImageRef.current?.click()} className="w-full">
                              <ImageIcon className="w-4 h-4 mr-2" /> Elegir Imagen
                            </Button>
                          )}
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/40 space-y-1.5">
                            <p className="text-xs font-semibold text-foreground/80">📐 Medida recomendada: <span className="text-primary">720 × 720 px</span> — JPG o WebP (imagen liviana)</p>
                            <p className="text-xs text-muted-foreground">¿Quieres que quede perfecta? Usa esta plantilla de Canva, sube tu foto, ajústala y descárgala en JPG:</p>
                            <a href="https://canva.link/sg0zrf55bcxa5ei" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                              <ExternalLink className="w-3 h-3" /> Abrir plantilla cuadrada en Canva
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Button URL */}
                      {draftBlockType === "title_desc_button" && (
                        <div className="space-y-2">
                          <Label>URL del botón</Label>
                          <Input placeholder="https://..." value={draftUrl} onChange={e => setDraftUrl(e.target.value)} />
                        </div>
                      )}

                      {/* Pricing */}
                      {draftBlockType !== "image_full_width" && draftBlockType !== "section_heading" && draftBlockType !== "contract_clause" && (
                        <div className="border-t pt-4 mt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Checkbox id="draft-price" checked={draftHasPrice} onCheckedChange={(c) => setDraftHasPrice(!!c)} />
                            <Label htmlFor="draft-price" className="text-sm">Asignar precio a esta sección</Label>
                          </div>
                          {draftHasPrice && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Precio (USD)</Label>
                                <Input type="number" placeholder="0.00" value={draftPrice} onChange={e => setDraftPrice(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">IVA</Label>
                                <div className="flex items-center gap-2">
                                  <Checkbox id="draft-iva" checked={draftHasIva} onCheckedChange={(c) => setDraftHasIva(!!c)} />
                                  <Input type="number" placeholder="15" value={draftIvaPercent} onChange={e => setDraftIvaPercent(e.target.value)} className="w-20" disabled={!draftHasIva} />
                                  <span className="text-xs text-muted-foreground">%</span>
                                </div>
                              </div>
                              <div className="col-span-2 flex items-center gap-2">
                                <Checkbox id="draft-total" checked={draftIncludeInTotal} onCheckedChange={(c) => setDraftIncludeInTotal(!!c)} />
                                <Label htmlFor="draft-total" className="text-xs">Incluir en el total (desmarca para servicio opcional)</Label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => { resetDraft(); setShowAddBlock(false); }}>Cancelar</Button>
                        <Button onClick={addBlock}>{editingBlockId ? <><Check className="w-4 h-4 mr-2" /> Actualizar</> : <><Plus className="w-4 h-4 mr-2" /> Agregar</>}</Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddBlock(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Agregar Sección
                    </Button>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2 w-4 h-4" /> Atrás</Button>
                    <Button onClick={() => setStep(4)}>Revisar <ArrowRight className="ml-2 w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Review & Save */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Check className="w-5 h-5 text-primary" /> Revisar Cambios</CardTitle>
                  <CardDescription>Verifica que todo esté correcto antes de guardar los cambios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> {companyName}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {contactName && <p>Contacto: {contactName}</p>}
                      {email && <p>Email: {email}</p>}
                      {pricingMode === "sum_sections" && hasSectionsWithPrice ? (
                        <p className="col-span-2 font-bold text-primary text-lg mt-2">Calculado: ${calculatedTotal.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</p>
                      ) : quoteType !== "PERCENTAGE" && projectPrice ? (
                        <p className="col-span-2 font-bold text-primary text-lg mt-2">Total: ${parseFloat(projectPrice).toLocaleString("es-EC")}</p>
                      ) : null}
                      {quoteType === "PERCENTAGE" && percentageValue && <p className="col-span-2 font-bold text-primary text-lg mt-2">{percentageValue}% Participación</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Secciones ({customBlocks.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {customBlocks.map(cs => (
                        <Badge key={cs.id} variant="secondary" className="bg-accent/10 text-accent">{cs.title || BLOCK_TYPES.find(t => t.id === cs.type)?.label}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Los cambios se aplicarán al mismo enlace que ya fue compartido con tu cliente.
                    </p>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="mr-2 w-4 h-4" /> Atrás</Button>
                    <Button onClick={handleSaveEdits} disabled={isLoading} className="btn-primary">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="mr-2 w-4 h-4" /> Guardar Cambios</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Templates Modal */}
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mis Plantillas ({savedTemplates.length})</DialogTitle>
            <DialogDescription>
              Toca una plantilla para insertarla como nueva sección.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {savedTemplates.map(tpl => (
              <div key={tpl.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { insertTemplateAsBlock(tpl); setShowTemplatesModal(false); }}>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{tpl.title}</p>
                  {tpl.description && <p className="text-xs text-muted-foreground line-clamp-1">{tpl.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[0.65rem] h-5">{BLOCK_TYPES.find(t => t.id === tpl.type)?.label || tpl.type}</Badge>
                    {tpl.hasPrice && tpl.price && <span className="text-xs text-primary">${tpl.price.toFixed(2)}</span>}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Packages List Modal */}
      <Dialog open={showPackagesListModal} onOpenChange={setShowPackagesListModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mis Paquetes ({savedPackages.length})</DialogTitle>
            <DialogDescription>
              Selecciona un paquete para ver sus secciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {savedPackages.map(pkg => (
              <div key={pkg.id} className="p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => { setPreviewingPackage(pkg); setSelectedPkgSections(new Set(pkg.sections.map(s => s.id))); setShowPackagesListModal(false); }}>
                <h4 className="font-semibold text-sm text-primary">{pkg.name}</h4>
                <p className="text-xs text-muted-foreground">{pkg.sections.length} secciones{pkg.description ? ` · ${pkg.description}` : ''}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Package Preview Modal */}
      <Dialog open={!!previewingPackage} onOpenChange={(open) => { if (!open) setPreviewingPackage(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {previewingPackage?.name}
            </DialogTitle>
            <DialogDescription>
              Selecciona las secciones que deseas agregar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[50vh] overflow-y-auto pr-2">
            {previewingPackage?.sections.map((ps, idx) => {
              const isSelected = selectedPkgSections.has(ps.id);
              return (
                <div
                  key={ps.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/30'
                  }`}
                  onClick={() => {
                    setSelectedPkgSections(prev => {
                      const next = new Set(prev);
                      if (next.has(ps.id)) next.delete(ps.id);
                      else next.add(ps.id);
                      return next;
                    });
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      setSelectedPkgSections(prev => {
                        const next = new Set(prev);
                        if (checked) next.add(ps.id);
                        else next.delete(ps.id);
                        return next;
                      });
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{idx + 1}</span>
                      <p className="text-sm font-semibold truncate">{ps.template.title}</p>
                    </div>
                    {ps.template.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ps.template.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[0.65rem] h-5">{BLOCK_TYPES.find(t => t.id === ps.template.type)?.label || ps.template.type}</Badge>
                      {ps.template.hasPrice && ps.template.price && <span className="text-xs text-primary font-medium">${ps.template.price.toFixed(2)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedPkgSections(new Set(previewingPackage?.sections.map(s => s.id) || []))}>Seleccionar todo</Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedPkgSections(new Set())}>Deseleccionar</Button>
            </div>
            <span className="text-xs text-muted-foreground">{selectedPkgSections.size} de {previewingPackage?.sections.length || 0}</span>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewingPackage(null)}>Cancelar</Button>
            <Button onClick={insertSelectedPackageSections} disabled={selectedPkgSections.size === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar {selectedPkgSections.size} sección{selectedPkgSections.size !== 1 ? 'es' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
