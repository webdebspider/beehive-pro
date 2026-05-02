import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Explore</Text>
      <Text style={styles.text}>
        Future features will go here:
      </Text>

      <Text style={styles.item}>📊 Hive analytics</Text>
      <Text style={styles.item}>📅 Inspection reminders</Text>
      <Text style={styles.item}>☁️ Backup & export</Text>
      <Text style={styles.item}>🚨 Smart alerts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20
  },
  text: {
    color: '#ccc',
    marginBottom: 15
  },
  item: {
    color: 'white',
    marginTop: 10,
    fontSize: 16
  }
});