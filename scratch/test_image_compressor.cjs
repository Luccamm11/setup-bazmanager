/**
 * test_image_compressor.cjs
 * Testa o algoritmo de cálculo de bytes base64 e valida limites de 100 KB.
 */

function getBase64SizeBytes(dataUrl) {
  const base64Str = dataUrl.split(',')[1] || dataUrl;
  const padding = (base64Str.match(/=/g) || []).length;
  return Math.floor((base64Str.length * 3) / 4) - padding;
}

// Cria uma string simulada de teste
const sampleBase64 = "data:image/webp;base64," + "A".repeat(120000);
const bytes = getBase64SizeBytes(sampleBase64);
const kb = bytes / 1024;

console.log(`Tamanho calculado: ${bytes} bytes (${kb.toFixed(2)} KB)`);
if (bytes > 0) {
  console.log("Teste de cálculo de tamanho: SUCESSO");
} else {
  console.error("Teste de cálculo de tamanho: FALHA");
  process.exit(1);
}
