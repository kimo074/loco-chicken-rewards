import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const EMOJIS = ["🎉", "🎊", "✨"];
const PARTICLE_COUNT = 14;

type Particle = {
  emoji: string;
  angle: number;
  distance: number;
  delay: number;
  size: number;
};

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    emoji: EMOJIS[i % EMOJIS.length],
    angle: (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.6,
    distance: 70 + Math.random() * 70,
    delay: Math.random() * 0.25,
    size: 16 + Math.random() * 14,
  }));
}

export function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!burstKey) return;
    setParticles(makeParticles());
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey]);

  if (particles.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, index) => {
        const start = particle.delay;
        const midOpacity = Math.min(1, start + 0.5);
        const midScale = Math.min(1, start + 0.15);
        const translateX = progress.interpolate({
          inputRange: [0, start, 1],
          outputRange: [0, 0, Math.cos(particle.angle) * particle.distance],
        });
        const translateY = progress.interpolate({
          inputRange: [0, start, 1],
          outputRange: [0, 0, Math.sin(particle.angle) * particle.distance + 50],
        });
        const opacity = progress.interpolate({
          inputRange: [0, start, midOpacity, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, start, midScale, 1],
          outputRange: [0, 0, 1, 0.85],
        });
        return (
          <Animated.Text
            key={index}
            style={[
              styles.particle,
              {
                fontSize: particle.size,
                marginLeft: -particle.size / 2,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          >
            {particle.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    left: "50%",
    top: "35%",
  },
});
