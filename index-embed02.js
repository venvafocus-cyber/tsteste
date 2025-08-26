// /api/tts-audio.js
export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const nome = searchParams.get("nome") || "";
  const valor = Number(searchParams.get("valor") || 0);
  const voice_id = searchParams.get("voice_id"); // ex: "21m00Tcm4TlvDq8ikWAM"
  const texto = searchParams.get("texto"); // opcional
  const apiKey = process.env.ELEVEN_API_KEY;

  if (!apiKey || !voice_id) {
    return new Response(JSON.stringify({ error: "Missing ELEVEN_API_KEY or voice_id" }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  const valorFmt = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const textoFinal = (texto && decodeURIComponent(texto)) ||
    `Olá ${nome}, sua indenização no valor de ${valorFmt} está aprovada. `
    + `Siga as instruções na tela para concluir a autenticação.`;

  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json",
      "accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text: textoFinal,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.7 }
    })
  });

  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    return new Response(JSON.stringify({ error: "TTS failed", details: err }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }

  // Entrega o MP3 direto (sem salvar)
  return new Response(ttsRes.body, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store"
    }
  });
}
