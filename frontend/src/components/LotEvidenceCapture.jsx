import { useEffect, useRef, useState } from "react";
import { getAarthCropCategory } from "../data/farmerCropMaster";

function readLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location access is required for verified lot evidence."));
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, gps_accuracy: position.coords.accuracy }),
      (error) => reject(new Error(error.code === 1 ? "Location access is required for verified lot evidence." : "Unable to capture your current location. Please move to an area with better GPS visibility and try again.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function LotEvidenceCapture({ evidence, setEvidence, commodityKey }) {
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), recorderRef = useRef(null), recordedChunks = useRef([]), recordingTimer = useRef(null);
  const [open, setOpen] = useState(false), [location, setLocation] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [retakeIndex, setRetakeIndex] = useState(null), [mode, setMode] = useState("photo"), [recording, setRecording] = useState(false);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); clearTimeout(recordingTimer.current); }, []);
  const attachStream = () => { if (videoRef.current && streamRef.current) { videoRef.current.srcObject = streamRef.current; videoRef.current.play().catch(() => {}); } };
  const start = async (nextMode = "photo") => {
    setBusy(true); setError("");
    if (!navigator.mediaDevices?.getUserMedia) { setError("Camera access is not supported by this browser. Camera permission is required for verified lot evidence."); setBusy(false); return; }
    try { const currentLocation = await readLocation(); const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: nextMode === "video" }); streamRef.current = stream; setLocation(currentLocation); setMode(nextMode); setOpen(true); requestAnimationFrame(attachStream); }
    catch (reason) { setError(reason.message || "Camera permission is required for verified lot evidence."); } finally { setBusy(false); }
  };
  const capture = () => {
    const video = videoRef.current, canvas = canvasRef.current; if (!video || !canvas || !location) return;
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720; canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => { if (!blob) { setError("The camera could not process this photo. Please try again."); return; } const item = { blob, preview: URL.createObjectURL(blob), captured_at_client: new Date().toISOString(), latitude: location.latitude, longitude: location.longitude, gps_accuracy: location.gps_accuracy, capture_source: "aarth_camera", media_type: "photo" }; setEvidence((current) => retakeIndex === null ? [...current, item] : current.map((entry, index) => index === retakeIndex ? item : entry)); setRetakeIndex(null); setError(""); }, "image/jpeg", 0.88);
  };
  const toggleRecording = () => {
    if (!location || !streamRef.current) return; if (recording) { recorderRef.current?.stop(); return; }
    if (!window.MediaRecorder) { setError("Video recording is not supported by this browser."); return; }
    recordedChunks.current = []; const mimeType = MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : ""; const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined); recorderRef.current = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size) recordedChunks.current.push(event.data); };
    recorder.onstop = () => { const blob = new Blob(recordedChunks.current, { type: recorder.mimeType || "video/webm" }); if (blob.size) { const item = { blob, preview: URL.createObjectURL(blob), captured_at_client: new Date().toISOString(), latitude: location.latitude, longitude: location.longitude, gps_accuracy: location.gps_accuracy, capture_source: "aarth_camera", media_type: "video" }; setEvidence((current) => retakeIndex === null ? [...current.filter((entry) => entry.media_type !== "video"), item] : current.map((entry, index) => index === retakeIndex ? item : entry)); } setRetakeIndex(null); setRecording(false); clearTimeout(recordingTimer.current); };
    recorder.start(); setRecording(true); recordingTimer.current = setTimeout(() => recorder.state === "recording" && recorder.stop(), 60000);
  };
  const close = () => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); clearTimeout(recordingTimer.current); setRecording(false); streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setOpen(false); setRetakeIndex(null); };
  const remove = (index) => setEvidence((current) => { URL.revokeObjectURL(current[index]?.preview); return current.filter((_, itemIndex) => itemIndex !== index); });
  const retake = (index) => { setRetakeIndex(index); start(evidence[index]?.media_type === "video" ? "video" : "photo"); };
  const grainGuidance = ["Cereals & Grains", "Pulses & Legumes"].includes(getAarthCropCategory(commodityKey));
  const photoCount = evidence.filter((item) => item.media_type !== "video").length;
  return <section className="lot-evidence-panel">
    <div className="lot-evidence-heading"><div><span className="lot-eyebrow">LOT EVIDENCE</span><h2>Required before publishing</h2><p>Capture representative photos of the lot. These are physical evidence, not laboratory certification.</p></div><strong>{photoCount}/4 photos required</strong></div>
    {!open ? <><div className="lot-evidence-guidance"><strong>Photo guidance</strong>{grainGuidance ? <ul><li>Overall lot, container or bag view</li><li>Representative grain or pulse sample</li><li>Close-up of quality and appearance</li><li>Additional representative view</li></ul> : <ul><li>Smaller-size representative produce</li><li>Typical-size representative produce</li><li>Larger-size representative produce</li><li>Overall lot view</li><li>Optional additional close-up</li></ul>}</div><div className="lot-evidence-actions"><button type="button" className="lot-camera-button" onClick={() => start("photo")} disabled={busy || photoCount >= 5}>{busy ? "Opening camera..." : "Capture Photo"}</button><button type="button" className="lot-secondary-button" onClick={() => start("video")} disabled={busy || evidence.some((item) => item.media_type === "video")}>Record Video</button></div><p className="lot-video-help">Optional: record one short representative lot video (up to 60 seconds).</p><div className="lot-evidence-meta"><span>Location: {location ? "Captured" : "Captured when camera opens"}</span><span>Photos: {photoCount}/5</span></div></> : <div className="lot-camera-flow"><div className="lot-camera-top"><strong>{mode === "video" ? "Record lot video" : "Capture Lot Evidence"}</strong><span>{mode === "video" ? "60 seconds maximum" : `Photo ${Math.min(photoCount + 1, 5)} of 5`}</span></div><video ref={videoRef} className="lot-camera-preview" playsInline muted /><p className="lot-location-status">Location captured <small>Accuracy +/-{Math.round(location?.gps_accuracy || 0)} m</small></p><div className="lot-camera-actions">{mode === "video" ? <button type="button" className="lot-camera-shutter" onClick={toggleRecording}>{recording ? "Stop recording" : "Start recording"}</button> : <button type="button" className="lot-camera-shutter" onClick={capture} disabled={photoCount >= 5}>Capture Photo</button>}<button type="button" className="lot-secondary-button" onClick={close}>Done</button></div></div>}
    {error && <p className="lot-evidence-error">{error}</p>}<div className="lot-evidence-previews">{evidence.map((item, index) => <figure key={`${item.captured_at_client}-${index}`}>{item.media_type === "video" ? <video src={item.preview} controls playsInline /> : <img src={item.preview} alt={`Lot evidence ${index + 1}`} />}<figcaption>{item.media_type === "video" ? "Video" : `Photo ${evidence.slice(0, index + 1).filter((entry) => entry.media_type !== "video").length}`}<button type="button" onClick={() => retake(index)}>Retake</button><button type="button" onClick={() => remove(index)}>Remove</button></figcaption></figure>)}</div><canvas ref={canvasRef} hidden />
  </section>;
}
