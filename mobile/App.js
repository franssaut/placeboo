import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import CatalogScreen from './src/screens/CatalogScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [preselectedFormat, setPreselectedFormat] = useState('XLSX');

  const handleSelectToolFromCatalog = (tool) => {
    setPreselectedFormat(tool.format || 'XLSX');
    setActiveTab('home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#f8fafc" />

      {/* Main Screen Content */}
      <View style={styles.content}>
        {activeTab === 'home' ? (
          <HomeScreen defaultFormat={preselectedFormat} />
        ) : (
          <CatalogScreen onSelectTool={handleSelectToolFromCatalog} />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="transform"
            size={24}
            color={activeTab === 'home' ? '#4f46e5' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'home' && styles.navLabelActive
            ]}
          >
            Konversi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('catalog')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="grid-view"
            size={24}
            color={activeTab === 'catalog' ? '#4f46e5' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'catalog' && styles.navLabelActive
            ]}
          >
            Semua Alat
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0
  },
  content: {
    flex: 1
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 8
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
    marginTop: 2
  },
  navLabelActive: {
    color: '#4f46e5',
    fontWeight: '700'
  }
});
