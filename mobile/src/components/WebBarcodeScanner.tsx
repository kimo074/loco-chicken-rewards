import { createElement, useEffect, useRef, useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import jsQR from "jsqr";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";

type WebBarcodeScannerProps = {
  active: boolean;
  onScanned: (data: string) => void;
  style?: ViewStyle;
};

type NativeDetector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };

// Plain literal CSS objects on purpose: these elements are raw DOM nodes
// (not RN-web View/Image), so they need real style objects, not StyleSheet refs.
const videoStyle: Record<string, unknown> = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  backgroundColor: "#000",
  position: "absolute",
  top: 0,
  left: 0,
};
const hiddenStyle: Record<string, unknown> = { display: "none" };

const Video = (props: Record<string, unknown>) => createElement("video", props);
const Canvas = (props: Record<string, unknown>) => createElement("canvas", props);
const FileInput = (props: Record<string, unknown>) => createElement("input", props);

async function createNativeDetector(): Promise<NativeDetector | null> {
  const Ctor = (globalThis as { BarcodeDetector?: any }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const formats: string[] = (await Ctor.getSupportedFormats?.()) ?? [];
    if (!formats.includes("qr_code")) return null;
    return new Ctor({ formats: ["qr_code"] }) as NativeDetector;
  } catch {
    return null;
  }
}

// Downscaling before jsQR is the main speed win: decoding a full 1080p frame
// on a phone takes long enough that the scanner feels unresponsive.
function decodeRegion(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  maxSize: number
): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || sw <= 0 || sh <= 0) return null;
  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  return jsQR(image.data, w, h, { inversionAttempts: "dontInvert" })?.data ?? null;
}

function decodeCenterThenFull(
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  width: number,
  height: number,
  sizes: number[]
): string | null {
  const side = Math.min(width, height) * 0.75;
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;
  for (const size of sizes) {
    const hit =
      decodeRegion(canvas, source, sx, sy, side, side, size) ??
      decodeRegion(canvas, source, 0, 0, width, height, size);
    if (hit) return hit;
  }
  return null;
}

export function WebBarcodeScanner({ active, onScanned, style }: WebBarcodeScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<NativeDetector | null>(null);
  const onScannedRef = useRef(onScanned);
  onScannedRef.current = onScanned;

  const [state, setState] = useState<"idle" | "granted" | "denied" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    createNativeDetector().then((detector) => {
      detectorRef.current = detector;
    });
  }, []);

  async function requestAccess() {
    setErrorDetail(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        // The video element is always mounted, so this should never happen —
        // but if it does, don't strand the user on a black screen.
        stream.getTracks().forEach((track) => track.stop());
        throw new Error(t("scan.cameraNotReady"));
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() ?? {}) as { focusMode?: string[]; torch?: boolean };
      if (capabilities.focusMode?.includes("continuous")) {
        track
          .applyConstraints({ advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet] })
          .catch(() => {});
      }
      setTorchSupported(Boolean(capabilities.torch));

      // Set as real DOM properties, not just JSX attributes: React doesn't
      // always apply `muted` reliably on <video>, and Chrome silently blocks
      // autoplay of unmuted video after an await breaks the user-gesture chain.
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (playErr) {
        setState("error");
        setErrorDetail(playErr instanceof Error ? playErr.message : t("scan.couldNotStartPreview"));
        return;
      }
      setState("granted");
    } catch (err) {
      setState((prev) => (prev === "error" ? prev : "denied"));
      setErrorDetail(err instanceof Error ? err.message : null);
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }

  async function onPhotoPicked(event: { target: HTMLInputElement }) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      let result: string | null = null;
      if (detectorRef.current) {
        const found = await detectorRef.current.detect(bitmap).catch(() => []);
        result = found[0]?.rawValue ?? null;
      }
      if (!result && canvasRef.current) {
        result = decodeCenterThenFull(canvasRef.current, bitmap, bitmap.width, bitmap.height, [1000, 700, 450]);
      }
      bitmap.close();
      if (result) onScannedRef.current(result);
      else setPhotoError(t("scan.noCodeInPhoto"));
    } catch {
      setPhotoError(t("scan.noCodeInPhoto"));
    } finally {
      setPhotoBusy(false);
    }
  }

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (state !== "granted" || !active) return;
    let cancelled = false;
    let busy = false;
    let frame = 0;

    async function scanFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return;
      const width = video.videoWidth;
      const height = video.videoHeight;

      const detector = detectorRef.current;
      if (detector) {
        try {
          const found = await detector.detect(video);
          if (found[0]?.rawValue) return found[0].rawValue;
          return null;
        } catch {
          detectorRef.current = null;
        }
      }

      frame += 1;
      const side = Math.min(width, height) * 0.75;
      const center = decodeRegion(canvas, video, (width - side) / 2, (height - side) / 2, side, side, 640);
      if (center) return center;
      // A wider look every few frames catches codes held off-centre or far away.
      if (frame % 3 === 0) return decodeRegion(canvas, video, 0, 0, width, height, 800);
      return null;
    }

    function tick() {
      if (cancelled) return;
      if (!busy) {
        busy = true;
        scanFrame()
          .then((data) => {
            if (data && !cancelled) {
              cancelled = true;
              onScannedRef.current(data);
            }
          })
          .finally(() => {
            busy = false;
          });
      }
      if (!cancelled) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [state, active]);

  const message =
    state === "denied"
      ? t("scan.cameraDenied")
      : state === "error"
        ? t("scan.couldNotStartCamera", { detail: errorDetail ?? t("scan.pleaseTryAgain") })
        : t("scan.cameraPermissionBody");

  return (
    <ThemedView style={[styles.container, style]}>
      {/* Always mounted so the ref exists before permission is granted. */}
      <Video ref={videoRef} autoPlay playsInline muted style={videoStyle} />
      <Canvas ref={canvasRef} style={hiddenStyle} />
      <FileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={hiddenStyle}
        onChange={onPhotoPicked}
      />

      {state === "granted" ? (
        <View style={styles.viewfinderLayer} pointerEvents="none">
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
      ) : (
        <ThemedView style={styles.permissionOverlay} type="backgroundElement">
          <ThemedText themeColor="textSecondary" style={styles.permissionBody}>
            {message}
          </ThemedText>
          <Button title={t("scan.grantAccess")} onPress={requestAccess} />
        </ThemedView>
      )}

      <View style={styles.controls}>
        {photoError ? (
          <ThemedText type="small" style={styles.photoError}>
            {photoError}
          </ThemedText>
        ) : null}
        <View style={styles.controlRow}>
          <Button
            title={t("scan.takePhoto")}
            variant="secondary"
            onPress={() => fileInputRef.current?.click()}
            loading={photoBusy}
            style={styles.controlButton}
          />
          {state === "granted" && torchSupported ? (
            <Button
              title={torchOn ? t("scan.flashOff") : t("scan.flashOn")}
              variant="secondary"
              onPress={toggleTorch}
              style={styles.controlButton}
            />
          ) : null}
        </View>
      </View>
    </ThemedView>
  );
}

const CORNER = 34;
const CORNER_WIDTH = 5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  permissionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permissionBody: {
    textAlign: "center",
    lineHeight: 22,
  },
  viewfinderLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: {
    width: "70%",
    maxWidth: 320,
    aspectRatio: 1,
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "#FFD400",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 12 },
  controls: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 8,
    alignItems: "center",
  },
  controlRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  controlButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  photoError: {
    color: "#FFFFFF",
    backgroundColor: "rgba(196, 57, 43, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
  },
});
