'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X, Plus, Crown, Star, Info, Check } from 'lucide-react';
import { motion } from 'framer-motion';

// Color temático dinámico (Vívido Púrpura de capturas)
const appColor = '#a855f7'; 

const plans = [
  { 
    name: 'Free', price: 0, period: '/mes', 
    features: ['10 Cotizaciones/mes', 'Sin logo de empresa', 'Acceso básico', 'Funciones limitadas', 'Soporte por email', '1 usuario'], 
    cta: 'Empezar gratis' 
  },
  { 
    name: 'Starter', price: 9, period: '/mes', 
    features: ['50 Cotizaciones/mes', 'Subida de Logo Propio', 'Acceso completo', '500 créditos/mes', 'Soporte prioritario', '3 usuarios', 'Integraciones básicas'], 
    cta: 'Elegir Starter' 
  },
  { 
    name: 'Pro', price: 29, period: '/mes', 
    features: ['150 Cotizaciones/mes', 'Exportación PDF y WhatsApp', 'Acceso completo', '2,000 créditos/mes', 'Soporte 24/7', '10 usuarios', 'Todas las integraciones', 'Reportes avanzados'], 
    cta: 'Elegir Pro', featured: true 
  },
  { 
    name: 'Suite', price: 89, period: '/mes', 
    features: ['Cotizaciones Ilimitadas', 'Firma y Contratos Digitales', 'Acceso a las 21 apps', '5,000 créditos/mes', 'Soporte VIP', 'Usuarios ilimitados', 'API access', 'Onboarding personalizado', 'Prime Ranking bonus'], 
    cta: 'Elegir Suite' 
  },
  { 
    name: 'Part-time partner', priceStr: 'Embajador', programName: 'Embajador', period: '', 
    features: ['20 Cotizaciones (Uso personal)', 'Membresía Pro gratuita', 'Más puntos en Prime Ranking', 'Requisito: 2 referidos/mes', '1 post creativo/mes verificable', 'Insignia oficial', 'Aprobación sujeta a revisión'], 
    cta: 'Postular a Embajador', isProgram: true 
  },
  { 
    name: 'Full-time partner', priceStr: 'Creador Ángel', programName: 'Ángel', period: '', 
    features: ['50 Cotizaciones (Uso personal)', 'Membresía Suite gratuita', 'Accesos prioritarios', 'Más puntos en Prime Ranking', 'Requisito: Canal tutoriales', 'Uso creativo de nuestras apps', 'Aprobación sujeta a revisión'], 
    cta: 'Postular a Ángel', isProgram: true 
  },
  { 
    name: 'Personalizado', priceStr: 'Empresarial', period: '', 
    features: ['Despliegue en marca blanca', 'Cotizaciones Multi-sucursal', 'Todo de Suite', 'Créditos ilimitados', 'SLA dedicado', 'Integración personalizada', 'Account manager', 'Facturación corporativa'], 
    cta: 'Contactar ventas' 
  },
];

