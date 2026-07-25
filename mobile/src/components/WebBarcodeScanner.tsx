import { createElement, useEffect, useRef, useState } from "react";
import { StyleSheet, ViewStyle } from "react-native";
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
const hiddenCanvasStyle: Record<string, unknown> = { display: "none" };

const Video = (props: Record<string, unknown>) => createElement("video", props);
const Canvas = (props: Record<string, unknown>) => createElement("canvas", props);

export function WebBarcodeScanner({ active, onScanned, style }: WebBarcodeScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "granted" | "denied" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function requestAccess() {
    setErrorDetail(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
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

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (state !== "granted" || !active) return;

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (result?.data) {
            onScanned(result.data);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [state, active, onScanned]);

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
      <Canvas ref={canvasRef} style={hiddenCanvasStyle} />
      {state !== "granted" && (
        <ThemedView style={styles.permissionOverlay} type="backgroundElement">
          <ThemedText themeColor="textSecondary" style={styles.permissionBody}>
            {message}
          </ThemedText>
          <Button title={t("scan.grantAccess")} onPress={requestAccess} />
        </ThemedView>
      )}
    </ThemedView>
  );
}

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
});
