import React, { useState, useRef, useEffect, useCallback } from "react";
import "../styles/ImageCropModal.css";

const ImageCropModal = ({ onConfirm, onClose, src: externalSrc = null, title = "Foto de Perfil" }) => {
  const [imageSrc, setImageSrc] = useState(externalSrc);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [box, setBox] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const containerRef = useRef();
  const dragRef = useRef(null);
  const boxRef = useRef(box);
  const imagePosRef = useRef({ x: 0, y: 0 });
  const imageSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => { boxRef.current = box; }, [box]);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => loadFile(e.target.files[0]);

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

  useEffect(() => {
    if (!imageSrc || !containerRef.current) return;
    const img = new Image();
    img.onload = () => {
      const containerW = containerRef.current.offsetWidth;
      const containerH = containerRef.current.offsetHeight;
      const ratio = Math.min(containerW / img.width, containerH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const imgX = (containerW - w) / 2;
      const imgY = (containerH - h) / 2;
      imageSizeRef.current = { width: w, height: h };
      imagePosRef.current = { x: imgX, y: imgY };
      setImageSize({ width: w, height: h });
      setImagePos({ x: imgX, y: imgY });
      const size = Math.min(w, h) * 0.6;
      const newBox = {
        x: imgX + (w - size) / 2,
        y: imgY + (h - size) / 2,
        width: size,
        height: size,
      };
      setBox(newBox);
      boxRef.current = newBox;
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const clamp = (x, y, size) => {
    const { x: iX, y: iY } = imagePosRef.current;
    const { width: iW, height: iH } = imageSizeRef.current;
    const cSize = Math.min(size, iW, iH);
    const cX = Math.max(iX, Math.min(x, iX + iW - cSize));
    const cY = Math.max(iY, Math.min(y, iY + iH - cSize));
    return { x: cX, y: cY, width: cSize, height: cSize };
  };

  const onMouseDownBox = useCallback((e) => {
    e.preventDefault();
    dragRef.current = { type: "move", startX: e.clientX, startY: e.clientY, origBox: { ...boxRef.current } };
  }, []);

  const onMouseDownHandle = useCallback((e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { type: "resize", dir, startX: e.clientX, startY: e.clientY, origBox: { ...boxRef.current } };
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const { type, dir, startX, startY, origBox } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const minSize = 40;

      if (type === "move") {
        const clamped = clamp(origBox.x + dx, origBox.y + dy, origBox.width);
        setBox(clamped);
        boxRef.current = clamped;
      } else {
        let x = origBox.x;
        let y = origBox.y;
        let size = origBox.width;

        if (dir === "se") { size = Math.max(minSize, origBox.width + Math.max(dx, dy)); }
        if (dir === "sw") { size = Math.max(minSize, origBox.width - Math.min(dx, -dy)); x = origBox.x + origBox.width - size; }
        if (dir === "ne") { size = Math.max(minSize, origBox.width + Math.max(dx, -dy)); y = origBox.y + origBox.height - size; }
        if (dir === "nw") { size = Math.max(minSize, origBox.width - Math.min(dx, dy)); x = origBox.x + origBox.width - size; y = origBox.y + origBox.height - size; }
        if (dir === "e")  { size = Math.max(minSize, origBox.width + dx); }
        if (dir === "w")  { size = Math.max(minSize, origBox.width - dx); x = origBox.x + origBox.width - size; y = origBox.y + origBox.height - size; }
        if (dir === "s")  { size = Math.max(minSize, origBox.height + dy); }
        if (dir === "n")  { size = Math.max(minSize, origBox.height - dy); y = origBox.y + origBox.height - size; x = origBox.x + origBox.width - size; }

        const clamped = clamp(x, y, size);
        setBox(clamped);
        boxRef.current = clamped;
      }
    };

    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handles = [
    { dir: "n",  style: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
    { dir: "s",  style: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
    { dir: "w",  style: { left: -5, top: "50%", transform: "translateY(-50%)", cursor: "w-resize" } },
    { dir: "e",  style: { right: -5, top: "50%", transform: "translateY(-50%)", cursor: "e-resize" } },
    { dir: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
    { dir: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
    { dir: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
    { dir: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
  ];

  const handleConfirm = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const scaleX = img.width / imageSize.width;
      const scaleY = img.height / imageSize.height;
      const cropX = (box.x - imagePos.x) * scaleX;
      const cropY = (box.y - imagePos.y) * scaleY;
      const cropW = box.width * scaleX;
      const cropH = box.height * scaleY;
      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      canvas.getContext("2d").drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      onConfirm(canvas.toDataURL("image/jpeg"));
      onClose();
    };
    img.src = imageSrc;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" ref={containerRef}>
          {!imageSrc ? (
            <>
              <label className="select-image-btn">
                Selecionar Imagem
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
              <p className="paste-hint">ou cole com <kbd>Ctrl+V</kbd></p>
            </>
          ) : (
            <>
              <img
                src={imageSrc}
                alt="preview"
                style={{
                  position: "absolute",
                  width: imageSize.width, height: imageSize.height,
                  top: imagePos.y, left: imagePos.x,
                  userSelect: "none", pointerEvents: "none",
                }}
              />

              <div style={{ position: "absolute", backgroundColor: "rgba(0,0,0,0.6)", pointerEvents: "none",
                left: imagePos.x, top: imagePos.y, width: imageSize.width, height: box.y - imagePos.y }} />
              <div style={{ position: "absolute", backgroundColor: "rgba(0,0,0,0.6)", pointerEvents: "none",
                left: imagePos.x, top: box.y + box.height, width: imageSize.width,
                height: imagePos.y + imageSize.height - (box.y + box.height) }} />
              <div style={{ position: "absolute", backgroundColor: "rgba(0,0,0,0.6)", pointerEvents: "none",
                left: imagePos.x, top: box.y, width: box.x - imagePos.x, height: box.height }} />
              <div style={{ position: "absolute", backgroundColor: "rgba(0,0,0,0.6)", pointerEvents: "none",
                left: box.x + box.width, top: box.y,
                width: imagePos.x + imageSize.width - (box.x + box.width), height: box.height }} />

              <div
                onMouseDown={onMouseDownBox}
                style={{
                  position: "absolute",
                  left: box.x, top: box.y,
                  width: box.width, height: box.height,
                  border: "2px solid white",
                  boxSizing: "border-box",
                  cursor: "move",
                  zIndex: 10,
                }}
              >
                {handles.map(({ dir, style }) => (
                  <div
                    key={dir}
                    onMouseDown={(e) => onMouseDownHandle(e, dir)}
                    style={{
                      position: "absolute",
                      width: 10, height: 10,
                      backgroundColor: "white",
                      border: "1px solid #aaa",
                      borderRadius: 2,
                      zIndex: 20,
                      ...style,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {imageSrc && (
          <div className="modal-footer">
            <button className="reselect-btn" onClick={() => setImageSrc(null)}>Escolher outra imagem</button>
            <button className="confirm-btn" onClick={handleConfirm}>Confirmar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCropModal;