// utils/canvasMask.ts - VERSION CORREGIDA

// Interfaces para mayor type safety
interface PieceData {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

interface OverlayData {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

interface TextData {
  content: string;
  x: number;
  y: number;
  rotation?: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
}

interface GeneratedImageResult {
  blob: Blob | null;
  dataURL: string;
  canvas: HTMLCanvasElement;
}

// Función para generar imagen con la pieza como máscara - CORREGIDA
export async function generateMaskedImage(
  piece: PieceData | null, 
  overlay: OverlayData | null, 
  texts: TextData[], 
  canvasWidth = 600, 
  canvasHeight = 400
): Promise<GeneratedImageResult> {
  return new Promise((resolve, reject) => {
    try {
      // Crear canvas con las mismas dimensiones que PreviewCanvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del canvas'));
        return;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Array para almacenar todas las imágenes que necesitamos cargar
      const imagesToLoad: Promise<{type: string, img: HTMLImageElement, data: any}>[] = [];

      // Función helper para cargar una imagen
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (error) => reject(new Error(`Error cargando imagen: ${src}`));
          img.src = src;
        });
      };

      // Cargar imagen de la pieza (será nuestra máscara)
      if (piece?.src) {
        imagesToLoad.push(
          loadImage(piece.src).then(img => ({ type: 'piece', img, data: piece }))
        );
      }

      // Cargar imagen overlay si existe
      if (overlay?.src) {
        imagesToLoad.push(
          loadImage(overlay.src).then(img => ({ type: 'overlay', img, data: overlay }))
        );
      }

      Promise.all(imagesToLoad).then(loadedImages => {
        // Encontrar las imágenes
        const pieceImage = loadedImages.find(item => item.type === 'piece');
        const overlayImage = loadedImages.find(item => item.type === 'overlay');

        if (!pieceImage) {
          reject(new Error('No se pudo cargar la imagen de la pieza'));
          return;
        }

        // PASO 1: Crear canvas de contenido (overlay + textos)
        const contentCanvas = document.createElement('canvas');
        const contentCtx = contentCanvas.getContext('2d');
        
        if (!contentCtx) {
          reject(new Error('No se pudo crear el canvas de contenido'));
          return;
        }

        contentCanvas.width = canvasWidth;
        contentCanvas.height = canvasHeight;

        // Configurar fondo transparente
        contentCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Dibujar overlay si existe - USANDO LAS COORDENADAS EXACTAS DE PREVIEWCANVAS
        if (overlayImage) {
          const o = overlayImage.data as OverlayData;
          contentCtx.save();
          
          // Aplicar transformaciones igual que en PreviewCanvas
          const centerX = o.x + o.w / 2;
          const centerY = o.y + o.h / 2;
          
          contentCtx.translate(centerX, centerY);
          contentCtx.rotate((o.rotation || 0) * Math.PI / 180);
          contentCtx.drawImage(overlayImage.img, -o.w / 2, -o.h / 2, o.w, o.h);
          contentCtx.restore();
        }

        // Dibujar textos - USANDO LAS COORDENADAS EXACTAS DE PREVIEWCANVAS
        if (texts && texts.length > 0) {
          texts.forEach((txt: TextData) => {
            if (txt.content && txt.content.trim() !== '') {
              contentCtx.save();
              
              // Usar las coordenadas exactas del PreviewCanvas
              contentCtx.translate(txt.x, txt.y);
              contentCtx.rotate((txt.rotation || 0) * Math.PI / 180);

              // Configurar fuente exactamente como en PreviewCanvas
              contentCtx.font = `${txt.fontSize}px ${txt.fontFamily}`;
              contentCtx.fillStyle = txt.color;
              contentCtx.globalAlpha = txt.opacity;
              contentCtx.textAlign = 'left';
              contentCtx.textBaseline = 'top';

              // Dibujar texto
              contentCtx.fillText(txt.content, 0, 0);
              contentCtx.restore();
            }
          });
        }

        // PASO 2: Crear canvas de máscara desde la pieza
        const maskCanvas = document.createElement('canvas');
        const maskCtx = maskCanvas.getContext('2d');
        
        if (!maskCtx) {
          reject(new Error('No se pudo crear el canvas de máscara'));
          return;
        }

        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
        maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Dibujar la pieza como máscara - USANDO LAS COORDENADAS EXACTAS
        const p = pieceImage.data as PieceData;
        maskCtx.save();
        
        const pieceCenterX = p.x + p.w / 2;
        const pieceCenterY = p.y + p.h / 2;
        
        maskCtx.translate(pieceCenterX, pieceCenterY);
        maskCtx.rotate((p.rotation || 0) * Math.PI / 180);
        maskCtx.drawImage(pieceImage.img, -p.w / 2, -p.h / 2, p.w, p.h);
        maskCtx.restore();

        // PASO 3: Aplicar la máscara al contenido
        try {
          // Limpiar canvas principal
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          
          // Obtener los datos de píxeles
          const contentData = contentCtx.getImageData(0, 0, canvasWidth, canvasHeight);
          const maskData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
          const resultData = ctx.createImageData(canvasWidth, canvasHeight);

          // Aplicar máscara píxel por píxel
          for (let i = 0; i < maskData.data.length; i += 4) {
            const maskAlpha = maskData.data[i + 3]; // Canal alpha de la máscara (pieza)

            if (maskAlpha > 0) {
              // Si la máscara tiene contenido, usar el contenido
              resultData.data[i] = contentData.data[i];         // R
              resultData.data[i + 1] = contentData.data[i + 1]; // G
              resultData.data[i + 2] = contentData.data[i + 2]; // B
              resultData.data[i + 3] = contentData.data[i + 3]; // A
            } else {
              // Si la máscara es transparente, hacer transparente el resultado
              resultData.data[i] = 0;
              resultData.data[i + 1] = 0;
              resultData.data[i + 2] = 0;
              resultData.data[i + 3] = 0;
            }
          }

          // Dibujar el resultado final
          ctx.putImageData(resultData, 0, 0);

          // OPCIONAL: También dibujar la pieza original por encima (para que sea visible)
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over'; // Dibujar detrás del contenido
          ctx.translate(pieceCenterX, pieceCenterY);
          ctx.rotate((p.rotation || 0) * Math.PI / 180);
          ctx.drawImage(pieceImage.img, -p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();

        } catch (error) {
          reject(new Error(`Error procesando los datos de imagen: ${error}`));
          return;
        }

        // Convertir a blob/dataURL
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              blob: blob,
              dataURL: canvas.toDataURL('image/png'),
              canvas: canvas
            });
          } else {
            reject(new Error('Error al generar el blob de la imagen'));
          }
        }, 'image/png');

      }).catch(error => {
        reject(new Error(`Error cargando imágenes: ${error.message}`));
      });

    } catch (error) {
      reject(new Error(`Error general: ${error}`));
    }
  });
}

// Función auxiliar para descargar la imagen
export function downloadImage(dataURL: string, filename = 'pieza_editada.png'): void {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error descargando la imagen:', error);
    throw new Error('No se pudo descargar la imagen');
  }
}

// Función mejorada que genera EXACTAMENTE lo que ves en PreviewCanvas
export async function generateExactPreview(
  piece: PieceData | null, 
  overlay: OverlayData | null, 
  texts: TextData[]
): Promise<GeneratedImageResult> {
  // Usar las dimensiones exactas del PreviewCanvas (600x400)
  return generateMaskedImage(piece, overlay, texts, 600, 400);
}

// Función para obtener las dimensiones de una imagen
export function getImageDimensions(src: string): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}