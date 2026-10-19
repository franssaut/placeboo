import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MAX_FILE_SIZE,
  formatBytes,
  convertDocumentMobile,
  shareFileNative
} from '../services/mobileConverter';

export default function HomeScreen({ mode = 'pdf_to_image', onModeChange }) {
  const [activeMode, setActiveMode] = useState(mode);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('PNG');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState(null);

  // Sync mode from parent if provided
  useEffect(() => {
    if (mode && mode !== activeMode) {
      handleSwitchMode(mode);
    }
  }, [mode]);

  const handleSwitchMode = (newMode) => {
    setActiveMode(newMode);
    setSelectedFile(null);
    setConvertedResult(null);
    if (newMode === 'pdf_to_image') {
      setTargetFormat('PNG');
    } else {
      setTargetFormat('PDF');
    }
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const isPdfToImage = activeMode === 'pdf_to_image';

  const pickDocument = async () => {
    try {
      const allowedTypes = isPdfToImage ? ['application/pdf'] : ['image/*'];

      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
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

        const ext = file.name && file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';

        // Validation based on active mode
        if (isPdfToImage && ext !== 'pdf') {
          Alert.alert(
            'Berkas Tidak Sesuai',
            'Silakan pilih berkas dokumen berformat PDF untuk mode PDF ke Gambar.'
          );
          return;
        }

        if (!isPdfToImage && !['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) {
          Alert.alert(
            'Berkas Tidak Sesuai',
            'Silakan pilih berkas gambar (JPG, PNG, atau WEBP) untuk mode Gambar ke PDF.'
          );
          return;
        }

        setSelectedFile(file);
        setConvertedResult(null);
      }
    } catch (err) {
      console.warn('Pick document error:', err);
      Alert.alert('Gagal Memilih Berkas', 'Terjadi kesalahan saat mengakses berkas pada perangkat.');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      Alert.alert(
        'Pilih Berkas',
        isPdfToImage
          ? 'Silakan pilih berkas PDF yang ingin dikonversi.'
          : 'Silakan pilih berkas Gambar yang ingin dikonversi ke PDF.'
      );
      return;
    }

    setIsConverting(true);
    setProgress(15);

    try {
      const result = await convertDocumentMobile(selectedFile, targetFormat, (p) => {
        setProgress(p);
      });

      setConvertedResult(result);
      Alert.alert(
        'Konversi Berhasil',
        `Berkas berhasil dikonversi ke ${targetFormat} via ${result.sourceEngine || 'Placeboo'}!`
      );
    } catch (err) {
      console.error('Convert document error:', err);
      Alert.alert(
        'Konversi Gagal',
        `Terjadi kendala saat memproses: ${err?.message || 'Gagal memproses dokumen.'}`
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
          : 'application/pdf');

      const success = await shareFileNative(convertedResult.uri, mime);
      if (!success) {
        Alert.alert('Informasi', 'Fitur penyimpanan berkas telah dibuka di sistem perangkat Anda.');
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setConvertedResult(null);
    setProgress(0);
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
          Spesialis Konversi PDF ↔ Gambar Cepat, Tajam, &amp; Maks. 50 MB.
        </Text>
      </View>

      {/* Mode Switcher Segmented Tabs */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, isPdfToImage && styles.segmentBtnActive]}
          onPress={() => handleSwitchMode('pdf_to_image')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="photo-library"
            size={18}
            color={isPdfToImage ? '#ffffff' : '#475569'}
          />
          <Text style={[styles.segmentBtnText, isPdfToImage && styles.segmentBtnTextActive]}>
            PDF ke Gambar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, !isPdfToImage && styles.segmentBtnActive]}
          onPress={() => handleSwitchMode('image_to_pdf')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="picture-as-pdf"
            size={18}
            color={!isPdfToImage ? '#ffffff' : '#475569'}
          />
          <Text style={[styles.segmentBtnText, !isPdfToImage && styles.segmentBtnTextActive]}>
            Gambar ke PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Upload Card */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardHeader}>
            {isPdfToImage ? 'Konversi PDF ke Gambar' : 'Konversi Gambar ke PDF'}
          </Text>
          <View style={styles.modePill}>
            <Text style={styles.modePillText}>
              {isPdfToImage ? 'PDF → PNG/JPG' : 'IMG → PDF'}
            </Text>
          </View>
        </View>

        {!selectedFile ? (
          <TouchableOpacity style={styles.dropzone} onPress={pickDocument} activeOpacity={0.8}>
            <View style={[styles.iconCircle, !isPdfToImage && styles.iconCircleAmber]}>
              <MaterialIcons
                name={isPdfToImage ? 'picture-as-pdf' : 'add-photo-alternate'}
                size={34}
                color={isPdfToImage ? '#4f46e5' : '#d97706'}
              />
            </View>
            <Text style={styles.dropzoneTitle}>
              {isPdfToImage ? 'Pilih Berkas PDF' : 'Pilih Berkas Gambar'}
            </Text>
            <Text style={styles.dropzoneSubtitle}>
              {isPdfToImage
                ? 'Ketuk untuk memilih berkas PDF dari HP (Maks. 50 MB)'
                : 'Mendukung foto/gambar JPG, JPEG, PNG, WEBP (Maks. 50 MB)'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileSelectedBox}>
            <View style={styles.fileInfoRow}>
              <View style={[styles.fileIconBox, !isPdfToImage && styles.fileIconBoxAmber]}>
                <MaterialIcons
                  name={isPdfToImage ? 'picture-as-pdf' : 'image'}
                  size={26}
                  color={isPdfToImage ? '#4f46e5' : '#d97706'}
                />
              </View>
              <View style={styles.fileTextCol}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
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
        {isPdfToImage ? (
          <View style={styles.formatSection}>
            <Text style={styles.labelSection}>Pilih Format Gambar Output:</Text>
            <View style={styles.formatRow}>
              <TouchableOpacity
                style={[styles.formatChip, targetFormat === 'PNG' && styles.formatChipActive]}
                onPress={() => setTargetFormat('PNG')}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="image"
                  size={16}
                  color={targetFormat === 'PNG' ? '#ffffff' : '#64748b'}
                />
                <Text
                  style={[
                    styles.formatChipText,
                    targetFormat === 'PNG' && styles.formatChipTextActive
                  ]}
                >
                  PNG (Resolusi Tinggi)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatChip, targetFormat === 'JPG' && styles.formatChipActive]}
                onPress={() => setTargetFormat('JPG')}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="photo"
                  size={16}
                  color={targetFormat === 'JPG' ? '#ffffff' : '#64748b'}
                />
                <Text
                  style={[
                    styles.formatChipText,
                    targetFormat === 'JPG' && styles.formatChipTextActive
                  ]}
                >
                  JPG (Ukuran Ringan)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.formatSection}>
            <Text style={styles.labelSection}>Format Output Terpilih:</Text>
            <View style={styles.formatRow}>
              <View style={[styles.formatChip, styles.formatChipActive]}>
                <MaterialIcons name="picture-as-pdf" size={16} color="#ffffff" />
                <Text style={[styles.formatChipText, styles.formatChipTextActive]}>
                  Dokumen PDF (.pdf)
                </Text>
              </View>
            </View>
          </View>
        )}

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
            <View style={styles.successHeaderRow}>
              <View style={styles.successIconBox}>
                <MaterialIcons name="check-circle" size={26} color="#10b981" />
              </View>
              <View style={styles.successTextCol}>
                <Text style={styles.successTitle}>Konversi Berhasil!</Text>
                <Text style={styles.successFileName} numberOfLines={1}>
                  {convertedResult.fileName}
                </Text>
              </View>
            </View>

            {/* Live Image Preview for PDF to Image */}
            {Boolean(
              convertedResult.uri &&
                (convertedResult.targetFormat === 'PNG' ||
                  convertedResult.targetFormat === 'JPG' ||
                  convertedResult.mimeType?.startsWith('image/'))
            ) && (
              <View style={styles.previewImageContainer}>
                <Text style={styles.previewLabel}>Pratinjau Hasil Dokumen Gambar:</Text>
                <Image
                  source={{ uri: convertedResult.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={styles.successActionRow}>
              <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
                <MaterialIcons name="share" size={18} color="#ffffff" />
                <Text style={styles.btnShareText}>Buka / Bagikan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnResetSmall} onPress={handleReset}>
                <MaterialIcons name="refresh" size={16} color="#475569" />
              </TouchableOpacity>
            </View>
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
                <Text style={styles.btnConvertText}>
                  {isPdfToImage ? 'Mulai Konversi PDF ke Gambar' : 'Mulai Konversi Gambar ke PDF'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Available Conversion Modes Quick Grid */}
      <View style={styles.modesSection}>
        <Text style={styles.modesHeading}>Alat Konversi Mobile</Text>
        <View style={styles.modesGrid}>
          {/* Card 1: PDF ke Gambar */}
          <TouchableOpacity
            style={[styles.modeCard, isPdfToImage && styles.modeCardActive]}
            onPress={() => handleSwitchMode('pdf_to_image')}
            activeOpacity={0.8}
          >
            <View style={[styles.modeCardIconBox, { backgroundColor: '#e0e7ff' }]}>
              <MaterialIcons name="photo-library" size={24} color="#4f46e5" />
            </View>
            <View style={styles.modeCardHeaderRow}>
              <Text style={styles.modeCardTag}>PDF → PNG/JPG</Text>
              {isPdfToImage && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeIndicatorText}>Aktif</Text>
                </View>
              )}
            </View>
            <Text style={styles.modeCardTitle}>PDF ke Gambar</Text>
            <Text style={styles.modeCardDesc}>
              Ekstrak dokumen PDF menjadi berkas gambar beresolusi tinggi.
            </Text>
          </TouchableOpacity>

          {/* Card 2: Gambar ke PDF */}
          <TouchableOpacity
            style={[styles.modeCard, !isPdfToImage && styles.modeCardActive]}
            onPress={() => handleSwitchMode('image_to_pdf')}
            activeOpacity={0.8}
          >
            <View style={[styles.modeCardIconBox, { backgroundColor: '#fef3c7' }]}>
              <MaterialIcons name="picture-as-pdf" size={24} color="#d97706" />
            </View>
            <View style={styles.modeCardHeaderRow}>
              <Text style={styles.modeCardTag}>IMG → PDF</Text>
              {!isPdfToImage && (
                <View style={[styles.activeIndicator, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                  <Text style={[styles.activeIndicatorText, { color: '#b45309' }]}>Aktif</Text>
                </View>
              )}
            </View>
            <Text style={styles.modeCardTitle}>Gambar ke PDF</Text>
            <Text style={styles.modeCardDesc}>
              Kemas foto atau gambar menjadi berkas PDF standar siap cetak.
            </Text>
          </TouchableOpacity>
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
    marginBottom: 14
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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6
  },
  segmentBtnActive: {
    backgroundColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  segmentBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700'
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b'
  },
  modePill: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca'
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
  iconCircleAmber: {
    backgroundColor: '#fef3c7'
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
  fileIconBoxAmber: {
    backgroundColor: '#fef3c7'
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
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  successHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  successIconBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  successTextCol: {
    flex: 1
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46'
  },
  successFileName: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2
  },
  previewImageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 6
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    backgroundColor: '#ffffff'
  },
  successActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8
  },
  btnShareText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  btnResetSmall: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
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
  modesSection: {
    marginBottom: 20
  },
  modesHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },
  modesGrid: {
    gap: 12
  },
  modeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  modeCardActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#fcfdff'
  },
  modeCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  modeCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  modeCardTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  activeIndicator: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  activeIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338ca'
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4
  },
  modeCardDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18
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
