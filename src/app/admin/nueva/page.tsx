"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Save,
  Loader2,
  Check,
  GripVertical,
  Eye,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import * as Icons from "lucide-react";

interface TemplateSection {
  id: string;
  key: string;
  title: string;
  icon: string;
  isRequired: boolean;
  isDefault: boolean;
  content: string;
  order: number;
}

interface Template {
  id: string;
  name: string;
  sections: TemplateSection[];
}

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Form data
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectName, setProjectName] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [projectPrice, setProjectPrice] = useState("");
  
  // Sections
  const [sections, setSections] = useState<{
    id: string;
    key: string;
    title: string;
    icon: string;
    content: string;
    isVisible: boolean;
  }[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      setTemplates(data);
      if (data.length > 0) {
        selectTemplate(data[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar plantillas");
    }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setSections(template.sections.map(s => ({
      id: s.id,
      key: s.key,
      title: s.title,
      icon: s.icon || "FileText",
      content: s.content,
      isVisible: s.isDefault
    })));
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || Icons.FileText;
    return Icon;
  };

  const toggleSection = (key: string) => {
    setSections(prev => prev.map(s => 
      s.key === key ? { ...s, isVisible: !s.isVisible } : s
    ));
  };

  const updateSectionContent = (key: string, content: string) => {
    setSections(prev => prev.map(s => 
      s.key === key ? { ...s, content } : s
    ));
  };

  const handleCreate = async () => {
    if (!selectedTemplate) {
      toast.error("Selecciona una plantilla");
      return;
    }

    if (!companyName.trim()) {
      toast.error("El nombre de la empresa es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          companyName,
          contactName,
          email,
          phone,
          projectName,
          internalNotes,
          projectPrice: projectPrice ? parseFloat(projectPrice) : null,
          currency: "USD",
          sections: sections.map(s => ({
            key: s.key,
            content: s.content,
            isVisible: s.isVisible
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Error al crear cotización");
      }

      const quote = await response.json();
      toast.success("Cotización creada exitosamente");
      router.push(`/cotizacion/${quote.token}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al crear cotización");
    } finally {
      setIsLoading(false);
    }
  };

  const parseContent = (contentStr: string) => {
    try {
      return JSON.parse(contentStr);
    } catch {
      return { type: "text", text: contentStr };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-semibold">Nueva Cotización</span>
                <p className="text-xs text-muted-foreground">Paso {step} de 3</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s < step
                      ? "bg-primary text-primary-foreground"
                      : s === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Client Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de la empresa *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="companyName"
                          placeholder="Empresa S.A."
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactName">Persona de contacto</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="contactName"
                          placeholder="Juan Pérez"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="correo@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+593 99 999 9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Nombre del proyecto</Label>
                      <Input
                        id="projectName"
                        placeholder="Desarrollo Web Corporativo"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectPrice">Precio del proyecto (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="projectPrice"
                          type="number"
                          placeholder="600.00"
                          value={projectPrice}
                          onChange={(e) => setProjectPrice(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="internalNotes">Notas internas</Label>
                      <Textarea
                        id="internalNotes"
                        placeholder="Notas privadas sobre el cliente..."
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setStep(2)} disabled={!companyName.trim()}>
                      Continuar
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Select Sections */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    Secciones de la Cotización
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Selecciona las secciones que deseas incluir en tu cotización
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sections.map((section, index) => {
                      const Icon = getIcon(section.icon);
                      const templateSection = selectedTemplate?.sections.find(s => s.key === section.key);
                      const isRequired = templateSection?.isRequired;

                      return (
                        <motion.div
                          key={section.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                            section.isVisible
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              section.isVisible
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              {isRequired && (
                                <Badge variant="secondary" className="text-xs mt-1">Requerido</Badge>
                              )}
                            </div>
                          </div>
                          <Checkbox
                            checked={section.isVisible}
                            disabled={isRequired}
                            onCheckedChange={() => toggleSection(section.key)}
                          />
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Atrás
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={sections.filter(s => s.isVisible).length === 0}>
                      Continuar
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Review & Create */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Resumen de la Cotización
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Info Summary */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {companyName}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {contactName && <p>Contacto: {contactName}</p>}
                      {email && <p>Email: {email}</p>}
                      {phone && <p>Tel: {phone}</p>}
                      {projectName && <p>Proyecto: {projectName}</p>}
                    </div>
                    {projectPrice && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-lg font-bold text-primary">
                          ${parseFloat(projectPrice).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Selected Sections */}
                  <div>
                    <h4 className="font-medium mb-3">Secciones incluidas ({sections.filter(s => s.isVisible).length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {sections.filter(s => s.isVisible).map(section => {
                        const Icon = getIcon(section.icon);
                        return (
                          <Badge key={section.key} variant="secondary" className="gap-1.5 py-1.5">
                            <Icon className="w-3.5 h-3.5" />
                            {section.title}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Atrás
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="mr-2 w-4 h-4" />
                          Crear Cotización
                        </>
                      )}
                    </Button>
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
