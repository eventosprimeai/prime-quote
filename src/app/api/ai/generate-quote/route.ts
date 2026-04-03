import { NextRequest, NextResponse } from "next/server";
import { geminiPro } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { prompt, companyName, quoteType } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "El prompt es obligatorio" }, { status: 400 });
    }

    if (!geminiPro) {
      return NextResponse.json(
        { error: "La API de Gemini no está configurada en el servidor" },
        { status: 500 }
      );
    }

    const systemInstruction = `
      Eres el motor generador de cotizaciones profesionales de Eventos Prime. 
      Actúas como un experto redactor de propuestas comerciales de alto nivel.
      Basado en el prompt corto del usuario, debes generar 3 secciones de cotización ("blocks").
      El nombre de la empresa cliente es: "${companyName || 'El Cliente'}".
      El tipo de cotización es: "${quoteType}".

      Devuelve ÚNICAMENTE un JSON VÁLIDO con la siguiente estructura (sin formato Markdown, sin \`\`\`json):
      {
        "blocks": [
          {
            "title": "Un título conciso para la sección (ej. Alcance del Proyecto)",
            "description": "Una descripción muy detallada, profesional y convincente (mínimo 40 palabras), usando vocabulario corporativo premium."
          }
        ]
      }
      Deben ser exactamente 3 bloques distribuidos lógicamente.
    `;

    // Generar contenido con Gemini 1.5 Pro
    const result = await geminiPro.generateContent(systemInstruction + "\nPrompt del usuario: " + prompt);
    const text = result.response.text();
    
    // Parsear el JSON limpiando posible formato de código
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating quote with AI:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al generar la cotización con IA." },
      { status: 500 }
    );
  }
}
