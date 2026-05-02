import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email: string, password: string) => {
  const users = JSON.parse((await AsyncStorage.getItem('users')) || '[]');

  const found = users.find(
    (u: any) => u.email === email && u.password === password
  );

  if (!found) throw new Error('Invalid login');

  await AsyncStorage.setItem('session', JSON.stringify(found));
};

export const register = async (email: string, password: string) => {
  const users = JSON.parse((await AsyncStorage.getItem('users')) || '[]');

  const exists = users.find((u: any) => u.email === email);
  if (exists) throw new Error('User exists');

  const user = { id: Date.now().toString(), email, password };
  users.push(user);

  await AsyncStorage.setItem('users', JSON.stringify(users));
  await AsyncStorage.setItem('session', JSON.stringify(user));
};

export const logout = async () => {
  await AsyncStorage.removeItem('session');
};

export const getSession = async () => {
  return JSON.parse((await AsyncStorage.getItem('session')) || 'null');
};