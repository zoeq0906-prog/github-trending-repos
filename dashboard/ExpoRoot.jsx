import { StyleSheet, View } from "react-native";
import ArticleSearch from "./src/dom";

export default function ExpoRoot() {
  return (
    <View style={styles.root}>
      <ArticleSearch dom={{ style: styles.web, scrollEnabled: true }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f3eee6",
  },
  web: {
    flex: 1,
  },
});
