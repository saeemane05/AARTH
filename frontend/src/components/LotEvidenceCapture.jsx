import { useEffect, useRef, useState } from "react";

function readLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location access is required for verified lot evidence."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        gps_accuracy: position.coords.accuracy,
      }),
      (error) => reject(new Error(error.code === 1
        ? "Location access is required for verified lot evidence."
        : "Unable to capture your current location. Please move to an area with better GPS visibility and try again.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function LotEvidenceCapture({ evidence, setEvidence }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retakeIndex, setRetakeIndex] = useState(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const attachStream = () => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  };

  const start = async () => {
    setBusy(true);
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported by this browser. Camera permission is required for verified lot evidence.");
      setBusy(false);
      return;
    }
    try {
      const currentLocation = await readLocation();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setLocation(currentLocation);
      setOpen(true);
      requestAnimationFrame(attachStream);
    } catch (reason) {
      setError(reason.message || "Camera permission is required for verified lot evidence.");
    } finally {
      setBusy(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !location) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("The camera could not process this photo. Please try again.");
        return;
      }
      const item = {
        blob,
        preview: URL.createObjectURL(blob),
        captured_at_client: new Date().toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        gps_accuracy: location.gps_accuracy,
        capture_source: "aarth_camera",
      };
      setEvidence((current) => {
        const next = [...current];
        if (retakeIndex === null) next.push(item);
        else {
          URL.revokeObjectURL(next[retakeIndex]?.preview);
          next[retakeIndex] = item;
        }
        return next;
      });
      setRetakeIndex(null);
      setError("");
    }, "image/jpeg", 0.88);
  };

  const close = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setOpen(false);
    setRetakeIndex(null);
  };

  const remove = (index) => {
    setEvidence((current) => {
      URL.revokeObjectURL(current[index]?.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const retake = (index) => {
    setRetakeIndex(index);
    start();
  };

  return <section className="lot-evidence-panel">
    <div className="lot-evidence-heading">
      <div><span className="lot-eyebrow">LOT EVIDENCE</span><h2>Required before publishing</h2><p>Capture 4–5 photos of your actual produce inside AARTH.</p></div>
      <strong>{evidence.length}/4 required</strong>
    </div>
    {!open ? <>
      <button type="button" className="lot-camera-button" onClick={start} disabled={busy}>{busy ? "Opening camera..." : "📷 Capture Lot Photos"}</button>
      <div className="lot-evidence-meta"><span>Location: {location ? "✓ Captured" : "Not captured"}</span><span>Evidence: {evidence.length}/5</span></div>
    </> : <div className="lot-camera-flow">
      <div className="lot-camera-top"><strong>Capture Lot Evidence</strong><span>Photo {Math.min(evidence.length + 1, 5)} of 5</span></div>
      <video ref={videoRef} className="lot-camera-preview" playsInline muted />
      <p className="lot-location-status">Location ✓ Captured <small>Accuracy ±{Math.round(location?.gps_accuracy || 0)} m</small></p>
      <div className="lot-camera-actions"><button type="button" className="lot-camera-shutter" onClick={capture} disabled={evidence.length >= 5}>Capture Photo</button><button type="button" className="lot-secondary-button" onClick={close}>Done</button></div>
    </div>}
    {error && <p className="lot-evidence-error">{error}</p>}
    <div className="lot-evidence-previews">{evidence.map((item, index) => <figure key={`${item.captured_at_client}-${index}`}><img src={item.preview} alt={`Lot evidence ${index + 1}`} /><figcaption>Photo {index + 1} ✓<button type="button" onClick={() => retake(index)}>Retake</button><button type="button" onClick={() => remove(index)}>Remove</button></figcaption></figure>)}</div>
    <canvas ref={canvasRef} hidden />
  </section>;
}
