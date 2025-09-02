// utils/utils.ts

/**
 * Convierte un ArrayBuffer a string Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // evitar overflow con buffers grandes

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  return window.btoa(binary);
}

/**
 * Carga una fuente desde un ArrayBuffer y la registra en el navegador
 * @param fontName - Nombre para registrar la fuente
 * @param buffer - ArrayBuffer con los datos de la fuente
 */
export async function loadFontFromArrayBuffer(fontName: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const font = new FontFace(fontName, buffer);
    await font.load();
    (document as any).fonts.add(font);
    console.log(`✅ Fuente "${fontName}" cargada`);
  } catch (error) {
    console.error("❌ Error cargando fuente:", error);
  }
}

/**
 * Aplica una fuente registrada al contexto de un canvas
 * @param ctx - Contexto 2D del canvas
 * @param fontName - Nombre de la fuente previamente cargada
 * @param fontSize - Tamaño de fuente (ejemplo: 24)
 */
export function applyFontToCanvas(
  ctx: CanvasRenderingContext2D,
  fontName: string,
  fontSize: number = 24
) {
  ctx.font = `${fontSize}px "${fontName}"`;
}


/**
 * Genera url a un arraybuffer
 * @param buffer - La imagen en bits
 * @param mime - Formato
 */
export function arrayBufferToBlobUrl(buffer: ArrayBuffer, mime: string): string {
  const blob = new Blob([buffer], { type: mime });
  return URL.createObjectURL(blob);
}
