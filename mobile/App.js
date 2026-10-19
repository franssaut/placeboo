import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  LogBox
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';

// Completely suppress non-fatal warning overlays in mobile UI (Expo Go)
LogBox.ignoreAllLogs(true);

export default function App() {
  const [activeMode, setActiveMode] = useState('pdf_to_image'); // 'pdf_to_image' | 'image_to_pdf'

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#f8fafc" />

        {/* Main Screen Content */}
        <View style={styles.content}>
          <HomeScreen mode={activeMode} onModeChange={setActiveMode} />
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveMode('pdf_to_image')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="photo-library"
              size={24}
              color={activeMode === 'pdf_to_image' ? '#4f46e5' : '#94a3b8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeMode === 'pdf_to_image' && styles.navLabelActive
              ]}
            >
              PDF ke Gambar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveMode('image_to_pdf')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="picture-as-pdf"
              size={24}
              color={activeMode === 'image_to_pdf' ? '#4f46e5' : '#94a3b8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeMode === 'image_to_pdf' && styles.navLabelActive
              ]}
            >
              Gambar ke PDF
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    flex: 1
  },
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%'
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 3
  },
  navLabelActive: {
    color: '#4f46e5',
    fontWeight: '700'
  }
});
