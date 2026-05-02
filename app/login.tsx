import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { login, register } from '../utils/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
      Alert.alert('Success', 'Logged in');
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRegister = async () => {
    try {
      await register(email, password);
      Alert.alert('Account created');
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        style={{ backgroundColor: 'black', padding: 12, marginBottom: 10 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleRegister}
        style={{ backgroundColor: 'gray', padding: 12 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}