export default function PricingCoverflow() {
  const [activePlanIdx, setActivePlanIdx] = useState(2); // Comienza con foco en Pro
  const [isAnnual, setIsAnnual] = useState(false);
  
  // Modal States
  const [postulationPlan, setPostulationPlan] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);
  const [showRankingInfo, setShowRankingInfo] = useState(false);

  // Handlers Coverflow Infinite Scroll
  const handleNext = () => setActivePlanIdx((prev) => (prev + 1) % plans.length);
  const handlePrev = () => setActivePlanIdx((prev) => (prev - 1 + plans.length) % plans.length);

  return (
    <>
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-background to-muted/10 border-t border-border/30" id="precios">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Planes a tu <span className="text-neon-gradient">medida</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
              Escala tu negocio de servicios con herramientas de impacto. Todo es 100% funcional.
            </p>

            {/* Toggle Mensual/Anual */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-semibold ${!isAnnual ? 'text-white' : 'text-muted-foreground'}`}>Mensual</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                type="button"
                className="relative inline-flex h-8 w-16 items-center flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
                style={{ backgroundColor: isAnnual ? appColor : 'rgba(255, 255, 255, 0.15)' }}
              >
                <span 
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${isAnnual ? 'translate-x-9' : 'translate-x-1'}`}
                />
              </button>
              <div className="flex flex-col items-start leading-none h-6 justify-center relative">
                <span className={`text-sm font-semibold ${isAnnual ? 'text-white' : 'text-muted-foreground'}`}>Anual</span>
                {isAnnual && <span className="absolute top-full mt-1 text-[10px] text-[#a855f7] font-bold tracking-wider uppercase whitespace-nowrap">Ahorras 12.5%</span>}
              </div>
            </div>

          </motion.div>

          <div className="pricingCarousel w-full" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            <div className="pricingCoverFlow min-h-[600px]">
              {plans.map((plan, rawIdx) => {
                let offset = rawIdx - activePlanIdx;
                
                // Ajuste matemático de index para el Wrap-Around / Scroll Infinito
                const maxOffset = Math.floor(plans.length / 2); 
                if (offset < -maxOffset) offset += plans.length;
                if (offset > maxOffset) offset -= plans.length;

                const isActive = offset === 0;
                const isAdjacent = Math.abs(offset) === 1;
                const opacity = isActive ? 1 : isAdjacent ? 0.3 : 0;
                const scale = isActive ? 1 : 0.88;
                
                return (
                  <div 
                    key={plan.name} 
                    className="pricingSlideCoverflow"
                    onClick={() => {
                      if (!isActive) setActivePlanIdx(rawIdx);
                    }}
                    style={{
                      transform: `translateX(${offset * 105}%) scale(${scale})`,
                      opacity: opacity,
                      pointerEvents: 'auto',
                      cursor: isActive ? 'default' : 'pointer',
                      zIndex: 10 - Math.abs(offset)
                    }}
                  >
                    <div 
                      className="card-neon flex flex-col p-6 sm:p-8 text-left transition-all duration-500 ease-in-out relative overflow-hidden" 
                      style={{ 
                        pointerEvents: isActive ? 'auto' : 'none',
                        borderColor: isActive ? appColor : 'var(--border)',
                        boxShadow: isActive ? `0 0 25px ${appColor}35` : 'none',
                        background: isActive ? `oklch(from ${appColor} l c h / 0.05)` : undefined
                      }}
                    >
                      {isActive && (
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neon-cyan to-neon-magenta" style={{ background: appColor }} />
                      )}

                      {plan.featured && isActive && (
                        <div className="absolute top-4 right-4 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg" style={{ background: appColor, boxShadow: `0 0 10px ${appColor}50` }}>MÁS POPULAR</div>
                      )}
                      
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      
                      {plan.price !== undefined ? (
                        <div className="font-extrabold mb-4 text-[2.25rem]">
                          ${isAnnual && plan.price > 0 ? Math.ceil(plan.price * 10.5) : plan.price}
                          <span className="text-sm font-normal text-muted-foreground">
                            {isAnnual && plan.price > 0 ? '/año' : plan.period}
                          </span>
                        </div>
                      ) : (
                        <div className="font-extrabold mb-4 text-[1.5rem]">
                          {plan.priceStr}
                        </div>
                      )}

                      <ul className="space-y-3 mb-8 text-sm flex-grow">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              {f.includes("Sin logo") || f.includes("Tema oscuro forzado") || f.includes("Marca de agua Prime Quote") ? (
                                <X className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Check className="w-4 h-4" style={{ color: appColor }} />
                              )}
                              <span className={f.includes("Sin logo") || f.includes("Tema oscuro forzado") || f.includes("Marca de agua Prime Quote") ? "text-muted-foreground" : ""}>{f}</span>
                            </div>
                            
                            {/* Inyección UI inteligente de Prime Ranking */}
                            {f.includes('Prime Ranking') && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowRankingInfo(true); }}
                                className="bg-transparent border-none cursor-pointer flex p-1"
                                title="Más información sobre Prime Ranking"
                              >
                                <Info size={16} className="text-muted-foreground" style={{ filter: `drop-shadow(0 0 5px ${appColor}50)` }} />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      <button
                        className={`w-full py-3 text-sm rounded-lg font-bold transition-all mt-auto ${isActive ? 'btn-neon-filled border-0' : 'btn-neon'}`}
                        style={isActive ? { background: `linear-gradient(135deg, ${appColor} 0%, rgba(0, 150, 160, 1) 100%)`, color: '#000' } : {}}
                        onClick={() => {
                          if (plan.isProgram) {
                            setPostulationPlan(plan.programName);
                          }
                        }}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Dots & Arrows UI Navegación Coverflow */}
            <div className="carouselIndicators">
              <button onClick={handlePrev} className="carouselArrow" aria-label="Anterior">
                <ChevronLeft size={28} color={appColor} style={{ filter: `drop-shadow(0 0 6px ${appColor}80)` }} />
              </button>
              
              <div className="flex items-center gap-2">
                {plans.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePlanIdx(idx)}
                    className={`carouselDot ${activePlanIdx === idx ? 'carouselDotActive' : ''}`}
                    style={activePlanIdx === idx ? { background: appColor } : {}}
                    aria-label={`Ir al plan ${idx + 1}`}
                  />
                ))}
              </div>

              <button onClick={handleNext} className="carouselArrow" aria-label="Siguiente">
                <ChevronRight size={28} color={appColor} style={{ filter: `drop-shadow(0 0 6px ${appColor}80)` }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ POSTULATION MODAL ═══ */}
      {postulationPlan && (
        <div 
          className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => { if(e.target === e.currentTarget) setPostulationPlan(null); }}
        >
          <div className="bg-[#0a0a0a] rounded-3xl w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto p-10 relative" style={{ border: `1px solid ${appColor}40`, boxShadow: `0 0 40px ${appColor}20` }}>
            <button 
              onClick={() => setPostulationPlan(null)}
              className="absolute top-6 right-6 bg-transparent border-none cursor-pointer text-muted-foreground"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-8 mt-4">
              <div className="inline-flex p-4 rounded-full mb-4" style={{ background: `${appColor}15`, filter: `drop-shadow(0 0 15px ${appColor}50)` }}>
                {postulationPlan === 'Embajador' ? <Star size={40} color={appColor} /> : <Crown size={40} color={appColor} />}
              </div>
              <h2 className="text-3xl font-bold" style={{ color: appColor }}>Postulación a {postulationPlan}</h2>
              <p className="text-muted-foreground mt-2">
                Únete a la élite creadora y crece junto a Eventos Prime.<br/>
                <Link href="#" className="underline mt-2 inline-block" style={{ color: appColor }}>Ver políticas y reglas del programa</Link>
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); alert('Postulación enviada exitosamente.'); setPostulationPlan(null); }} className="flex flex-col gap-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm text-muted-foreground">País</label>
                  <select required className="w-full p-3 rounded-xl bg-[oklch(0.12_0.02_270)] border border-border text-white outline-none focus:border-[#00e5ff]">
                    <option value="">Selecciona tu país...</option>
                    <option value="AR">Argentina</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                    <option value="EC">Ecuador</option>
                    <option value="MX">México</option>
                    <option value="PE">Perú</option>
                    <option value="ES">España</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm text-muted-foreground">WhatsApp (código +)</label>
                  <input type="tel" required placeholder="+593 9..." className="w-full p-3 rounded-xl bg-[oklch(0.12_0.02_270)] border border-border text-white outline-none focus:border-[#00e5ff]" />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Correo Electrónico</label>
                <input type="email" required placeholder="tu@email.com" className="w-full p-3 rounded-xl bg-[oklch(0.12_0.02_270)] border border-border text-white outline-none focus:border-[#00e5ff]" />
              </div>

              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Enlaces de Redes Sociales / Canal</label>
                <div className="flex flex-col gap-2">
                  {socialLinks.map((link, i) => (
                    <input 
                      key={i} 
                      type="url" 
                      required 
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...socialLinks];
                        newLinks[i] = e.target.value;
                        setSocialLinks(newLinks);
                      }}
                      placeholder="https://instagram.com/..." 
                      className="w-full p-3 rounded-xl bg-[oklch(0.12_0.02_270)] border border-border text-white outline-none focus:border-[#00e5ff]" 
                    />
                  ))}
                </div>
                <button type="button" onClick={() => setSocialLinks([...socialLinks, ''])} className="flex items-center gap-2 bg-transparent border-none mt-2 cursor-pointer text-sm" style={{ color: appColor }}>
                  <Plus size={16} /> Agregar otra red social
                </button>
              </div>

              <div>
                <label className="block mb-2 text-sm text-muted-foreground">¿Por qué crees que serías un buen {postulationPlan}? (Pitch de valor)</label>
                <textarea required rows={4} placeholder={`Describe tu propuesta de valor y cómo nos ayudaríamos mutuamente...`} className="w-full p-3 rounded-xl bg-[oklch(0.12_0.02_270)] border border-border text-white outline-none resize-y focus:border-[#00e5ff]"></textarea>
              </div>

              <button type="submit" className="w-full mt-4 p-4 rounded-xl font-bold text-black" style={{ background: appColor, border: `1px solid ${appColor}` }}>
                Enviar Postulación Oficial
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ PRIME RANKING INFO MODAL ═══ */}
      {showRankingInfo && (
        <div 
          className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => { if(e.target === e.currentTarget) setShowRankingInfo(false); }}
        >
          <div className="bg-[#0a0a0a] rounded-3xl w-[90%] max-w-[450px] p-10 relative text-center" style={{ border: `1px solid #eab30840`, boxShadow: `0 0 40px #eab30820` }}>
             <button 
              onClick={() => setShowRankingInfo(false)}
              className="absolute top-6 right-6 bg-transparent border-none cursor-pointer text-muted-foreground"
            >
              <X size={24} />
            </button>
            
            <div className="inline-flex p-4 rounded-full mb-6" style={{ background: `#eab30815`, filter: `drop-shadow(0 0 15px #eab30850)` }}>
              <Crown size={40} color="#eab308" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#eab308' }}>Prime Ranking</h2>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Eventos Prime no es solo software, es una élite. Nuestro sistema de <strong>Prime Ranking</strong> premia tu influencia y lealtad.
            </p>
            
            <ul className="text-left text-muted-foreground mb-8 flex flex-col gap-3 text-sm">
              <li className="flex gap-2 items-start"><Star size={18} color="#eab308" className="shrink-0 mt-[2px]" /> <span>Acumula puntos por referir colegas y usar las plataformas.</span></li>
              <li className="flex gap-2 items-start"><Star size={18} color="#eab308" className="shrink-0 mt-[2px]" /> <span>Escala posiciones en los leaderboards globales de la industria.</span></li>
              <li className="flex gap-2 items-start"><Star size={18} color="#eab308" className="shrink-0 mt-[2px]" /> <span>Canjea premios exclusivos, merch de élite y accesos VIP físicos.</span></li>
            </ul>

            <Link 
              href="https://ranking.eventosprimeai.com" 
              target="_blank"
              onClick={() => setShowRankingInfo(false)}
              className="block w-full p-4 rounded-xl font-bold text-black" 
              style={{ background: '#eab308' }}
            >
              Descubrir Prime Ranking →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
