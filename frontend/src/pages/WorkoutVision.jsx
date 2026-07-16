import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, RotateCcw, AlertTriangle } from "lucide-react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import ParticleBurst from "../components/ParticleBurst";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const LM = {
  LEFT_SHOULDER: 11,
  LEFT_ELBOW: 13,
  LEFT_WRIST: 15,
  LEFT_HIP: 23,
  LEFT_KNEE: 25,
  LEFT_ANKLE: 27,
};

const CONNECTIONS = [
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 12],
  [23, 24],
  [11, 23], [12, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28],
];

// Depth sensitivity now controls how far INTO your own observed range of
// motion you need to travel to trigger a counted rep — not a fixed degree
// value. engageFrac = fraction of your range you must cover from the "easy"
// end before it counts as engaged.
const DEPTH_PRESETS = {
  beginner: { label: "Beginner (half reps OK)", engageFrac: 0.4 },
  standard: { label: "Standard", engageFrac: 0.2 },
  strict: { label: "Strict (full range)", engageFrac: 0.05 },
};

// releaseFrac is fixed (not affected by sensitivity) — "did you return
// toward the start" shouldn't depend on how deep a rep needs to be.
const RELEASE_FRAC = 0.3;
// Threshold that always earns the "great form" message regardless of the
// active sensitivity preset, so praise stays meaningful.
const GOOD_DEPTH_FRAC = 0.15;
// Minimum observed range (degrees) before we trust it enough to count reps —
// avoids counting from pose jitter before the person has actually moved.
const MIN_RANGE_DEG = 20;
// How fast the observed min/max slowly drift back toward the current angle,
// so a single outlier reading doesn't permanently distort calibration and
// the system can adapt if you change distance/angle to the camera.
const CALIBRATION_DECAY = 0.002;

const EXERCISES = {
  squat: {
    label: "Squat",
    tip: "Face the camera from the side.",
    joints: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
    engageFeedback: "Good — keep sinking",
    depthWarning: "Rep counted — go a little lower next time for full depth",
    goodRep: "Nice depth!",
  },
  pushup: {
    label: "Push-up",
    tip: "Face the camera from the side.",
    joints: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
    engageFeedback: "Good — keep lowering",
    depthWarning: "Rep counted — try lowering your chest further next time",
    goodRep: "Solid rep!",
  },
  lunge: {
    label: "Lunge",
    tip: "Face the camera from the side, front leg visible.",
    joints: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
    engageFeedback: "Good — keep dropping that back knee",
    depthWarning: "Rep counted — a deeper drop works the legs more",
    goodRep: "Great lunge depth!",
  },
};

