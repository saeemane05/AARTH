import { useEffect, useRef, useState } from "react";
import { getAarthCropCategory } from "../data/farmerCropMaster";

function readLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location access is required for verified lot evidence."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          gps_accuracy: position.coords.accuracy,
        }),
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? "Location access is required for verified lot evidence. Allow location access and try again."
              : "Unable to capture your current location. Move to an area with better GPS visibility and try again.",
          ),
        ),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}

export default function LotEvidenceCapture({
  evidence,
  setEvidence,
  commodityKey,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const recordingTimer = useRef(null);

  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retakeIndex, setRetakeIndex] = useState(null);
  const [mode, setMode] = useState("photo");
  const [recording, setRecording] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      clearTimeout(recordingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !videoRef.current || !streamRef.current) return undefined;

    const video = videoRef.current;
    const stream = streamRef.current;
    video.srcObject = stream;

    const startPlayback = async () => {
      try {
        await video.play();
        setVideoReady(video.videoWidth > 0 && video.videoHeight > 0);
      } catch {
        setVideoReady(false);
        setError(
          "Camera opened but the video preview could not start. Check browser camera permissions and try again.",
        );
      }
    };

    video.addEventListener("loadedmetadata", startPlayback);
    if (video.readyState >= 1) startPlayback();

    return () => {
      video.removeEventListener("loadedmetadata", startPlayback);
    };
  }, [open, mode]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setVideoReady(false);
  };

  const start = async (nextMode = "photo") => {
    setBusy(true);
    setError("");
    setMode(nextMode);
    setVideoReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access is not available in this browser. Use a current Chrome, Edge or Firefox browser on localhost or HTTPS.",
      );
      setBusy(false);
      return;
    }

    stopStream();

    try {
      // Do not request microphone access. A microphone permission failure can
      // otherwise prevent video capture even when the camera itself works.
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstError) {
        // Some desktop cameras reject the facingMode constraint. Retry with
        // a plain video constraint before reporting a camera failure.
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setOpen(true);

      try {
        setLocation(await readLocation());
      } catch (locationError) {
        setLocation(null);
        setError(
          locationError.message ||
            "Camera opened, but fresh GPS could not be captured. Enable location before publishing.",
        );
      }
    } catch (reason) {
      if (reason?.name === "NotAllowedError" || reason?.name === "SecurityError") {
        setError(
          "Camera permission was denied or blocked. In Chrome, click the camera icon beside the address bar, allow Camera for this site, then reload the page.",
        );
      } else if (reason?.name === "NotFoundError") {
        setError("No camera was found. Connect or enable a camera and try again.");
      } else if (reason?.name === "NotReadableError") {
        setError(
          "The camera is already being used by another application. Close Teams, Zoom, Camera or another browser tab and try again.",
        );
      } else {
        setError(reason?.message || "Camera permission is required for lot evidence.");
      }
    } finally {
      setBusy(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!location) {
      setError("Fresh GPS is required before capturing lot evidence.");
      return;
    }

    if (!video || !canvas || !videoReady || video.videoWidth <= 0) {
      setError("The camera preview is not ready yet. Wait a moment and try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
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
          media_type: "photo",
        };

        setEvidence((current) =>
          retakeIndex === null
            ? [...current, item]
            : current.map((entry, index) =>
                index === retakeIndex ? item : entry,
              ),
        );
        setRetakeIndex(null);
        setError("");
      },
      "image/jpeg",
      0.88,
    );
  };

  const toggleRecording = () => {
    if (!location || !streamRef.current) {
      setError("Fresh GPS and an active camera are required before recording.");
      return;
    }

    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    if (!window.MediaRecorder) {
      setError("Video recording is not supported by this browser.");
      return;
    }

    recordedChunks.current = [];

    const preferredMimeTypes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType = preferredMimeTypes.find((type) =>
      MediaRecorder.isTypeSupported(type),
    );

    try {
      const recorder = new MediaRecorder(
        streamRef.current,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordedChunks.current.push(event.data);
      };

      recorder.onerror = () => {
        setRecording(false);
        setError("The browser could not record this video. Please try again.");
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, {
          type: recorder.mimeType || "video/webm",
        });

        if (blob.size) {
          const item = {
            blob,
            preview: URL.createObjectURL(blob),
            captured_at_client: new Date().toISOString(),
            latitude: location.latitude,
            longitude: location.longitude,
            gps_accuracy: location.gps_accuracy,
            capture_source: "aarth_camera",
            media_type: "video",
          };

          setEvidence((current) =>
            retakeIndex === null
              ? [...current.filter((entry) => entry.media_type !== "video"), item]
              : current.map((entry, index) =>
                  index === retakeIndex ? item : entry,
                ),
          );
        }

        setRetakeIndex(null);
        setRecording(false);
        clearTimeout(recordingTimer.current);
      };

      recorder.start(250);
      setRecording(true);
      recordingTimer.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 60000);
    } catch (reason) {
      setError(reason.message || "Unable to start video recording.");
    }
  };

  const close = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    clearTimeout(recordingTimer.current);
    setRecording(false);
    stopStream();
    setOpen(false);
    setRetakeIndex(null);
  };

  const remove = (index) =>
    setEvidence((current) => {
      URL.revokeObjectURL(current[index]?.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });

  const retake = (index) => {
    setRetakeIndex(index);
    start(evidence[index]?.media_type === "video" ? "video" : "photo");
  };

  const grainGuidance = ["Cereals & Grains", "Pulses & Legumes"].includes(
    getAarthCropCategory(commodityKey),
  );
  const photoCount = evidence.filter((item) => item.media_type !== "video").length;

  return (
    <section className="lot-evidence-panel">
      <div className="lot-evidence-heading">
        <div>
          <span className="lot-eyebrow">LOT EVIDENCE</span>
          <h2>Required before publishing</h2>
          <p>
            Capture representative photos of the lot. These are physical
            evidence, not laboratory certification.
          </p>
        </div>
        <strong>{photoCount}/4 photos required</strong>
      </div>

      {!open ? (
        <>
          <div className="lot-evidence-guidance">
            <strong>Photo guidance</strong>
            {grainGuidance ? (
              <ul>
                <li>Overall lot, container or bag view</li>
                <li>Representative grain or pulse sample</li>
                <li>Close-up of quality and appearance</li>
                <li>Additional representative view</li>
              </ul>
            ) : (
              <ul>
                <li>Smaller-size representative produce</li>
                <li>Typical-size representative produce</li>
                <li>Larger-size representative produce</li>
                <li>Overall lot view</li>
                <li>Optional additional close-up</li>
              </ul>
            )}
          </div>

          <div className="lot-evidence-actions">
            <button
              type="button"
              className="lot-camera-button"
              onClick={() => start("photo")}
              disabled={busy || photoCount >= 5}
            >
              {busy ? "Opening camera..." : "Capture Photo"}
            </button>
            <button
              type="button"
              className="lot-secondary-button"
              onClick={() => start("video")}
              disabled={busy || evidence.some((item) => item.media_type === "video")}
            >
              Record Video
            </button>
          </div>
          <p className="lot-video-help">
            Optional: record one short representative lot video (up to 60
            seconds). AARTH requests camera only; microphone access is not
            required.
          </p>
          <div className="lot-evidence-meta">
            <span>Fresh GPS: captured when camera opens</span>
            <span>Photos: {photoCount}/5</span>
          </div>
        </>
      ) : (
        <div className="lot-camera-flow">
          <div className="lot-camera-top">
            <strong>
              {mode === "video" ? "Record lot video" : "Capture Lot Evidence"}
            </strong>
            <span>
              {mode === "video"
                ? "60 seconds maximum"
                : `Photo ${Math.min(photoCount + 1, 5)} of 5`}
            </span>
          </div>

          <video
            ref={videoRef}
            className="lot-camera-preview"
            playsInline
            muted
            autoPlay
          />

          <p className="lot-location-status">
            {location
              ? "Fresh location captured"
              : "Waiting for fresh GPS location"}
            {location && (
              <small>
                Accuracy ±{Math.round(location.gps_accuracy || 0)} m
              </small>
            )}
          </p>

          <div className="lot-camera-actions">
            {mode === "video" ? (
              <button
                type="button"
                className="lot-camera-shutter"
                onClick={toggleRecording}
                disabled={!videoReady || !location}
              >
                {recording ? "Stop recording" : "Start recording"}
              </button>
            ) : (
              <button
                type="button"
                className="lot-camera-shutter"
                onClick={capture}
                disabled={photoCount >= 5 || !videoReady || !location}
              >
                Capture Photo
              </button>
            )}
            <button type="button" className="lot-secondary-button" onClick={close}>
              Done
            </button>
          </div>
        </div>
      )}

      {error && <p className="lot-evidence-error">{error}</p>}

      <div className="lot-evidence-previews">
        {evidence.map((item, index) => (
          <figure key={`${item.captured_at_client}-${index}`}>
            {item.media_type === "video" ? (
              <video src={item.preview} controls playsInline />
            ) : (
              <img src={item.preview} alt={`Lot evidence ${index + 1}`} />
            )}
            <figcaption>
              {item.media_type === "video"
                ? "Video"
                : `Photo ${evidence
                    .slice(0, index + 1)
                    .filter((entry) => entry.media_type !== "video").length}`}
              <button type="button" onClick={() => retake(index)}>
                Retake
              </button>
              <button type="button" onClick={() => remove(index)}>
                Remove
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      <canvas ref={canvasRef} hidden />
    </section>
  );
}
