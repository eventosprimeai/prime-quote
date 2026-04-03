// src/lib/ai.ts
// Cliente centralizado de Gemini / Vertex AI para PrimeQuote
// Cuenta: cloud@eventosprimeai.com | Proyecto: eventosprime-ai-prod

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

// Si estamos en entorno de servidor y no hay key, podemos advertir (evitando crashes en client-side en NextJS)
if (!apiKey && typeof window === 'undefined') {
  console.warn('⚠️ GEMINI_API_KEY no configurada en las variables de entorno (.env). Esto deshabilitará las funciones de IA de Gemini.');
}

// Instancia global
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// gemini-1.5-flash: Modelo gratuito, ultra-rápido, excelente para tareas cotidianas y extracciones rápidas.
export const geminiFlash = genAI?.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
});

// gemini-1.5-pro: Modelo avanzado, ideal para razonamiento complejo, generación de contratos formales o propuestas detalladas.
export const geminiPro = genAI?.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
});
