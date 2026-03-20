import React, { useState, useRef, useEffect, useCallback } from "react";
import "../styles/ImageCropModal.css";

const ASPECT_W = 3;
const ASPECT_H = 2;
const OUT_W    = 600;
const OUT_H    = 400;

const ImageCropModalCapa = ({ onConfirm, onClose, src: externalSrc = null, title = "Foto de Capa" }) => {
  const [imageSrc, setImageSrc] = useState(externalSrc);
  const [ready, setReady]       = useState(false);

  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const stateRef  = useRef({
    imgEl: null,
    imgX: 0, imgY: 0, imgW: 0, imgH: 0,
    box: { x: 0, y: 0, w: 0, h: 0 },
  });

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  // Ctrl+V / colar do clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) { loadFile(item.getAsFile()); break; }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []); // eslint-disable-line

  /* ── Handles de resize ── */
  const getHandleRects = (box) => {
    const s  = 10;
    const hs = s / 2;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    return [
      { dir:"nw", x: box.x - hs,           y: box.y - hs,           size: s },
      { dir:"n",  x: cx - hs,              y: box.y - hs,           size: s },
      { dir:"ne", x: box.x + box.w - hs,   y: box.y - hs,           size: s },
      { dir:"w",  x: box.x - hs,           y: cy - hs,              size: s },
      { dir:"e",  x: box.x + box.w - hs,   y: cy - hs,              size: s },
      { dir:"sw", x: box.x - hs,           y: box.y + box.h - hs,   size: s },
      { dir:"s",  x: cx - hs,              y: box.y + box.h - hs,   size: s },
      { dir:"se", x: box.x + box.w - hs,   y: box.y + box.h - hs,   size: s },
    ];
  };

  /* ── Desenha tudo no canvas ── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { imgEl, imgX, imgY, imgW, imgH, box } = stateRef.current;
    if (!imgEl) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Imagem
    ctx.drawImage(imgEl, imgX, imgY, imgW, imgH);

    // Overlay escuro nas 4 bordas fora do crop
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(imgX, imgY, imgW, box.y - imgY);                                        // topo
    ctx.fillRect(imgX, box.y + box.h, imgW, (imgY + imgH) - (box.y + box.h));            // baixo
    ctx.fillRect(imgX, box.y, box.x - imgX, box.h);                                       // esquerda
    ctx.fillRect(box.x + box.w, box.y, (imgX + imgW) - (box.x + box.w), box.h);          // direita

    // Borda do crop
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // Guias dos terços
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    [1/3, 2/3].forEach(p => {
      ctx.beginPath(); ctx.moveTo(box.x + box.w * p, box.y);   ctx.lineTo(box.x + box.w * p, box.y + box.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(box.x, box.y + box.h * p);   ctx.lineTo(box.x + box.w, box.y + box.h * p); ctx.stroke();
    });

    // Handles
    ctx.fillStyle = "white";
    getHandleRects(box).forEach(h => ctx.fillRect(h.x, h.y, h.size, h.size));
  }, []);

  /* ── Clamp box dentro da imagem ── */
  const clampBox = useCallback((x, y, w) => {
    const { imgX, imgY, imgW, imgH } = stateRef.current;
    const minW = 60;
    const maxW = Math.min(imgW, imgH * ASPECT_W / ASPECT_H);
    const cW   = Math.max(minW, Math.min(w, maxW));
    const cH   = cW * ASPECT_H / ASPECT_W;
    const cX   = Math.max(imgX, Math.min(x, imgX + imgW - cW));
    const cY   = Math.max(imgY, Math.min(y, imgY + imgH - cH));
    return { x: cX, y: cY, w: cW, h: cH };
  }, []);

  /* ── Layout: encaixa a imagem no canvas ── */
  const layoutImage = useCallback((imgEl) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const cW = canvas.width;
    const cH = canvas.height;
    const ratio = Math.min(cW / imgEl.naturalWidth, cH / imgEl.naturalHeight);
    const imgW  = imgEl.naturalWidth  * ratio;
    const imgH  = imgEl.naturalHeight * ratio;
    const imgX  = (cW - imgW) / 2;
    const imgY  = (cH - imgH) / 2;

    const boxW = Math.min(imgW * 0.8, imgH * 0.8 * ASPECT_W / ASPECT_H);
    const boxH = boxW * ASPECT_H / ASPECT_W;
    const box  = {
      x: imgX + (imgW - boxW) / 2,
      y: imgY + (imgH - boxH) / 2,
      w: boxW,
      h: boxH,
    };

    stateRef.current = { imgEl, imgX, imgY, imgW, imgH, box };
    draw();
    setReady(true);
  }, [draw]);

  /* ── Sincroniza canvas.width/height com o offsetWidth/offsetHeight ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (stateRef.current.imgEl) layoutImage(stateRef.current.imgEl);
    };
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    sync();
    return () => ro.disconnect();
  }, [layoutImage]);

  /* ── Carrega imagem quando src muda ── */
  useEffect(() => {
    if (!imageSrc) { setReady(false); stateRef.current.imgEl = null; return; }
    setReady(false);
    const img = new window.Image();
    img.onload = () => requestAnimationFrame(() => layoutImage(img));
    img.src = imageSrc;
  }, [imageSrc, layoutImage]);

  /* ── Hit test ── */
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // Escala: canvas pode ter resolução diferente do tamanho CSS
    const scaleX = canvasRef.current.width  / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const hitHandle = (px, py) => {
    for (const h of getHandleRects(stateRef.current.box)) {
      if (px >= h.x && px <= h.x + h.size && py >= h.y && py <= h.y + h.size) return h.dir;
    }
    return null;
  };

  const hitBox = (px, py) => {
    const { box } = stateRef.current;
    return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
  };

  /* ── Mouse down no canvas ── */
  const onMouseDown = useCallback((e) => {
    if (!ready) return;
    const { x, y } = getCanvasPos(e);
    const dir = hitHandle(x, y);
    if (dir) {
      dragRef.current = { type: "resize", dir, startX: x, startY: y, origBox: { ...stateRef.current.box } };
    } else if (hitBox(x, y)) {
      dragRef.current = { type: "move",   startX: x, startY: y, origBox: { ...stateRef.current.box } };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* ── Mouse move / up globais ── */
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragRef.current || !canvasRef.current) return;
      const rect   = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width  / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top)  * scaleY;
      const { type, dir, startX, startY, origBox } = dragRef.current;
      const dx = px - startX;
      const dy = py - startY;
      const minW = 60;
      let { x, y, w } = { x: origBox.x, y: origBox.y, w: origBox.w };

      if (type === "move") {
        stateRef.current.box = clampBox(origBox.x + dx, origBox.y + dy, origBox.w);
      } else {
        if (dir === "e"  || dir === "se") { w = Math.max(minW, origBox.w + dx); }
        if (dir === "w"  || dir === "nw") { w = Math.max(minW, origBox.w - dx); x = origBox.x + origBox.w - w; }
        if (dir === "sw")                 { w = Math.max(minW, origBox.w + dx); }
        if (dir === "s")                  { w = Math.max(minW, (origBox.h + dy) * ASPECT_W / ASPECT_H); }
        if (dir === "n")                  { w = Math.max(minW, (origBox.h - dy) * ASPECT_W / ASPECT_H); y = origBox.y + origBox.h - w * ASPECT_H / ASPECT_W; }
        if (dir === "ne")                 { w = Math.max(minW, origBox.w + dx); y = origBox.y + origBox.h - w * ASPECT_H / ASPECT_W; }
        if (dir === "nw")                 { w = Math.max(minW, origBox.w - dx); x = origBox.x + origBox.w - w; y = origBox.y + origBox.h - w * ASPECT_H / ASPECT_W; }
        stateRef.current.box = clampBox(x, y, w);
      }
      draw();
    };

    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [clampBox, draw]);

  /* ── Cursor dinâmico ── */
  const onMouseMoveCanvas = useCallback((e) => {
    if (!ready || !canvasRef.current) return;
    const { x, y } = getCanvasPos(e);
    const dir = hitHandle(x, y);
    const cursorMap = {
      nw:"nw-resize", n:"n-resize", ne:"ne-resize",
      w:"w-resize",                  e:"e-resize",
      sw:"sw-resize", s:"s-resize", se:"se-resize",
    };
    canvasRef.current.style.cursor = dir ? cursorMap[dir] : hitBox(x, y) ? "move" : "default";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* ── Confirmar crop ── */
  const handleConfirm = () => {
    const { imgEl, imgX, imgY, imgW, imgH, box } = stateRef.current;
    if (!imgEl) return;
    const scaleX = imgEl.naturalWidth  / imgW;
    const scaleY = imgEl.naturalHeight / imgH;
    const cropX  = (box.x - imgX) * scaleX;
    const cropY  = (box.y - imgY) * scaleY;
    const cropW  = box.w * scaleX;
    const cropH  = box.h * scaleY;
    const out    = document.createElement("canvas");
    out.width    = OUT_W;
    out.height   = OUT_H;
    out.getContext("2d").drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, OUT_W, OUT_H);
    onConfirm(out.toDataURL("image/jpeg", 0.92));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-capa">
        <div className="modal-header">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          {!imageSrc ? (
            <>
              <label className="select-image-btn">
                Selecionar Imagem
                <input type="file" accept="image/*" onChange={(e) => loadFile(e.target.files[0])} style={{ display: "none" }} />
              </label>
              <p className="paste-hint">ou cole com <kbd>Ctrl+V</kbd></p>
            </>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMoveCanvas}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          )}
        </div>

        {imageSrc && (
          <div className="modal-footer">
            <button className="reselect-btn" onClick={() => { setImageSrc(null); setReady(false); }}>
              Escolher outra imagem
            </button>
            <button className="confirm-btn" onClick={handleConfirm}>
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCropModalCapa;