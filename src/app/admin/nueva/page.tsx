"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, ArrowLeft, ArrowRight, Building2, User, Mail, Phone,
  FileText, DollarSign, Save, Loader2, Check, Settings2, Plus,
  Trash2, ImageIcon, Upload, X, LayoutTemplate, MessageCircle, Image as ImageIcon2,
  Link as LinkIcon, CreditCard, AlignLeft, Bot, GripVertical, Copy, Focus,
  Pencil, Package, BookmarkPlus, Scale, Eye, ExternalLink
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  
  // Pricing fields
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

const TEMPLATE_LIMITS: Record<string, number> = { FREE: 10, STARTER: 20, PRO: 50, SUITE: 999999 };
const PACKAGE_LIMITS: Record<string, number> = { FREE: 1, STARTER: 5, PRO: 10, SUITE: 25 };

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative z-10 w-full mb-4 group">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors flex items-center justify-center p-2 rounded-md hover:bg-muted"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="pl-10">
        {children}
      </div>
    </div>
  );
}

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPlan, setUserPlan] = useState("FREE");
  
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
  const [customPaymentDetails, setCustomPaymentDetails] = useState("");
  const [pricingMode, setPricingMode] = useState<"global" | "sum_sections">("global");
  
  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Theme Customization (Suite/Admin only)
  const [themeColor, setThemeColor] = useState("default");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [customGlow1, setCustomGlow1] = useState("#2f096b");
  const [customGlow2, setCustomGlow2] = useState("#00ffb3");

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
  
  // New Draft Pricing State
  const [draftHasPrice, setDraftHasPrice] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");
  const [draftHasIva, setDraftHasIva] = useState(false);
  const [draftIvaPercent, setDraftIvaPercent] = useState("15");
  const [draftIncludeInTotal, setDraftIncludeInTotal] = useState(true);
  const [draftSaveAsTemplate, setDraftSaveAsTemplate] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const blockImageRef = useRef<HTMLInputElement>(null);

  // Active Drag
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Saved Templates & Packages (from DB)
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>([]);
  const [templateLimit, setTemplateLimit] = useState(10);
  const [packageLimit, setPackageLimit] = useState(1);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  // Package/Template Modals
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPackagesListModal, setShowPackagesListModal] = useState(false);
  const [newPackageName, setNewPackageName] = useState("");
  const [newPackageDesc, setNewPackageDesc] = useState("");

  // Edit template modal
  const [editingTemplate, setEditingTemplate] = useState<SavedTemplate | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Package preview modal
  const [previewingPackage, setPreviewingPackage] = useState<SavedPackage | null>(null);
  const [selectedPkgSections, setSelectedPkgSections] = useState<Set<string>>(new Set());

  // Calculation properties
  const hasSectionsWithPrice = customBlocks.some(b => b.hasPrice && b.price !== undefined);
  const calculatedTotal = customBlocks.reduce((acc, b) => {
    if (b.hasPrice && b.price !== undefined && b.includeInTotal) {
      const ivaMultiplier = b.hasIva ? 1 + ((b.ivaPercent || 15) / 100) : 1;
      return acc + (b.price * ivaMultiplier);
    }
    return acc;
  }, 0);


  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user?.role === "admin") {
          setIsAdmin(true);
          setTemplateLimit(999999);
          setPackageLimit(999999);
          fetchLegacyTemplates();
        }
        if (data.user?.plan) {
          setUserPlan(data.user.plan);
          if (data.user.role !== "admin") {
            setTemplateLimit(TEMPLATE_LIMITS[data.user.plan] || 10);
            setPackageLimit(PACKAGE_LIMITS[data.user.plan] || 1);
          }
        }
      });
    fetchSavedTemplates();
    fetchSavedPackages();
  }, []);

  const fetchSavedTemplates = async () => {
    try {
      const res = await fetch("/api/section-templates");
      if (!res.ok) return;
      const data = await res.json();
      setSavedTemplates(data.templates || []);
      if (data.limit) setTemplateLimit(data.limit);
    } catch (e) { console.error(e); }
  };

  const fetchSavedPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      if (!res.ok) return;
      const data = await res.json();
      setSavedPackages(data.packages || []);
      if (data.limit) setPackageLimit(data.limit);
    } catch (e) { console.error(e); }
  };

  const handleSaveTemplate = async (blockData: Partial<CustomBlock>) => {
    setIsSavingTemplate(true);
    try {
      const res = await fetch("/api/section-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: blockData.title || "Sin nombre",
          type: blockData.type || "standard",
          title: blockData.title || "",
          description: blockData.description || null,
          imageUrl: blockData.imageUrl || null,
          buttonUrl: blockData.buttonUrl || null,
          phoneNumber: blockData.phoneNumber || null,
          messageText: blockData.messageText || null,
          hasPrice: blockData.hasPrice || false,
          price: blockData.price || null,
          hasIva: blockData.hasIva || false,
          ivaPercent: blockData.ivaPercent || 15,
          includeInTotal: blockData.includeInTotal !== undefined ? blockData.includeInTotal : true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar plantilla");
        return;
      }
      toast.success("Plantilla guardada exitosamente");
      fetchSavedTemplates();
    } catch (e) {
      toast.error("Error de conexión al guardar plantilla");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/section-templates/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Error al eliminar plantilla"); return; }
      toast.success("Plantilla eliminada");
      setSavedTemplates(prev => prev.filter(t => t.id !== id));
    } catch { toast.error("Error de conexión"); }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const res = await fetch(`/api/section-templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, name: editTitle, description: editDesc, price: editPrice ? parseFloat(editPrice) : null }),
      });
      if (!res.ok) { toast.error("Error al actualizar"); return; }
      toast.success("Plantilla actualizada");
      setEditingTemplate(null);
      fetchSavedTemplates();
    } catch { toast.error("Error de conexión"); }
  };

  const insertTemplateAsBlock = (tpl: SavedTemplate) => {
    setCustomBlocks(prev => [...prev, {
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
    }]);
    toast.success(`Sección "${tpl.title}" agregada`);
  };

  const insertPackageBlocks = (pkg: SavedPackage) => {
    const newBlocks: CustomBlock[] = pkg.sections.map((ps, i) => ({
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
    toast.success(`Paquete "${pkg.name}" insertado (${newBlocks.length} secciones)`);
  };

  const handleSavePackage = async () => {
    if (!newPackageName.trim()) { toast.error("El nombre del paquete es requerido"); return; }
    if (customBlocks.length === 0) { toast.error("Agrega al menos una sección antes de guardar"); return; }
    setIsSavingPackage(true);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPackageName,
          description: newPackageDesc || null,
          sections: customBlocks.map(b => ({
            type: b.type,
            title: b.title,
            description: b.description,
            imageUrl: b.imageUrl || null,
            buttonUrl: b.buttonUrl || null,
            phoneNumber: b.phoneNumber || null,
            messageText: b.messageText || null,
            hasPrice: b.hasPrice || false,
            price: b.price || null,
            hasIva: b.hasIva || false,
            ivaPercent: b.ivaPercent || 15,
            includeInTotal: b.includeInTotal !== undefined ? b.includeInTotal : true,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar paquete");
        return;
      }
      toast.success("Paquete guardado exitosamente");
      setShowPackageModal(false);
      setNewPackageName("");
      setNewPackageDesc("");
      fetchSavedPackages();
    } catch {
      toast.error("Error de conexión al guardar paquete");
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Error al eliminar paquete"); return; }
      toast.success("Paquete eliminado");
      setSavedPackages(prev => prev.filter(p => p.id !== id));
    } catch { toast.error("Error de conexión"); }
  };

  const openPackagePreview = (pkg: SavedPackage) => {
    setPreviewingPackage(pkg);
    setSelectedPkgSections(new Set(pkg.sections.map(s => s.id)));
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

  const fetchLegacyTemplates = async () => {
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
    const Icon = ((Icons as unknown) as Record<string, React.ElementType>)[iconName] || Icons.FileText;
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
    if (draftBlockType !== "image_full_width" && !draftTitle.trim()) {
      return toast.error("El título es requerido");
    }
    // Validate template name for visual types
    if (draftSaveAsTemplate && (draftBlockType === "image_full_width" || draftBlockType === "section_heading") && !draftTitle.trim()) {
      return toast.error("Asigna un nombre identificador para guardar esta plantilla");
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

    // Si activó "guardar como plantilla", persistir en DB
    if (draftSaveAsTemplate) {
      handleSaveTemplate(blockData);
    }

    resetDraft();
    setShowAddBlock(false);
  };

  const resetDraft = () => {
    setDraftTitle("");
    setDraftDesc("");
    setDraftUrl("");
    setDraftPhone("");
    setDraftMsg("");
    setDraftImageFile(null);
    setDraftImagePreview("");
    setDraftHasPrice(false);
    setDraftPrice("");
    setDraftHasIva(false);
    setDraftIvaPercent("15");
    setDraftIncludeInTotal(true);
    setDraftSaveAsTemplate(false);
    setEditingBlockId(null);
  };

  const editBlock = (block: CustomBlock) => {
    setEditingBlockId(block.id);
    setDraftBlockType(block.type);
    setDraftTitle(block.title);
    setDraftDesc(block.description);
    setDraftUrl(block.buttonUrl || "");
    setDraftPhone(block.phoneNumber || "");
    setDraftMsg(block.messageText || "");
    setDraftImagePreview(block.imageUrl || "");
    setDraftImageFile(null);
    setDraftHasPrice(block.hasPrice || false);
    setDraftPrice(block.price?.toString() || "");
    setDraftHasIva(block.hasIva || false);
    setDraftIvaPercent(block.ivaPercent?.toString() || "15");
    setDraftIncludeInTotal(block.includeInTotal ?? true);
    setDraftSaveAsTemplate(false);
    
    setShowAddBlock(true);
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
        messageText: block.messageText,
        hasPrice: block.hasPrice,
        price: block.price,
        hasIva: block.hasIva,
        includeInTotal: block.includeInTotal
      };

      results.push({
        title: block.title || block.type,
        content: JSON.stringify(contentObj),
        imageUrl: upUrl || undefined,
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

      // Sólo añade la sección custom de pagos si es tipo CUSTOM
      if (quoteType === "CUSTOM" && customPaymentDetails.trim()) {
        processedBlocks.push({
          title: "Detalles de Liquidación",
          content: JSON.stringify({ type: "text", text: customPaymentDetails })
        });
      }

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
        projectPrice: pricingMode === "sum_sections" ? calculatedTotal : (projectPrice ? parseFloat(projectPrice) : null),
        paymentLink: paymentLink.trim() || null,
        currency: "USD",
        logoUrl: finalLogoUrl || null,
        themeColor: (isAdmin || userPlan === "SUITE") 
          ? JSON.stringify({ preset: themeColor, glow1: themeColor === "custom" ? customGlow1 : undefined, glow2: themeColor === "custom" ? customGlow2 : undefined, whiteLabel }) 
          : "default",
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
      case "contract_clause":
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400 flex items-center gap-2"><Scale className="w-3 h-3" /> Esta cláusula aparecerá al final del contrato cuando el cliente firme.</p>
            </div>
            <div className="space-y-2">
              <Label>Título de la Cláusula</Label>
              <Input placeholder="Ej: Penalización por cancelación tardía" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contenido de la Cláusula</Label>
              <Textarea placeholder="Redacta la cláusula legal que aplicará al acuerdo..." rows={4} value={draftDesc} onChange={e => setDraftDesc(e.target.value)} />
            </div>
          </div>
        );
      case "section_heading":
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400 flex items-center gap-2"><FileText className="w-3 h-3" /> Este titular se mostrará siempre visible como divisor entre grupos de secciones.</p>
            </div>
            <div className="space-y-2">
              <Label>Título del grupo</Label>
              <Input placeholder="Ej: Servicios Opcionales" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción profesional</Label>
              <Textarea placeholder="Breve descripción para este grupo de secciones..." rows={3} value={draftDesc} onChange={e => setDraftDesc(e.target.value)} />
            </div>
          </div>
        );
      case "image_full_width":
        return (
          <div className="space-y-4">
            {draftSaveAsTemplate && (
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Nombre identificador de la plantilla *</Label>
                <Input placeholder="Ej: Portada Bodas, Separador Sección Premium..." value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
                <p className="text-xs text-muted-foreground">Este nombre te ayudará a reconocer esta plantilla en tu lista.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Imagen de portada</Label>
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
                <div className="p-3 rounded-lg bg-muted/50 border border-border/40 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground/80">📐 Medida recomendada: <span className="text-primary">720 × 720 px</span> — JPG o WebP (imagen liviana)</p>
                  <p className="text-xs text-muted-foreground">¿Quieres que quede perfecta? Usa esta plantilla de Canva, sube tu foto, ajústala y descárgala en JPG:</p>
                  <a href="https://canva.link/sg0zrf55bcxa5ei" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                    <ExternalLink className="w-3 h-3" /> Abrir plantilla cuadrada en Canva
                  </a>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setDraftHasPrice(!draftHasPrice)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  draftHasPrice 
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,229,255,0.15)]' 
                    : 'border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${draftHasPrice ? 'bg-primary/20' : 'bg-muted'}`}>
                    <DollarSign className={`w-5 h-5 transition-colors ${draftHasPrice ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${draftHasPrice ? 'text-primary' : 'text-foreground'}`}>
                      {draftHasPrice ? '✓ Precio activado' : 'Agregar precio a esta sección'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {draftHasPrice ? 'Configura el monto abajo' : 'Toca para activar la calculadora de precios'}
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full transition-colors relative ${draftHasPrice ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${draftHasPrice ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>
              
              <AnimatePresence>
                {draftHasPrice && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-2 overflow-hidden">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Monto (USD)</Label>
                        <Input type="number" placeholder="Ej: 100.00" value={draftPrice} onChange={e => setDraftPrice(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>¿Incluir I.V.A.?</Label>
                        <Select value={draftHasIva ? "iva" : "no_iva"} onValueChange={v => setDraftHasIva(v === "iva")}>
                          <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_iva">Sin I.V.A.</SelectItem>
                            <SelectItem value="iva">Sumar I.V.A.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {draftHasIva && (
                      <div className="space-y-2">
                        <Label>Porcentaje de I.V.A. (%)</Label>
                        <Input type="number" placeholder="15" value={draftIvaPercent} onChange={e => setDraftIvaPercent(e.target.value)} min={0} max={100} />
                        <p className="text-xs text-muted-foreground">Ej: Ecuador 15%, Colombia 19%, México 16%</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Tipo de cobro</Label>
                      <Select value={draftIncludeInTotal ? "include" : "optional"} onValueChange={v => setDraftIncludeInTotal(v === "include")}>
                        <SelectTrigger><SelectValue placeholder="Comportamiento del precio" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="include">Cobro obligatorio (Sumar al total automáticamente)</SelectItem>
                          <SelectItem value="optional">Precio opcional (El cliente lo elige si desea)</SelectItem>
                        </SelectContent>
                      </Select>
                      {draftIncludeInTotal ? 
                        <p className="text-xs text-muted-foreground mt-1">Este monto se sumará por defecto a la proforma final.</p> :
                        <p className="text-xs text-muted-foreground mt-1 text-primary/80">Este es un adicional. Sirve para horas extra, traslados, u opciones especiales no obligatorias.</p>
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
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
                      <Select value={quoteType} onValueChange={(val: "SINGLE" | "SPLIT" | "CUSTOM" | "PERCENTAGE") => setQuoteType(val)}>
                        <SelectTrigger><SelectValue placeholder="Seleccione el tipo de cobro" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Pago Único</SelectItem>
                          <SelectItem value="SPLIT">Pago en dos partes</SelectItem>
                          <SelectItem value="PERCENTAGE">Porcentaje de Participación (Socios)</SelectItem>
                          <SelectItem value="CUSTOM">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {quoteType === "SINGLE" || quoteType === "SPLIT" ? (
                      <div className="space-y-2"><Label>Precio del proyecto (USD)</Label><Input type="number" placeholder="600.00" value={projectPrice} onChange={e => setProjectPrice(e.target.value)} /></div>
                    ) : quoteType === "PERCENTAGE" ? (
                      <div className="space-y-2"><Label>Porcentaje de Participación (%)</Label><Input type="number" placeholder="25" value={percentageValue} onChange={e => setPercentageValue(e.target.value)} /></div>
                    ) : (
                      <>
                        <div className="space-y-2"><Label>Precio referencial (USD, Opcional)</Label><Input type="number" placeholder="Opcional..." value={projectPrice} onChange={e => setProjectPrice(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Detalles de Pago Personalizado</Label><Textarea placeholder="Ej: 30% inicial, 30% proforma, 40% final..." value={customPaymentDetails} onChange={e => setCustomPaymentDetails(e.target.value)} rows={3} /></div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label>Enlace de pago preferido (Opcional)</Label>
                      <p className="text-[0.8rem] text-muted-foreground leading-tight">Admite links de PayPal, Stripe, Payphone, Mercado Pago, Conekta, dLocal Go, Square y Kushki.</p>
                      <Input placeholder="https://..." value={paymentLink} onChange={e => setPaymentLink(e.target.value)} type="url" />
                    </div>
                    <div className="space-y-2"><Label>Notas internas</Label><Textarea placeholder="Notas privadas..." value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} /></div>

                    {/* Selector de Tema de Color - Sólo Administrador o plan SUITE */}
                    {(isAdmin || userPlan === "SUITE") && (
                      <div className="pt-4 border-t mt-6">
                        <Label className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Ambiente de Marca (Color Personalizado)
                        </Label>
                        <p className="text-xs text-muted-foreground mb-4">
                          Como usuario Suite, puedes personalizar el degradado de fondo para que esta cotización proyecte la personalidad corporativa de tu cliente.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { id: "default", name: "Estilo Original", class: "bg-gradient-to-br from-background to-accent/10" },
                            { id: "custom", name: "Personalizar (Hex)", class: "bg-gradient-to-br from-gray-700 to-gray-500" }
                          ].map(theme => (
                            <div 
                              key={theme.id}
                              onClick={() => setThemeColor(theme.id)}
                              className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${themeColor === theme.id ? "border-primary" : "border-border/50"} ${theme.class}`}
                            >
                              {themeColor === theme.id && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <div className="mt-6 text-sm font-medium text-white drop-shadow-md">
                                {theme.name}
                              </div>
                            </div>
                          ))}
                        </div>

                        {themeColor === "custom" && (
                          <div className="mt-4 p-5 border border-primary/30 rounded-xl bg-card shadow-inner space-y-4 animate-in fade-in zoom-in duration-300">
                            <Label className="text-primary font-bold">Colores de Fondo Radial (HEX)</Label>
                            <p className="text-xs text-muted-foreground">Configura los dos puntos de luz radiales que decoran el fondo en la presentación del cliente. Selecciona colores representativos al manual de marca.</p>
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1 space-y-2">
                                <Label className="text-xs font-semibold">Luz Superior Izquierda</Label>
                                <div className="flex gap-2">
                                  <div className="relative w-10 h-10 rounded-md overflow-hidden border border-border">
                                    <input type="color" value={customGlow1} onChange={e => setCustomGlow1(e.target.value)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" />
                                  </div>
                                  <Input value={customGlow1} onChange={e => setCustomGlow1(e.target.value)} placeholder="#000000" className="flex-1 font-mono uppercase bg-background" />
                                </div>
                              </div>
                              <div className="flex-1 space-y-2">
                                <Label className="text-xs font-semibold">Luz Inferior Derecha</Label>
                                <div className="flex gap-2">
                                  <div className="relative w-10 h-10 rounded-md overflow-hidden border border-border">
                                    <input type="color" value={customGlow2} onChange={e => setCustomGlow2(e.target.value)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" />
                                  </div>
                                  <Input value={customGlow2} onChange={e => setCustomGlow2(e.target.value)} placeholder="#000000" className="flex-1 font-mono uppercase bg-background" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                  <CardTitle className="text-2xl flex items-center gap-2"><LayoutTemplate className="w-6 h-6 text-primary" /> Arma tu propuesta para el cliente</CardTitle>
                  <p className="text-muted-foreground">Añade secciones para explicar lo que incluye tu servicio en pocos segundos.</p>
                </CardHeader>
                <CardContent>

                  {/* Paquetes del Usuario (Reales) */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-bold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Mis Paquetes</Label>
                      <span className="text-xs text-muted-foreground">{savedPackages.length}/{packageLimit === 999999 ? '∞' : packageLimit}</span>
                    </div>
                    {savedPackages.length === 0 ? (
                      <div className="p-4 rounded-lg border border-dashed border-border/50 text-center">
                        <p className="text-sm text-muted-foreground">Aún no tienes paquetes guardados.</p>
                        <p className="text-xs text-muted-foreground mt-1">Crea secciones y guárdalas como paquete para reutilizarlas.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                          {savedPackages.slice(0, 8).map(pkg => (
                            <Card key={pkg.id} className="cursor-pointer hover:border-primary/50 transition-colors bg-muted/10 group relative" onClick={() => openPackagePreview(pkg)}>
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <p className="text-sm font-medium truncate">{pkg.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{pkg.sections.length} secciones</p>
                                {pkg.description && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{pkg.description}</p>}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                  <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openPackagePreview(pkg); }} title="Ver/Insertar">
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeletePackage(pkg.id); }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        {savedPackages.length > 8 && (
                          <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground" onClick={() => setShowPackagesListModal(true)}>Ver todos mis paquetes ({savedPackages.length})...</Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <Separator className="mb-6" />
                  
                  {/* Plantillas del Usuario (Reales) */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-bold flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" /> Mis Plantillas de Secciones</Label>
                      <span className="text-xs text-muted-foreground">{savedTemplates.length}/{templateLimit === 999999 ? '∞' : templateLimit}</span>
                    </div>
                    {savedTemplates.length === 0 ? (
                      <div className="p-4 rounded-lg border border-dashed border-border/50 text-center">
                        <p className="text-sm text-muted-foreground">Aún no tienes plantillas guardadas.</p>
                        <p className="text-xs text-muted-foreground mt-1">Al crear una sección nueva, activa "Guardar como plantilla" para empezar.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                          {savedTemplates.slice(0, 8).map(tpl => (
                            <Card key={tpl.id} className="cursor-pointer hover:border-primary/50 transition-colors bg-muted/10 group relative" onClick={() => insertTemplateAsBlock(tpl)}>
                              <CardContent className="p-3">
                                <p className="text-sm font-medium truncate">{tpl.title}</p>
                                {tpl.hasPrice && tpl.price && (
                                  <p className="text-xs text-primary mt-1">${tpl.price.toFixed(2)}</p>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                  <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); setEditingTemplate(tpl); setEditTitle(tpl.title); setEditDesc(tpl.description || ""); setEditPrice(tpl.price?.toString() || ""); }}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        {savedTemplates.length > 8 && (
                          <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground" onClick={() => setShowTemplatesModal(true)}>Ver todas mis plantillas ({savedTemplates.length})...</Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <Separator className="mb-6" />

                  <div className="mb-4 flex items-center justify-between">
                    <Label className="text-base font-bold flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-primary" /> Secciones en esta cotización</Label>
                    <p className="text-sm text-muted-foreground">Ojo: si insertas, son copias del paquete original.</p>
                  </div>
                  
                  <DndContext collisionDetection={closestCenter} onDragStart={({ active }) => setActiveDragId(active.id as string)} onDragEnd={handleDragEnd}>
                    <SortableContext items={customBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4 w-full">
                        {customBlocks.map((block, i) => (
                          <SortableItem key={block.id} id={block.id}>
                            <div className="p-4 rounded-xl border bg-card relative group flex gap-4 w-full cursor-default hover:border-primary/30 transition-colors shadow-sm">
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                                {BLOCK_TYPES.find(t => t.id === block.type)?.icon && React.createElement(BLOCK_TYPES.find(t => t.id === block.type)!.icon, { className: "w-5 h-5 text-accent" })}
                              </div>
                              <div className="flex-1 pr-24">
                                <h4 className="font-bold text-accent">{block.title || BLOCK_TYPES.find(t => t.id === block.type)?.label}</h4>
                                {block.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{block.description}</p>}
                                {block.type === 'contract_clause' && <p className="text-xs text-amber-400 mt-1 flex items-center gap-1"><Scale className="w-3 h-3" /> Cláusula de contrato</p>}
                                
                                {block.hasPrice && block.price !== undefined && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Badge variant="outline" className={`${block.includeInTotal ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted border-muted-foreground/20 text-muted-foreground'}`}>
                                      ${block.price.toFixed(2)} {block.hasIva ? "+ IVA" : "SIN IVA"}
                                    </Badge>
                                    {!block.includeInTotal && <span className="text-xs text-muted-foreground">(Opcional)</span>}
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-muted" onClick={() => editBlock(block)} title="Editar sección">
                                  <Pencil className="w-4 h-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-muted" title="Guardar como plantilla">
                                  <Save className="w-4 h-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" className="w-8 h-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" size="icon" onClick={() => removeBlock(block.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                    
                    <DragOverlay>
                      {activeDragId ? (
                        <div className="p-4 rounded-xl border border-primary/50 bg-card/80 backdrop-blur-sm shadow-xl flex gap-4 w-full">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Focus className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-bold text-accent">{customBlocks.find(b => b.id === activeDragId)?.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">Moviendo sección...</p>
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>

                  <AnimatePresence>
                    {showAddBlock && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                        <Card className="border-accent/30 bg-accent/5">
                          <CardContent className="pt-5 space-y-4">
                            <div className="space-y-2">
                              <Label>Selecciona un tipo de sección</Label>
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

                            <Separator className="bg-accent/20 my-4" />

                            {/* Toggle para guardar como plantilla */}
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5">
                              <Checkbox checked={draftSaveAsTemplate} onCheckedChange={(checked) => setDraftSaveAsTemplate(checked as boolean)} id="save-tpl" />
                              <label htmlFor="save-tpl" className="flex-1 cursor-pointer">
                                <p className="text-sm font-medium flex items-center gap-2"><BookmarkPlus className="w-4 h-4 text-accent" /> Guardar esta sección como plantilla</p>
                                <p className="text-xs text-muted-foreground">Podrás reutilizarla en futuras cotizaciones con un solo clic.</p>
                              </label>
                            </div>

                            <div className="flex gap-2 pt-4">
                              <Button onClick={addBlock} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSavingTemplate}>
                                {isSavingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (editingBlockId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                                {editingBlockId ? "Guardar Cambios" : "Agregar Sección"}
                              </Button>
                              <Button variant="ghost" onClick={() => { setShowAddBlock(false); resetDraft(); }}>Cancelar</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showAddBlock && (
                    <Button variant="outline" onClick={() => setShowAddBlock(true)} className="w-full mt-4 h-14 border-dashed border-2 hover:border-accent hover:text-accent transition-colors">
                      <Plus className="w-5 h-5 mr-2" /> Crear Sección Nueva
                    </Button>
                  )}

                  {customBlocks.length > 0 && (
                     <div className="mt-8 space-y-4">
                       <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 flex flex-col gap-4">
                          <div>
                             <h4 className="font-bold text-primary text-base">¿Cómo quieres mostrar el precio al cliente?</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div 
                                onClick={() => setPricingMode("global")}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${pricingMode === "global" ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,229,255,0.15)]" : "border-border/50 hover:border-primary/40 bg-card"}`}
                             >
                                <h5 className={`font-semibold text-base mb-1 ${pricingMode === "global" ? "text-primary" : "text-foreground"}`}>Precio como paquete</h5>
                                <p className="text-sm text-muted-foreground">Usa el precio total definido al inicio.</p>
                             </div>
                             <div 
                                onClick={() => setPricingMode("sum_sections")}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${pricingMode === "sum_sections" ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,229,255,0.15)]" : "border-border/50 hover:border-primary/40 bg-card"}`}
                             >
                                <h5 className={`font-semibold text-base mb-1 ${pricingMode === "sum_sections" ? "text-primary" : "text-foreground"}`}>Precio por secciones</h5>
                                <p className="text-sm text-muted-foreground">El total se calcula sumando las secciones obligatorias.</p>
                             </div>
                          </div>
                          {pricingMode === "sum_sections" && (
                             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-background border rounded-xl mt-2 flex items-center justify-between">
                                <span className="font-medium text-muted-foreground mr-4">Total estimado:</span>
                                <span className="font-bold text-primary text-xl">${calculatedTotal.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                             </motion.div>
                          )}
                       </div>

                       <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                          <div>
                             <h4 className="font-bold text-primary">Convierte esto en un Paquete</h4>
                             <p className="text-sm text-muted-foreground mt-1">Guarda estas secciones juntas para reusarlas en el futuro con un solo clic.</p>
                          </div>
                          <Button variant="default" className="shrink-0" onClick={() => setShowPackageModal(true)}><Save className="w-4 h-4 mr-2" /> Guardar como paquete</Button>
                       </div>
                     </div>
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
                  
                  {/* Selector White Label para Logo */}
                  {logoPreview && (isAdmin || userPlan === "SUITE") && (
                    <div className="mt-2 mb-6 p-4 border border-primary/20 rounded-xl bg-card">
                      <Label className="flex items-center gap-2 mb-3 font-bold text-primary">
                        Estilo de Presentación y Posicionamiento de Marca
                      </Label>
                      <div className="flex flex-col gap-3">
                        <div 
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${!whiteLabel ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                          onClick={() => setWhiteLabel(false)}
                        >
                          <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${!whiteLabel ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {!whiteLabel && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Estándar (Compartido)</p>
                            <p className="text-xs text-muted-foreground leading-tight mt-1">El logo del cliente resaltará en la cotización, pero se mantendrán las insignias superiores e inferiores de Prime Quote.</p>
                          </div>
                        </div>
                        <div 
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${whiteLabel ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                          onClick={() => setWhiteLabel(true)}
                        >
                          <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${whiteLabel ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                            {whiteLabel && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Marca Blanca (100% Personalizado)</p>
                            <p className="text-xs text-muted-foreground leading-tight mt-1">Oculta toda referencia visual de Prime Quote. El portal web usará y mostrará únicamente el logo del cliente en los menús.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Verifica si falta algo en tu cotización</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">Revisa todas las secciones incluidas. Si falta algo, presiona "Atrás" para editar o crear la sección que necesites.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> {companyName}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {contactName && <p>Contacto: {contactName}</p>}
                      {email && <p>Email: {email}</p>}
                      {pricingMode === "sum_sections" && hasSectionsWithPrice ? (
                        <p className="col-span-2 font-bold text-primary text-lg mt-2">Calculado (Por Secciones): ${calculatedTotal.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      ) : (
                        (quoteType === "SINGLE" || quoteType === "SPLIT" || quoteType === "CUSTOM") && projectPrice && <p className="col-span-2 font-bold text-primary text-lg mt-2">Total Global: ${parseFloat(projectPrice).toLocaleString("es-EC")}</p>
                      )}
                      
                      {quoteType === "PERCENTAGE" && percentageValue && <p className="col-span-2 font-bold text-primary text-lg mt-2">{percentageValue}% Participación</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Secciones incluidas ({customBlocks.length + (isAdmin ? sections.filter(s => s.isVisible).length : 0)})</h4>
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

      {/* Package Save Modal */}
      <Dialog open={showPackageModal} onOpenChange={setShowPackageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar como Paquete</DialogTitle>
            <DialogDescription>
              Guarda las {customBlocks.length} secciones actuales para reusarlas en futuras cotizaciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del paquete *</Label>
              <Input placeholder="Ej: Boda Diamante" value={newPackageName} onChange={e => setNewPackageName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Textarea placeholder="Incluye fotos, drones, y sesión previa..." value={newPackageDesc} onChange={e => setNewPackageDesc(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Paquetes usados: {savedPackages.length}/{packageLimit === 999999 ? '∞' : packageLimit} de tu plan {userPlan}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPackageModal(false)}>Cancelar</Button>
            <Button onClick={handleSavePackage} disabled={isSavingPackage || !newPackageName.trim()}>
              {isSavingPackage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar paquete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Templates List Modal */}
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Todas mis Plantillas ({savedTemplates.length})</DialogTitle>
            <DialogDescription>
              Haz clic en una plantilla para insertarla como sección en tu cotización.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {savedTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tienes plantillas guardadas aún.</p>
            ) : savedTemplates.map(tpl => (
              <div key={tpl.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => { insertTemplateAsBlock(tpl); setShowTemplatesModal(false); }}>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{tpl.title}</p>
                  {tpl.description && <p className="text-xs text-muted-foreground line-clamp-1">{tpl.description}</p>}
                  {tpl.hasPrice && tpl.price && <p className="text-xs text-primary">${tpl.price.toFixed(2)}{tpl.hasIva ? ` + ${tpl.ivaPercent || 15}% IVA` : ''}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={(e) => { e.stopPropagation(); setEditingTemplate(tpl); setEditTitle(tpl.title); setEditDesc(tpl.description || ""); setEditPrice(tpl.price?.toString() || ""); setShowTemplatesModal(false); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Packages List Modal */}
      <Dialog open={showPackagesListModal} onOpenChange={setShowPackagesListModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Todos mis Paquetes ({savedPackages.length})</DialogTitle>
            <DialogDescription>
              Selecciona un paquete para cargar toda su estructura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {savedPackages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tienes paquetes guardados aún.</p>
            ) : savedPackages.map(pkg => (
              <div key={pkg.id} className="p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group flex justify-between items-center" onClick={() => { insertPackageBlocks(pkg); setShowPackagesListModal(false); }}>
                <div>
                  <h4 className="font-semibold text-sm text-primary">{pkg.name}</h4>
                  <p className="text-xs text-muted-foreground">{pkg.sections.length} secciones{pkg.description ? ` · ${pkg.description}` : ''}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeletePackage(pkg.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => { if (!open) setEditingTemplate(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>Actualiza la información de tu plantilla guardada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Precio (USD)</Label>
              <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="Dejar vacío para sin precio" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingTemplate(null)}>Cancelar</Button>
            <Button onClick={handleUpdateTemplate}><Save className="w-4 h-4 mr-2" /> Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package Preview Modal - Selective Insertion */}
      <Dialog open={!!previewingPackage} onOpenChange={(open) => { if (!open) setPreviewingPackage(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {previewingPackage?.name}
            </DialogTitle>
            <DialogDescription>
              Selecciona las secciones que deseas insertar en tu cotización. Las secciones se agregarán a las ya existentes.
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
                      {ps.template.hasPrice && ps.template.price && (
                        <span className="text-xs text-primary font-medium">${ps.template.price.toFixed(2)}</span>
                      )}
                      {ps.template.type === 'contract_clause' && (
                        <Badge variant="outline" className="text-[0.65rem] h-5 bg-amber-500/10 border-amber-500/30 text-amber-400">Cláusula</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedPkgSections(new Set(previewingPackage?.sections.map(s => s.id) || []))}>
                Seleccionar todo
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedPkgSections(new Set())}>
                Deseleccionar
              </Button>
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
