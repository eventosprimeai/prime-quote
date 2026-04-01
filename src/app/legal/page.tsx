"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Scale, Shield, Cookie, Building2, CheckCircle2 } from "lucide-react";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState("terminos");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="py-6 px-6 border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
             <Building2 className="w-4 h-4 text-primary" />
             <span>EPRAI EVENTOS PRIME AI S.A.S.</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-neon-cyan mb-4">
            Documentación Legal
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Transparencia, seguridad y compromiso en cada acuerdo. Por favor, lee detenidamente nuestras políticas operativas y corporativas actualizadas.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-10 h-auto gap-2 bg-muted/20 p-2 border border-border/40 rounded-xl">
            <TabsTrigger value="terminos" className="py-4 text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg transition-all">
              <Scale className="w-5 h-5 mr-2" /> Términos de Servicio
            </TabsTrigger>
            <TabsTrigger value="privacidad" className="py-4 text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg transition-all">
              <Shield className="w-5 h-5 mr-2" /> Política de Privacidad
            </TabsTrigger>
            <TabsTrigger value="cookies" className="py-4 text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg transition-all">
              <Cookie className="w-5 h-5 mr-2" /> Política de Cookies
            </TabsTrigger>
          </TabsList>

          <div className="bg-card/30 border border-border/50 rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden backdrop-blur-sm">
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl" />

            <TabsContent value="terminos" className="relative z-10 m-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-sans text-primary border-b border-border/50 pb-2">1. Información Corporativa e Identidad</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Prime Quote es un Producto SaaS (Software as a Service) operado y respaldado estrictamente bajo el dominio jurídico de <strong>EPRAI EVENTOS PRIME AI S.A.S.</strong>, entidad legal formalmente constituida con <strong>RUC: 0993401502001</strong>. El acceso y uso de la plataforma hospedada en <a href="https://quote.eventosprimeai.com/" className="text-neon-cyan hover:underline">https://quote.eventosprimeai.com/</a>, así como todas sus herramientas de orquestación B2B, están regidos por las leyes que protegen el comercio electrónico internacional y las normativas contractuales de su país de registro.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-sans text-primary border-b border-border/50 pb-2">2. Naturaleza del Servicio y Contratos Digitales</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Prime Quote facilita a los profesionales la creación de propuestas interactivas que, tras ser aprobadas por el cliente final, <strong>confluyen en Acuerdos de Servicios Profesionales Digitalizados</strong>.
                </p>
                <div className="bg-primary/5 p-5 rounded-xl border border-primary/20">
                  <h4 className="font-bold mb-2 flex items-center text-foreground"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" />Validez Contractual y Firmas</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                    <li>Al hacer clic en el botón "Aprobar y Firmar Digitalmente", el Cliente y el Profesional asumen un compromiso vinculante de las acciones detalladas.</li>
                    <li>La <strong>Firma Digital Criptográfica</strong> generada internamente actúa como prueba inmutable de tiempo y acuerdo, registrada en nuestros servidores para protección de ambas partes.</li>
                    <li>Modificaciones, Adendas o Extensiones pueden ser propuestas dentro del hilo del contrato, pero sólo obtendrán validez legal una vez aprobadas y materializadas en la Metadata inmutable del acuerdo por el titular Profesional.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-sans text-primary border-b border-border/50 pb-2">3. Restricciones e Infracciones</h2>
                <p className="text-muted-foreground leading-relaxed">
                  EPRAI EVENTOS PRIME AI S.A.S. se reserva el estricto derecho de suspensión inmediata a cuentas que sean detectadas emitiendo contenido que inflija normativas financieras o promueva extorsiones a través del módulo de cotización, así como aquellas cuentas en planes "Free" (Gratuitos) que intenten evadir bloqueos de marca blanca del sistema engañando las medidas de seguridad del servidor.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="privacidad" className="relative z-10 m-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary border-b border-border/50 pb-2">1. Captación y Tratamiento de la Memoria y Datos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cumpliendo con los estándares de control y minimización de datos (como el GDPR europeo y normativas de comercio digital locales), <strong>EPRAI EVENTOS PRIME AI S.A.S.</strong> solo procesa información esencial para el corretaje digital del servicio. Retenemos datos básicos de empresa, correos electrónicos, listados de precios e información legal estrictamente necesaria para generar contratos vinculantes válidos.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary border-b border-border/50 pb-2">2. Política Estricta de Retención de Imágenes (Limpieza Automatizada)</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para optimizar nuestra huella de datos, la plataforma posee un Motor Activo de Purga (Garbage Collector). La retención de archivos multimedia se rige bajo el siguiente mandato estricto:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-xl border border-border/50 bg-background/50">
                     <p className="font-bold text-red-400 mb-2">Imágenes de Referencia (Items Cotizados)</p>
                     <p className="text-sm text-muted-foreground">Están programadas biológicamente para una <strong>caducidad automática de 30 días continuos</strong> a partir de su subida. Un script cron purga tanto de la base de datos como de nuestros servidores físicos cualquier referencia técnica o estética expirada para ahorrar capacidad.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/50 bg-primary/5">
                     <p className="font-bold text-primary mb-2">Imágenes Vitales (Exentas de Purga)</p>
                     <p className="text-sm text-foreground/80">Están blindadas debido a su importancia jurídica y operativa. Estas incluyen: <strong>1. Las fotografías de Perfil Administrativo o Logos Corporativos.</strong> <strong>2. Los Comprobantes (Captures) de Pago</strong> subidos al Hilo de Registro Inmutable, requeridos para disputas contables o auditorías perpetuas.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary border-b border-border/50 pb-2">3. Compartición con Terceros</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nunca venderemos su información, su listado de clientes ni los precios de sus proyectos a terceros. La metadata interna de un contrato está encriptada lógicamente y es puramente accesible mediante el <code>Token</code> único generado para que usted y su cliente puedan auditarlo en todo momento a través del protocolo HTTPS oficial.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="cookies" className="relative z-10 m-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary border-b border-border/50 pb-2">1. Arquitectura de Navegación Basada en Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nuestro dominio <strong>quote.eventosprimeai.com</strong> se apoya en un framework tecnológico moderno (Next.js) que requiere de arquitecturas ligeras de memoria en el navegador para funcionar ininterrumpidamente sin pérdidas de información durante la firma de contratos.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary border-b border-border/50 pb-2">2. Clasificación de Cookies</h2>
                <ul className="space-y-4 mt-4">
                  <li className="flex gap-4 p-4 rounded-lg bg-muted/20 border border-border/30">
                     <div className="bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                       <Shield className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <h4 className="font-bold">Cookies Estrictamente Esenciales (Sesión Segura)</h4>
                       <p className="text-sm text-muted-foreground mt-1">Usadas para preservar el token criptográfico que demuestra que has iniciado sesión como profesional. Si el navegador las deniega, los interceptores de seguridad de nuestro <em>Middleware</em> bloquearán el acceso a los paneles administrativos.</p>
                     </div>
                  </li>
                  <li className="flex gap-4 p-4 rounded-lg bg-muted/20 border border-border/30">
                     <div className="bg-accent/20 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                       <Cookie className="w-5 h-5 text-accent" />
                     </div>
                     <div>
                       <h4 className="font-bold">Cookies de Preferencias Administrativas</h4>
                       <p className="text-sm text-muted-foreground mt-1">Elementos locales como <code>prime_cookie_consent</code> y guardados asíncronos para garantizar que la pantalla no te vuelva a interrumpir con el banner regulatorio, ni olvide tus filtros dentro del sistema una vez lo utilices frecuentemente.</p>
                     </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary border-b border-border/50 pb-2">3. Retiro del Consentimiento</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Como mandatan las normativas internacionales, posees el derecho inalienable de borrar tus cookies utilizando los ajustes de almacenamiento en caché de tu navegador. Considera que si purgas las cookies catalogadas como 'Estrictamente Esenciales', tu sesión activa cerrará inmediatamente y deberás recertificarte.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <footer className="py-6 border-t border-border/30 mt-auto text-center text-muted-foreground text-sm">
        <p>EPRAI EVENTOS PRIME AI S.A.S. - RUC: 0993401502001</p>
        <p className="mt-1">Última actualización documentada: {new Date().toLocaleDateString("es-EC")}</p>
      </footer>
    </div>
  );
}
