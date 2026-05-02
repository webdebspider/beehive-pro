import AsyncStorage from '@react-native-async-storage/async-storage';

export const getTheme = async () => {
  const stored = await AsyncStorage.getItem('darkMode');
  return stored ? JSON.parse(stored) : false;
};

export const setTheme = async (value: boolean) => {
  await AsyncStorage.setItem('darkMode', JSON.stringify(value));
};