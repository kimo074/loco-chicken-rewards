import { createElement, useEffect, useRef, useState } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import jsQR from "jsqr";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";

type WebBarcodeScannerProps = {
  active: boolean;
  onScanned: (data: string) => void;
  style?: ViewStyle;
};

const Video = (props: Record<string, unknown>) => createElement("video", props);
const Canvas = (props: Record<string, unknown>) => createElement("canvas", props);

export function WebBarcodeScanner({ active, onScanned, style }: WebBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<"idle" | "granted" | "denied">("idle");

  async function requestAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermissionState("granted");
    } catch {
      setPermissionState("denied");
    }
  }

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (permissionState !== "granted" || !active) return;

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
  }, [permissionState, active, onScanned]);

  if (permissionState !== "granted") {
    return (
      <ThemedView style={[styles.permissionContainer, style]} type="backgroundElement">
        <ThemedText themeColor="textSecondary" style={styles.permissionBody}>
          {permissionState === "denied"
            ? "Camera access was denied. Please allow camera access in your browser settings and try again."
            : "We use your camera to scan the code shown at the register."}
        </ThemedText>
        <Button title="Grant camera access" onPress={requestAccess} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, style]}>
      <Video ref={videoRef} autoPlay playsInline muted style={styles.video} />
      <Canvas ref={canvasRef} style={styles.hiddenCanvas} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  hiddenCanvas: {
    display: "none",
  },
  permissionContainer: {
    flex: 1,
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