// IMPORTANT: a/b/c must be in a uniform coordinate space (pixels), not raw
// normalized [0,1] landmark coords — x and y scale differently (video isn't
// square), which skews angles depending on limb orientation.
function angleBetween(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAb = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCb = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAb === 0 || magCb === 0) return 180;
  const cos = Math.min(1, Math.max(-1, dot / (magAb * magCb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function toPixel(p, width, height) {
  return { x: p.x * width, y: p.y * height };
}

function freshRepState() {
  return {
    phase: "start",
    smoothedAngle: null,
    minSeen: null,
    maxSeen: null,
    extremeAngleThisRep: null,
  };
}

export default function WorkoutVision() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const repStateRef = useRef(freshRepState());

  const [exerciseKey, setExerciseKey] = useState("squat");
  const [depthKey, setDepthKey] = useState("beginner");
  const [cameraOn, setCameraOn] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [modelError, setModelError] = useState("");
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Get in frame and start moving");
  const [burstCount, setBurstCount] = useState(0);
  const [debugAngle, setDebugAngle] = useState(null);
  const [debugRange, setDebugRange] = useState(null);
  const [poseDetected, setPoseDetected] = useState(false);
  const [calibrated, setCalibrated] = useState(false);

  const exercise = EXERCISES[exerciseKey];
  const depthPreset = DEPTH_PRESETS[depthKey];

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setLoadingModel(true);
    setModelError("");
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      landmarkerRef.current = landmarker;
      return landmarker;
    } catch (err) {
      setModelError(
        "Could not load the pose model. Check your internet connection (the model loads from Google's CDN) and try again."
      );
      throw err;
    } finally {
      setLoadingModel(false);
    }
  };

  const startCamera = async () => {
    try {
      await ensureLandmarker();
    } catch {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setReps(0);
      setCalibrated(false);
      repStateRef.current = freshRepState();
      setFeedback("Move through the full exercise once so I can calibrate to you");
      loop();
    } catch (err) {
      setModelError("Camera access denied or unavailable. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setPoseDetected(false);
    setDebugAngle(null);
    setDebugRange(null);
  };

  const resetReps = () => {
    setReps(0);
    setCalibrated(false);
    repStateRef.current = freshRepState();
    setFeedback("Move through the full exercise once so I can calibrate to you");
  };

  const loop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      const nowMs = performance.now();
      const result = landmarker.detectForVideo(video, nowMs);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pose = result.landmarks && result.landmarks[0];
      setPoseDetected(!!pose);
      if (pose) {
        drawSkeleton(ctx, pose, canvas.width, canvas.height);
        evaluateRep(pose, canvas.width, canvas.height);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  const drawSkeleton = (ctx, pose, width, height) => {
    ctx.strokeStyle = "#E31B3D";
    ctx.lineWidth = 3;
    CONNECTIONS.forEach(([aIdx, bIdx]) => {
      const a = pose[aIdx];
      const b = pose[bIdx];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    });
    ctx.fillStyle = "#FF5F6D";
    pose.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const evaluateRep = (pose, width, height) => {
    const [aIdx, bIdx, cIdx] = exercise.joints;
    const a = pose[aIdx];
    const b = pose[bIdx];
    const c = pose[cIdx];
    if (!a || !b || !c) return;

    const rawAngle = angleBetween(
      toPixel(a, width, height),
      toPixel(b, width, height),
      toPixel(c, width, height)
    );

    const state = repStateRef.current;

    state.smoothedAngle =
      state.smoothedAngle == null ? rawAngle : state.smoothedAngle * 0.7 + rawAngle * 0.3;
    const angle = state.smoothedAngle;
    setDebugAngle(Math.round(angle));

    if (state.minSeen == null) {
      state.minSeen = angle;
      state.maxSeen = angle;
    } else {
      state.maxSeen =
        angle > state.maxSeen ? angle : state.maxSeen - (state.maxSeen - angle) * CALIBRATION_DECAY;
      state.minSeen =
        angle < state.minSeen ? angle : state.minSeen + (angle - state.minSeen) * CALIBRATION_DECAY;
    }

    const range = state.maxSeen - state.minSeen;
    setDebugRange(Math.round(range));

    if (range < MIN_RANGE_DEG) {
      setCalibrated(false);
      return;
    }
    if (!calibrated) setCalibrated(true);

    const engageFrac = depthPreset.engageFrac;

    const engageAngle = exercise.reverse
      ? state.maxSeen - range * engageFrac
      : state.minSeen + range * engageFrac;
    const releaseAngle = exercise.reverse
      ? state.minSeen + range * RELEASE_FRAC
      : state.maxSeen - range * RELEASE_FRAC;
    const goodDepthAngle = exercise.reverse
      ? state.maxSeen - range * GOOD_DEPTH_FRAC
      : state.minSeen + range * GOOD_DEPTH_FRAC;

    if (state.extremeAngleThisRep == null) state.extremeAngleThisRep = angle;
    state.extremeAngleThisRep = exercise.reverse
      ? Math.max(state.extremeAngleThisRep, angle)
      : Math.min(state.extremeAngleThisRep, angle);

    const reachedEngage = exercise.reverse ? angle >= engageAngle : angle <= engageAngle;
    const reachedRelease = exercise.reverse ? angle <= releaseAngle : angle >= releaseAngle;

    if (state.phase === "start" && reachedEngage) {
      state.phase = "engaged";
      setFeedback(exercise.engageFeedback);
    } else if (state.phase === "engaged" && reachedRelease) {
      state.phase = "start";
      const reachedGoodDepth = exercise.reverse
        ? state.extremeAngleThisRep >= goodDepthAngle
        : state.extremeAngleThisRep <= goodDepthAngle;
      setReps((r) => {
        const next = r + 1;
        if (next % 10 === 0) setBurstCount((b) => b + 1);
        return next;
      });
      setFeedback(reachedGoodDepth ? exercise.goodRep : exercise.depthWarning);
      state.extremeAngleThisRep = null;
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm uppercase tracking-widest text-blood">Form Check</p>
        <h1 className="font-display text-4xl font-semibold">Computer Vision Rep Counter</h1>
        <p className="mt-2 max-w-2xl text-steel">
          Uses your webcam and on-device pose estimation (nothing is uploaded anywhere) to count
          reps and give live form feedback. {exercise.tip}
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(EXERCISES).map(([key, ex]) => (
          <button
            key={key}
            onClick={() => {
              setExerciseKey(key);
              resetReps();
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              exerciseKey === key
                ? "border-blood bg-blood/15 text-ember"
                : "border-line bg-panel/70 text-steel hover:border-blood/60"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-steel">Depth Sensitivity</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(DEPTH_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => {
                setDepthKey(key);
                resetReps();
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                depthKey === key
                  ? "border-blood bg-blood/15 text-ember"
                  : "border-line bg-panel/70 text-steel hover:border-blood/60"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="mt-2 max-w-2xl text-xs text-steel">
          The tracker calibrates to your own range of motion as you move — do one full rep to
          start, then it'll count from there. Sensitivity only changes how far into that range
          you need to go for a rep to count. Not everyone can hit full range every time, and
          that's fine.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="relative lg:col-span-2 overflow-hidden rounded-2xl border border-line bg-panel/70 p-4">
          <ParticleBurst trigger={burstCount} />
          <div className="relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-xl bg-void">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />

            {cameraOn && (
              <div className="absolute left-3 top-3 rounded-md bg-void/70 px-2 py-1 text-xs text-steel">
                {poseDetected ? (
                  <span>
                    Angle: <span className="text-ember">{debugAngle ?? "—"}°</span> · Range:{" "}
                    <span className={calibrated ? "text-ember" : "text-blood"}>
                      {debugRange ?? "—"}°
                    </span>{" "}
                    {!calibrated && "(keep moving to calibrate)"}
                  </span>
                ) : (
                  <span className="text-blood">No pose detected — step back or improve lighting</span>
                )}
              </div>
            )}

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/80 text-center">
                {loadingModel ? (
                  <p className="text-sm text-steel">Loading pose model…</p>
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-blood" />
                    <p className="max-w-xs text-sm text-steel">
                      Start the camera to begin tracking your reps.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {modelError && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-blood/40 bg-blood/10 px-3 py-2 text-sm text-ember">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{modelError}</span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            {!cameraOn ? (
              <button
                onClick={startCamera}
                disabled={loadingModel}
                className="flex items-center gap-2 rounded-lg bg-blood px-6 py-3 font-display font-medium tracking-wide text-bone transition-all hover:bg-ember hover:shadow-glowRed disabled:opacity-60"
              >
                <Camera className="h-5 w-5" />
                {loadingModel ? "Loading…" : "Start Camera"}
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 rounded-lg border border-line px-6 py-3 text-steel transition-colors hover:border-blood hover:text-ember"
              >
                <CameraOff className="h-5 w-5" /> Stop Camera
              </button>
            )}
            <button
              onClick={resetReps}
              className="flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-steel transition-colors hover:border-blood hover:text-ember"
            >
              <RotateCcw className="h-4 w-4" /> Reset Count
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel/70 p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-steel">{exercise.label} Reps</p>
          <motion.p
            key={reps}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="mt-2 font-display text-7xl font-semibold text-blood"
          >
            {reps}
          </motion.p>

          <div className="mt-6 rounded-lg border border-line bg-void/40 p-4">
            <p className="text-sm text-bone">{feedback}</p>
          </div>

          <p className="mt-6 text-xs text-steel">
            All processing happens locally in your browser — no video is sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
}