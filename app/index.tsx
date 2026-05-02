import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAlerts, getHives } from '../utils/storage';

export default function Dashboard() {
  const router = useRouter();
  const [hives, setHives] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHives().then(setHives);
      getAlerts().then(setAlerts);
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>

        {/* HEADER */}
        <Text style={styles.title}>🐝 Hive Dashboard</Text>
        <Text style={styles.subtitle}>
          {hives.length} hives • {alerts.length} alerts
        </Text>

        {/* ALERT BANNER */}
        {alerts.length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              🚨 {alerts.length} active alerts
            </Text>
          </View>
        )}

        {/* HIVE LIST */}
        <FlatList
          data={hives}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/hive/[id]',
                  params: { id: item.id },
                })
              }
              style={styles.hiveCard}
            >
              <Text style={styles.hiveName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/hive/add')}
        style={styles.fab}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
  },
  subtitle: {
    color: '#9ca3af',
    marginBottom: 20,
  },
  alertBanner: {
    backgroundColor: '#7f1d1d',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  alertText: {
    color: '#fecaca',
    fontWeight: '600' as const,
  },
  hiveCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  hiveName: {
    color: '#fff',
    fontSize: 16,
  },
  fab: {
    position: 'absolute' as const,
    bottom: 30,
    right: 20,
    backgroundColor: '#22c55e',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  fabText: {
    fontSize: 30,
    color: '#000',
    fontWeight: '700' as const,
  },
};