// src/types/opencv.d.ts
declare namespace cv {
  class Mat {
    static zeros(rows: number, cols: number, type: number): Mat;
    delete(): void;
    roi(rect: { x: number, y: number, width: number, height: number }): Mat;
    copyTo(dst: Mat, mask?: Mat): void;
  }

  class MatVector {
    size(): number;
    get(index: number): Mat;
    delete(): void;
  }

  class Point {
    constructor(x: number, y: number);
  }

  class Scalar {
    constructor(v0: number);
  }

  // Constantes
  const COLOR_RGBA2GRAY: number;
  const THRESH_BINARY_INV: number;
  const THRESH_OTSU: number;
  const RETR_EXTERNAL: number;
  const CHAIN_APPROX_SIMPLE: number;
  const CV_8UC1: number;
  const CV_8UC4: number;
  const FILLED: number;
  const LINE_8: number;

  // Funciones
  function cvtColor(src: Mat, dst: Mat, code: number): void;
  function threshold(src: Mat, dst: Mat, thresh: number, maxval: number, type: number): void;
  function findContours(src: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
  function drawContours(image: Mat, contours: MatVector, contourIdx: number, color: Scalar, thickness: number, lineType: number, hierarchy?: Mat, maxLevel?: number, offset?: Point): void;
  function boundingRect(contour: Mat): { x: number, y: number, width: number, height: number };
  function imread(img: HTMLImageElement): Mat;
  function imshow(canvas: HTMLCanvasElement, mat: Mat): void;
}

declare global {
  interface Window {
    cv: typeof cv;
  }
}