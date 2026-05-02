import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getHives } from '../../utils/storage';

export default function Dashboard() {
  const router = useRouter();
  const [hives, setHives] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHives().then(setHives);
    }, [])
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#0f172a' }}>
      <Text style={{ fontSize: 24, color: '#fff', marginBottom: 20 }}>
        🐝 Your Hives
      </Text>

      <FlatList
        data={hives}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/hive/[id]',
                params: { id: item.id },
              })
            }
            style={{
              backgroundColor: '#1f2933',
              padding: 16,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#fff' }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/hive/add')}
        style={{
          backgroundColor: '#22c55e',
          padding: 14,
          borderRadius: 10,
          marginTop: 20,
        }}
      >
        <Text style={{ textAlign: 'center' }}>➕ Add Hive</Text>
      </TouchableOpacity>
    </View>
  );
}