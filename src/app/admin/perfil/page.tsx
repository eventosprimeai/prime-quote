"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Save,
  Loader2,
  Upload,
  X,
  Plus,
  Trash2,
  CreditCard,
  LogOut,
  UserCircle,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  bank: string;
  accountType: string;
  accountNumber: string;
  ruc: string;
  email: string;
  phone: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile fields
  const [companyName, setCompanyName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [conditions, setConditions] = useState("");

  // Logo
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error("Error");
      const data = await response.json();

      setCompanyName(data.companyName || "");
      setProfileEmail(data.email || "");
      setProfilePhone(data.phone || "");
      setWebsite(data.website || "");
      setAddress(data.address || "");
      setTaxId(data.taxId || "");
      setConditions(data.conditions || "");
      setLogoUrl(data.logoUrl || "");
      setLogoPreview(data.logoUrl || "");

      if (data.paymentMethods) {
        try {
          const methods = JSON.parse(data.paymentMethods);
          setPaymentMethods(methods);
        } catch {
          setPaymentMethods([]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo excede 5MB");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addPaymentMethod = () => {
    setPaymentMethods(prev => [
      ...prev,
      {
        id: `pm-${Date.now()}`,
        type: "",
        name: "",
        bank: "",
        accountType: "",
        accountNumber: "",
        ruc: "",
        email: "",
        phone: "",
      },
    ]);
  };

  const updatePaymentMethod = (id: string, field: keyof PaymentMethod, value: string) => {
    setPaymentMethods(prev =>
      prev.map(pm => (pm.id === id ? { ...pm, [field]: value } : pm))
    );
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalLogoUrl = logoUrl;

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("type", "profile-logo");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalLogoUrl = uploadData.url;
        }
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          logoUrl: finalLogoUrl,
          phone: profilePhone,
          email: profileEmail,
          website,
          address,
          taxId,
          paymentMethods,
          conditions,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar");

      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error("Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                <span className="font-semibold text-neon-cyan">Mi Perfil</span>
                <p className="text-xs text-muted-foreground">Datos empresariales y formas de pago</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/admin/historial">
              <Button variant="ghost" size="sm">
                <History className="w-4 h-4 mr-1.5" />
                Historial
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Business Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Información Empresarial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo de la empresa</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <div className="w-24 h-24 rounded-xl bg-muted/50 border border-border flex items-center justify-center p-3">
                        <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                      <button
                        onClick={() => { setLogoFile(null); setLogoPreview(""); setLogoUrl(""); }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Subir</span>
                    </button>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>PNG sin fondo recomendado</p>
                    <p>Máximo 5MB</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nombre de empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Mi Empresa S.A."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>RUC / Identificación fiscal</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="0993401502001"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="contacto@empresa.com"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+593 99 999 9999"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sitio web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="www.empresa.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Av. Principal #123"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Formas de Pago
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addPaymentMethod}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Estos datos aparecerán en tus cotizaciones para que tus clientes sepan dónde depositarte.
              </p>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No has configurado formas de pago</p>
                  <p className="text-sm mt-1">Agrega al menos una para que aparezca en tus cotizaciones</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {paymentMethods.map((pm, index) => (
                    <motion.div
                      key={pm.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-primary">
                          Método {index + 1}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8"
                          onClick={() => removePaymentMethod(pm.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo (ej: Sin IVA, Con IVA)</Label>
                          <Input
                            placeholder="Sin IVA ni factura"
                            value={pm.type}
                            onChange={(e) => updatePaymentMethod(pm.id, "type", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Titular</Label>
                          <Input
                            placeholder="Nombre del titular"
                            value={pm.name}
                            onChange={(e) => updatePaymentMethod(pm.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Banco</Label>
                          <Input
                            placeholder="Banco Guayaquil"
                            value={pm.bank}
                            onChange={(e) => updatePaymentMethod(pm.id, "bank", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo de cuenta</Label>
                          <Input
                            placeholder="Ahorro"
                            value={pm.accountType}
                            onChange={(e) => updatePaymentMethod(pm.id, "accountType", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Número de cuenta</Label>
                          <Input
                            placeholder="0045784627"
                            value={pm.accountNumber}
                            onChange={(e) => updatePaymentMethod(pm.id, "accountNumber", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">RUC / CI</Label>
                          <Input
                            placeholder="0922488481"
                            value={pm.ruc}
                            onChange={(e) => updatePaymentMethod(pm.id, "ruc", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email de contacto</Label>
                          <Input
                            placeholder="correo@empresa.com"
                            value={pm.email}
                            onChange={(e) => updatePaymentMethod(pm.id, "email", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Teléfono</Label>
                          <Input
                            placeholder="+593 99 999 9999"
                            value={pm.phone}
                            onChange={(e) => updatePaymentMethod(pm.id, "phone", e.target.value)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Conditions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Condiciones Generales
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Texto que se mostrará en la sección de pago de tus cotizaciones
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ej: Para iniciar el proyecto, realiza el pago del 50% del valor total..."
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button onClick={handleSave} disabled={isSaving} className="w-full py-6 text-lg">
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar Perfil
              </>
            )}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
