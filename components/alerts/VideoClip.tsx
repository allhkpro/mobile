import { View, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

interface Props {
  url: string;
}

export default function VideoClip({ url }: Props) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  return (
    <View style={styles.container}>
      <VideoView player={player} style={styles.video} contentFit="cover" allowsFullscreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  video: { width: "100%", height: "100%" },
});
