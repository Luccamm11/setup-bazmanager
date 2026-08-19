/**
 * imageCompressor.ts
 * Utilitário para compactação de fotos no navegador antes de salvar no Supabase.
 * Garante estritamente que cada imagem fique abaixo de 100 KB mantendo boa nitidez.
 */

export interface CompressionResult {
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  width: number;
  height: number;
}

const MAX_TARGET_BYTES = 100 * 1024; // 100 KB

/**
 * Converte um File ou Blob para dataURL
 */
function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Carrega uma imagem a partir de uma dataURL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Calcula o tamanho real em bytes de uma string base64 / dataUrl
 */
export function getBase64SizeBytes(dataUrl: string): number {
  const base64Str = dataUrl.split(',')[1] || dataUrl;
  const padding = (base64Str.match(/=/g) || []).length;
  return Math.floor((base64Str.length * 3) / 4) - padding;
}

/**
 * Formata bytes para string legível (ex: 85.4 KB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

/**
 * Compacta uma imagem garantindo que o payload final seja estritamente <= maxBytes (default 100 KB)
 */
export async function compressImageToMax100KB(
  input: File | Blob | string,
  maxBytes: number = MAX_TARGET_BYTES
): Promise<CompressionResult> {
  const originalDataUrl = typeof input === 'string' ? input : await fileToDataUrl(input);
  const img = await loadImage(originalDataUrl);

  const initialWidth = img.naturalWidth || img.width;
  const initialHeight = img.naturalHeight || img.height;

  // Limite inicial razoável para fotos de projetos
  let currentMaxWidth = Math.min(initialWidth, 1200);
  let currentMaxHeight = Math.min(initialHeight, 1200);

  // Determina se o navegador suporta WebP em canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Não foi possível obter contexto 2D do Canvas');
  }

  const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  const mimeType = supportsWebp ? 'image/webp' : 'image/jpeg';

  let quality = 0.85;
  let bestDataUrl = '';
  let bestSizeBytes = Infinity;
  let bestWidth = initialWidth;
  let bestHeight = initialHeight;

  // Loop de convergência iterativo
  for (let iteration = 0; iteration < 8; iteration++) {
    // Calcula dimensões proporcionais
    let width = initialWidth;
    let height = initialHeight;

    if (width > currentMaxWidth || height > currentMaxHeight) {
      const ratio = Math.min(currentMaxWidth / width, currentMaxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;

    // Fundo branco caso haja transparência convertida para JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL(mimeType, quality);
    const sizeBytes = getBase64SizeBytes(dataUrl);

    if (sizeBytes <= maxBytes) {
      bestDataUrl = dataUrl;
      bestSizeBytes = sizeBytes;
      bestWidth = width;
      bestHeight = height;
      break; // Conseguiu atingir o objetivo!
    }

    // Se ainda passou de 100KB, reduz qualidade e/ou resolução progressivamente
    if (quality > 0.45) {
      quality -= 0.15;
    } else {
      // Reduz dimensões
      currentMaxWidth = Math.round(currentMaxWidth * 0.8);
      currentMaxHeight = Math.round(currentMaxHeight * 0.8);
      quality = 0.65;
    }

    bestDataUrl = dataUrl;
    bestSizeBytes = sizeBytes;
    bestWidth = width;
    bestHeight = height;
  }

  // Garantia final extrema: se ainda passar por pouco, reduz drasticamente
  if (bestSizeBytes > maxBytes) {
    currentMaxWidth = 640;
    currentMaxHeight = 640;
    const ratio = Math.min(currentMaxWidth / initialWidth, currentMaxHeight / initialHeight);
    const width = Math.round(initialWidth * ratio);
    const height = Math.round(initialHeight * ratio);

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    bestDataUrl = canvas.toDataURL(mimeType, 0.4);
    bestSizeBytes = getBase64SizeBytes(bestDataUrl);
    bestWidth = width;
    bestHeight = height;
  }

  return {
    dataUrl: bestDataUrl,
    sizeBytes: bestSizeBytes,
    sizeKb: parseFloat((bestSizeBytes / 1024).toFixed(1)),
    width: bestWidth,
    height: bestHeight,
  };
}
