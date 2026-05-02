import { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import axios from "axios";
import api from "../../services/api";
import { Endpoints } from "../../constants/api";
import { Colors } from "../../constants/theme";
import { useAlertsStore } from "../../stores/alerts";
import { useAuthStore } from "../../stores/auth";
import SiteStatusStrip from "../../components/alerts/SiteStatusStrip";
import AlertFilterBar from "../../components/alerts/AlertFilterBar";
import AlertCard from "../../components/alerts/AlertCard";

interface SiteStatus {
  site_id: string;
  name: string;
  status: string;
  last_seen: string | null;
  current_model: string | null;
  storage_free_percent: number | null;
}

export default function SecurityScreen() {
  const homeId = useAuthStore((s) => s.currentHomeId);
  const { items, cursor, loading, filter, loadFirstPage, loadNextPage, setFilter } = useAlertsStore();
  const [siteStatus, setSiteStatus] = useState<SiteStatus | null | undefined>(undefined);

  useEffect(() => {
    if (!homeId) return;
    loadFirstPage(homeId);
    fetchSiteStatus(homeId);
  }, [homeId, filter.alert_type]);

  async function fetchSiteStatus(home_id: string) {
    try {
      const { data } = await api.get<SiteStatus>(
        `${Endpoints.sites.status}?home_id=${home_id}`,
      );
      setSiteStatus(data);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setSiteStatus(null);  // explicit null = backend confirms no site → show CTA
      }
      // For other errors (network, 5xx), leave siteStatus as is — don't flicker the CTA
    }
  }

  if (!homeId) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>请先选择或创建一个家</Text>
      </View>
    );
  }

  // Show pairing CTA when home has no site bound
  if (siteStatus === null) {
    return (
      <View style={styles.container}>
        <View style={styles.emptySite}>
          <Text style={styles.emptySiteIcon}>📷</Text>
          <Text style={styles.emptySiteTitle}>还没有摄像头主机</Text>
          <Text style={styles.emptySiteSub}>
            装上智瞳主机即可看到家里的告警时间线
          </Text>
          <Pressable
            style={styles.emptySiteBtn}
            onPress={() => router.push("/(security)/pair")}
          >
            <Text style={styles.emptySiteBtnText}>+ 添加摄像头主机</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SiteStatusStrip
        online={siteStatus?.status === "online"}
        storageFreePercent={siteStatus?.storage_free_percent ?? null}
        currentModel={siteStatus?.current_model ?? null}
      />
      <AlertFilterBar
        active={filter.alert_type}
        onChange={(t) => setFilter({ ...filter, alert_type: t })}
      />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <AlertCard item={item} onPress={() => router.push({ pathname: "/alert/[id]", params: { id: item.id } })} />
        )}
        refreshControl={
          <RefreshControl refreshing={loading && items.length === 0} onRefresh={() => loadFirstPage(homeId)} tintColor="#fff" />
        }
        onEndReached={() => cursor && loadNextPage(homeId)}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无告警</Text>
          </View>
        ) : null}
        ListFooterComponent={loading && items.length > 0 ? <ActivityIndicator style={{ padding: 16 }} color="#fff" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // paddingTop: 60 matches the home tab convention (mobile/app/(tabs)/index.tsx)
  // — manually clears the iPhone status bar / Dynamic Island. Without this, the
  // SiteStatusStrip overlaps the system clock.
  container: { flex: 1, backgroundColor: Colors.background ?? "#000", paddingTop: 60 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { color: Colors.textSecondary ?? "#8E8E93", fontSize: 14 },
  emptySite: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptySiteIcon: { fontSize: 48 },
  emptySiteTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  emptySiteSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
  },
  emptySiteBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.cyan ?? "#0A84FF",
    borderRadius: 12,
  },
  emptySiteBtnText: { color: "#fff", fontWeight: "600" },
});
