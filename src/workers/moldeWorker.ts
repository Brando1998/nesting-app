// moldeWorker.ts
let cvReady: Promise<void>;

self.onmessage = async (e: MessageEvent) => {
  const { buffer } = e.data;

  try {
    // 1️⃣ Inicializar OpenCV solo una vez
    if (!(self as any).cv) {
      importScripts("https://docs.opencv.org/4.5.5/opencv.js");

      cvReady = new Promise((resolve) => {
        (self as any).cv.onRuntimeInitialized = () => {
          console.log("✔ OpenCV listo en Worker");
          resolve();
        };
      });
    }

    await cvReady;
    const cv = (self as any).cv;

    // 2️⃣ Convertir ArrayBuffer → ImageData
    const blob = new Blob([buffer]);
    const bitmap = await createImageBitmap(blob);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    // 3️⃣ Procesar con OpenCV
    const img = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const piezas: any[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const rect = cv.boundingRect(contour);
      if (rect.width < 50 || rect.height < 50) continue;

      const roi = cv.Mat.zeros(rect.height, rect.width, cv.CV_8UC4);
      const mask = cv.Mat.zeros(rect.height, rect.width, cv.CV_8UC1);
      const offset = new cv.Point(-rect.x, -rect.y);

      const subImg = img.roi(rect);
      cv.drawContours(mask, contours, i, new cv.Scalar(255), cv.FILLED, cv.LINE_8, hierarchy, 0, offset);
      subImg.copyTo(roi, mask);

      // 4️⃣ Convertir el contorno a polígono simplificado
      const epsilon = 0.01 * cv.arcLength(contour, true); // ajusta la precisión
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, epsilon, true);

      const polygon: [number, number][] = [];
      for (let j = 0; j < approx.rows; j++) {
        const pt = approx.intPtr(j);
        polygon.push([pt[0] - rect.x, pt[1] - rect.y]); // coordenadas relativas al recorte
      }

      const piezaBlob = await matToBlob(roi, cv);
      const piezaBuffer = await piezaBlob.arrayBuffer();

      piezas.push({
        nombre: `Pieza ${i + 1}`,
        data: piezaBuffer,
        polygon, // ✅ ahora tenemos las coordenadas
      });

      roi.delete();
      mask.delete();
      approx.delete();
      contour.delete();
    }

    img.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();

    (self as any).postMessage({ success: true, piezas });
  } catch (error) {
    (self as any).postMessage({ success: false, error: String(error) });
  }
};

async function matToBlob(mat: any, cv: any): Promise<Blob> {
  const offscreen = new OffscreenCanvas(mat.cols, mat.rows);
  const ctx = offscreen.getContext("2d")!;
  const imgData = new ImageData(
    new Uint8ClampedArray(mat.data), 
    mat.cols, 
    mat.rows
  );
  ctx.putImageData(imgData, 0, 0);
  return offscreen.convertToBlob({ type: "image/png" });
}
