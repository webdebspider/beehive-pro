import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import { getAlerts } from '../utils/storage';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAlerts().then(setAlerts);
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 24 }}>🚨 Alerts</Text>

        <FlatList
          data={alerts}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor:
                  item.type === 'critical' ? '#7f1d1d' : '#78350f',
                padding: 12,
                borderRadius: 10,
                marginVertical: 6,
              }}
            >
              <Text style={{ color: '#fff' }}>
                Hive {item.hiveId}
              </Text>
              <Text style={{ color: '#fecaca' }}>
                Score: {item.score}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}