import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportInspections(hiveId: string, inspections: any[]) {
  if (!inspections.length) {
    Alert.alert('No data to export');
    return;
  }

  const header = 'Date,Score,Queen,Mites,Temperament,Notes\n';

  const rows = inspections
    .map(i =>
      [
        i.date || '',
        i.score || '',
        i.queen || '',
        i.mites || '',
        i.temperament || '',
        (i.notes || '').replace(/,/g, ' '),
      ].join(',')
    )
    .join('\n');

  const csv = header + rows;
  const fileName = `hive_${hiveId}_${new Date().toISOString().split('T')[0]}.csv`;

  // 🌐 WEB EXPORT (download file)
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
    return;
  }

  // 📱 MOBILE EXPORT (share file)
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  } else {
    Alert.alert('Sharing not available on this device');
  }
}