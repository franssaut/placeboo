import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function CatalogScreen({ onSelectTool }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Semua Alat' },
    { id: 'to-pdf', label: 'Ke PDF' },
    { id: 'from-pdf', label: 'Dari PDF' },
    { id: 'optimize', label: 'Optimasi' },
    { id: 'security', label: 'Keamanan' },
    { id: 'ai', label: 'AI Scanner' }
  ];

  const toolsData = useMemo(() => [
    {
      id: 'pdf-to-excel',
      title: 'PDF ke Excel',
      description: 'Ekstrak tabel dan data numerik dari berkas PDF ke spreadsheet Excel .xlsx.',
      category: 'from-pdf',
      format: 'XLSX',
      tag: 'PDF → XLSX',
      icon: 'table-view',
      color: '#10b981'
    },
    {
      id: 'pdf-to-word',
      title: 'PDF ke Word',
      description: 'Ubah PDF menjadi berkas Microsoft Word .docx yang dapat disunting penuh.',
      category: 'from-pdf',
      format: 'DOCX',
      tag: 'PDF → DOCX',
      icon: 'article',
      color: '#4f46e5'
    },
    {
      id: 'pdf-to-image',
      title: 'PDF ke Gambar',
      description: 'Ekstrak setiap halaman PDF menjadi gambar resolusi tinggi (PNG / JPG).',
      category: 'from-pdf',
      format: 'PNG',
      tag: 'PDF → PNG',
      icon: 'photo-library',
      color: '#06b6d4'
    },
    {
      id: 'word-to-pdf',
      title: 'Word ke PDF',
      description: 'Konversi dokumen DOC dan DOCX ke standar cetak PDF presisi tinggi.',
      category: 'to-pdf',
      format: 'PDF',
      tag: 'DOCX → PDF',
      icon: 'description',
      color: '#3b82f6'
    },
    {
      id: 'excel-to-pdf',
      title: 'Excel ke PDF',
      description: 'Konversi spreadsheet XLSX dan CSV menjadi lembaran PDF rapi.',
      category: 'to-pdf',
      format: 'PDF',
      tag: 'XLSX → PDF',
      icon: 'table-chart',
      color: '#059669'
    },
    {
      id: 'image-to-pdf',
      title: 'Gambar ke PDF',
      description: 'Satukan foto JPG, PNG, atau pindaian dokumen menjadi berkas PDF tunggal.',
      category: 'to-pdf',
      format: 'PDF',
      tag: 'IMG → PDF',
      icon: 'image',
      color: '#f59e0b'
    },
    {
      id: 'compress-pdf',
      title: 'Kompres Ukuran PDF',
      description: 'Kecilkan ukuran dokumen PDF tanpa mengurangi ketajaman teks.',
      category: 'optimize',
      format: 'PDF',
      tag: 'OPTIMASI',
      icon: 'compress',
      color: '#8b5cf6'
    },
    {
      id: 'ocr-scanner',
      title: 'OCR Scanner Teks AI',
      description: 'Deteksi teks dari foto atau pindaian berkas fisik ke format teks murni .txt.',
      category: 'ai',
      format: 'TXT',
      tag: 'AI VISION',
      icon: 'document-scanner',
      color: '#ec4899'
    },
    {
      id: 'lock-pdf',
      title: 'Kunci & Proteksi Sandi',
      description: 'Amankan dokumen PDF penting dengan enkripsi sandi standar militer.',
      category: 'security',
      format: 'PDF',
      tag: 'SECURITY',
      icon: 'lock',
      color: '#dc2626'
    }
  ], []);

  const filteredTools = useMemo(() => {
    return toolsData.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCat;
      const matchQuery =
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [toolsData, activeCategory, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari alat konversi..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tool List */}
      <FlatList
        data={filteredTools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectTool(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.cardTextCol}>
                <View style={styles.tagRow}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="search-off" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Alat tidak ditemukan</Text>
            <Text style={styles.emptySubtitle}>Coba kata kunci lain atau pilih Semua Kategori.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a'
  },
  categoryContainer: {
    marginBottom: 14
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  categoryChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5'
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  categoryChipTextActive: {
    color: '#ffffff'
  },
  listContent: {
    paddingBottom: 20
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cardTextCol: {
    flex: 1
  },
  tagRow: {
    marginBottom: 2
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b'
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4
  }
});
