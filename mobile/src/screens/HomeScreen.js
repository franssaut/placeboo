import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  MAX_FILE_SIZE,
  formatBytes,
  convertDocumentMobile,
  shareFileNative
} from '../services/mobileConverter';

export default function HomeScreen({ defaultFormat = 'XLSX' }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState(defaultFormat);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState(null);

  React.useEffect(() => {
    if (defaultFormat) {
      setTargetFormat(defaultFormat);
    }
  }, [defaultFormat]);

  const formats = [
    { label: 'EXCEL (.xlsx)', value: 'XLSX', icon: 'grid-on' },
    { label: 'WORD (.docx)', value: 'DOCX', icon: 'description' },
    { label: 'PDF (.pdf)', value: 'PDF', icon: 'picture-as-pdf' },
    { label: 'GAMBAR (.png)', value: 'PNG', icon: 'image' },
    { label: 'TEKS (.txt)', value: 'TXT', icon: 'text-fields' }
  ];

  const popularTools = [
    { title: 'PDF ke Excel', tag: 'PDF → XLSX', format: 'XLSX', icon: 'table-view', color: '#10b981' },
    { title: 'PDF ke Word', tag: 'PDF → DOCX', format: 'DOCX', icon: 'article', color: '#4f46e5' },
    { title: 'PDF ke Gambar', tag: 'PDF → PNG', format: 'PNG', icon: 'photo-library', color: '#06b6d4' },
    { title: 'Gambar ke PDF', tag: 'IMG → PDF', format: 'PDF', icon: 'image', color: '#f59e0b' },
    { title: 'Excel ke PDF', tag: 'XLSX → PDF', format: 'PDF', icon: 'table-chart', color: '#8b5cf6' },
    { title: 'OCR Scanner AI', tag: 'AI VISION', format: 'TXT', icon: 'document-scanner', color: '#ec4899' }
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // 50 MB file limit check
        if (file.size && file.size > MAX_FILE_SIZE) {
          Alert.alert(
            'Batas Ukuran Terlampaui',
            `Ukuran berkas "${file.name}" (${formatBytes(file.size)}) melebihi batas maksimal 50 MB.`
          );
          return;
        }

        setSelectedFile(file);
        setConvertedResult(null);

        // Auto adjust target format if source matches target
        const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
        if (ext === 'pdf' && targetFormat === 'PDF') {
          setTargetFormat('XLSX');
        } else if (['xlsx', 'docx', 'png', 'jpg'].includes(ext) && targetFormat.toLowerCase() === ext) {
          setTargetFormat('PDF');
        }
      }
    } catch (err) {
      console.warn('Pick document error:', err);
      Alert.alert('Gagal Memilih Berkas', 'Terjadi kesalahan saat mengakses berkas.');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      Alert.alert('Pilih Berkas', 'Silakan pilih berkas dokumen yang ingin dikonversi terlebih dahulu.');
      return;
    }

    setIsConverting(true);
    setProgress(10);

    try {
      const result = await convertDocumentMobile(selectedFile, targetFormat, (p) => {
        setProgress(p);
      });

      setConvertedResult(result);
      Alert.alert('Konversi Berhasil', `Berkas berhasil dikonversi ke format ${targetFormat} (${result.sourceEngine || 'Placeboo API'})!`);
    } catch (err) {
      console.error('Convert document error:', err);
      Alert.alert(
        'Konversi Gagal',
        `Terjadi kesalahan saat memproses konversi: ${err?.message || 'Gagal memproses dokumen.'}`
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleShare = async () => {
    if (convertedResult && convertedResult.uri) {
      const mime =
        convertedResult.mimeType ||
        (targetFormat === 'PNG'
          ? 'image/png'
          : targetFormat === 'JPG' || targetFormat === 'JPEG'
          ? 'image/jpeg'
          : targetFormat === 'PDF'
          ? 'application/pdf'
          : targetFormat === 'XLSX'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : targetFormat === 'DOCX'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'text/plain');
      const success = await shareFileNative(convertedResult.uri, mime);
      if (!success) {
        Alert.alert('Informasi', 'Fitur penyimpanan berkas telah dibuka di sistem perangkat Anda.');
      }
    }
  };

  const handleSelectPopularTool = (tool) => {
    setTargetFormat(tool.format);
    pickDocument();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>Placeboo</Text>
          <View style={styles.badgeSecure}>
            <MaterialIcons name="lock" size={12} color="#10b981" />
            <Text style={styles.badgeSecureText}>Zero Retention</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Konverter Dokumen Multi-Format Cepat, Aman, &amp; Bebas Batas 50 MB.
        </Text>
      </View>

      {/* Main Upload Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Unggah &amp; Konversi Berkas</Text>

        {!selectedFile ? (
          <TouchableOpacity style={styles.dropzone} onPress={pickDocument} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="cloud-upload" size={36} color="#4f46e5" />
            </View>
            <Text style={styles.dropzoneTitle}>Pilih Berkas dari HP</Text>
            <Text style={styles.dropzoneSubtitle}>
              Mendukung PDF, Word, Excel, Gambar JPG/PNG, hingga Teks OCR (Maks. 50 MB)
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileSelectedBox}>
            <View style={styles.fileInfoRow}>
              <View style={styles.fileIconBox}>
                <MaterialIcons name="insert-drive-file" size={28} color="#4f46e5" />
              </View>
              <View style={styles.fileTextCol}>
                <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{formatBytes(selectedFile.size || 0)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <MaterialIcons name="close" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnChangeFile} onPress={pickDocument}>
              <Text style={styles.btnChangeFileText}>Ganti Berkas Lain</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Format Selector */}
        <View style={styles.formatSection}>
          <Text style={styles.labelSection}>Konversi Ke Format:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatScroll}>
            {formats.map((fmt) => {
              const active = targetFormat === fmt.value;
              return (
                <TouchableOpacity
                  key={fmt.value}
                  style={[styles.formatChip, active && styles.formatChipActive]}
                  onPress={() => setTargetFormat(fmt.value)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={fmt.icon}
                    size={16}
                    color={active ? '#ffffff' : '#64748b'}
                  />
                  <Text style={[styles.formatChipText, active && styles.formatChipTextActive]}>
                    {fmt.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Progress Bar during conversion */}
        {isConverting && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressText}>Memproses Konversi...</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* Converted Result Banner */}
        {convertedResult && (
          <View style={styles.successBox}>
            <View style={styles.successIconBox}>
              <MaterialIcons name="check-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.successTextCol}>
              <Text style={styles.successTitle}>Konversi Selesai!</Text>
              <Text style={styles.successFileName} numberOfLines={1}>{convertedResult.fileName}</Text>
            </View>
            <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
              <MaterialIcons name="share" size={18} color="#ffffff" />
              <Text style={styles.btnShareText}>Buka / Bagikan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Button */}
        {!convertedResult && (
          <TouchableOpacity
            style={[styles.btnConvert, isConverting && styles.btnDisabled]}
            onPress={handleConvert}
            disabled={isConverting}
            activeOpacity={0.8}
          >
            {isConverting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="bolt" size={20} color="#ffffff" />
                <Text style={styles.btnConvertText}>Mulai Konversi Sekarang</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Popular Tools Section */}
      <View style={styles.popularSection}>
        <Text style={styles.popularHeading}>Alat Konversi Terpopuler</Text>
        <View style={styles.toolsGrid}>
          {popularTools.map((tool, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.toolCard}
              onPress={() => handleSelectPopularTool(tool)}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconBox, { backgroundColor: `${tool.color}15` }]}>
                <MaterialIcons name={tool.icon} size={24} color={tool.color} />
              </View>
              <Text style={styles.toolTag}>{tool.tag}</Text>
              <Text style={styles.toolTitle}>{tool.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Security & Info Footer Card */}
      <View style={styles.securityBox}>
        <MaterialIcons name="verified-user" size={20} color="#10b981" />
        <Text style={styles.securityText}>
          Privasi Maksimal: File diproses aman tanpa registrasi &amp; dihapus otomatis seketika.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  header: {
    marginBottom: 16
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5
  },
  badgeSecure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  badgeSecureText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14
  },
  dropzone: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16
  },
  fileSelectedBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  fileTextCol: {
    flex: 1
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b'
  },
  fileSize: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  btnChangeFile: {
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  btnChangeFileText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600'
  },
  formatSection: {
    marginTop: 16
  },
  labelSection: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8
  },
  formatScroll: {
    flexDirection: 'row'
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  formatChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5'
  },
  formatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  formatChipTextActive: {
    color: '#ffffff'
  },
  progressContainer: {
    marginTop: 16
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  progressText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5'
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 4
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  successIconBox: {
    marginRight: 8
  },
  successTextCol: {
    flex: 1
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46'
  },
  successFileName: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1
  },
  btnShare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  btnShareText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  btnConvert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 18,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3
  },
  btnDisabled: {
    opacity: 0.7
  },
  btnConvertText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  popularSection: {
    marginBottom: 20
  },
  popularHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  toolCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  toolIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  toolTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b'
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  securityText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16
  }
});
