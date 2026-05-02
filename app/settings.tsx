import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function Settings() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('dark').then((v) => setDark(v === 'true'));
  }, []);

  const save = async () => {
    await AsyncStorage.setItem('dark', dark.toString());
    Alert.alert('Saved');
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Dark Mode</Text>
      <Switch value={dark} onValueChange={setDark} />

      <TouchableOpacity
        onPress={save}
        style={{ marginTop: 20, backgroundColor: 'black', padding: 12 }}
      >
        <Text style={{ color: '#fff' }}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}