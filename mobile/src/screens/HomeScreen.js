import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  PermissionsAndroid
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import {
  MAX_FILE_SIZE,
  formatBytes,
  convertDocumentMobile,
  shareFileNative,
  saveImagesDirectlyToGallery,
  saveAllPagesToStorage
} from '../services/mobileConverter';

const MAX_IMAGES_LIMIT = 20;

export default function HomeScreen({ mode = 'pdf_to_image', onModeChange }) {
  const [activeMode, setActiveMode] = useState(mode);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [targetFormat, setTargetFormat] = useState('PNG');
  const [renderQuality, setRenderQuality] = useState('ultra'); // 'ultra' (300 DPI) | 'high' (200 DPI)
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState(null);
  const [activePdfPageIdx, setActivePdfPageIdx] = useState(0);
  const [isSavingStorage, setIsSavingStorage] = useState(false);
  const [selectedPageIndices, setSelectedPageIndices] = useState([]);
  const [isBatchSharing, setIsBatchSharing] = useState(false);
  const [batchShareProgress, setBatchShareProgress] = useState({ current: 0, total: 0 });
  const abortBatchShareRef = useRef(false);

  // Automatically select all pages when conversion completes
  useEffect(() => {
    if (convertedResult?.pages && convertedResult.pages.length > 0) {
      setSelectedPageIndices(convertedResult.pages.map((_, i) => i));
    } else if (convertedResult) {
      setSelectedPageIndices([0]);
    } else {
      setSelectedPageIndices([]);
    }
  }, [convertedResult]);

  // Sync mode from parent if provided
  useEffect(() => {
    if (mode && mode !== activeMode) {
      handleSwitchMode(mode);
    }
  }, [mode]);

  const handleSwitchMode = (newMode) => {
    setActiveMode(newMode);
    setConvertedResult(null);
    setProgress(0);
    setActivePdfPageIdx(0);
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

  // Request runtime storage and media permissions for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          const perms = [
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          ];
          if (PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO) {
            perms.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO);
          }
          await PermissionsAndroid.requestMultiple(perms);
        } else {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          ]);
        }
      } catch (err) {
        console.warn('Izin penyimpanan Android:', err);
      }
    }
  };

  // Pick PDF (Single file)
  const pickPdfDocument = async () => {
    try {
      await requestStoragePermission();

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/x-pdf', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (file.size && file.size > MAX_FILE_SIZE) {
          Alert.alert(
            'Batas Ukuran Terlampaui',
            `Ukuran berkas "${file.name}" (${formatBytes(file.size)}) melebihi batas maksimal 50 MB.`
          );
          return;
        }

        const ext = file.name && file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
        const mime = (file.mimeType || '').toLowerCase();
        const isPdf = ext === 'pdf' || mime.includes('pdf');
        if (!isPdf) {
          Alert.alert(
            'Berkas Tidak Sesuai',
            'Silakan pilih berkas dokumen berformat PDF (*.pdf) untuk mode PDF ke Gambar.'
          );
          return;
        }

        setSelectedPdf(file);
        setConvertedResult(null);
      }
    } catch (err) {
      console.warn('Pick PDF error:', err);
      Alert.alert('Gagal Memilih Berkas', 'Terjadi kesalahan saat mengakses berkas PDF.');
    }
  };

  // Pick Images (Multiple files up to 20)
  const pickImages = async () => {
    try {
      await requestStoragePermission();

      const remainingSlots = MAX_IMAGES_LIMIT - selectedImages.length;
      if (remainingSlots <= 0) {
        Alert.alert(
          'Batas Maksimal Terpenuhi',
          `Anda telah memilih batas maksimal ${MAX_IMAGES_LIMIT} gambar.`
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/octet-stream', '*/*'],
        multiple: true,
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const validExtensions = ['png', 'jpg', 'jpeg', 'webp', 'bmp'];
        const validIncoming = [];

        for (const file of result.assets) {
          const ext = file.name && file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
          if (validExtensions.includes(ext)) {
            if (file.size && file.size > MAX_FILE_SIZE) {
              Alert.alert('Ukuran Terlampaui', `Berkas ${file.name} melebihi 50 MB dan dilewati.`);
              continue;
            }
            validIncoming.push(file);
          }
        }

        if (validIncoming.length === 0) {
          Alert.alert('Format Tidak Sesuai', 'Mohon pilih berkas gambar berformat JPG, JPEG, PNG, atau WEBP.');
          return;
        }

        const combined = [...selectedImages, ...validIncoming];
        if (combined.length > MAX_IMAGES_LIMIT) {
          Alert.alert(
            'Batas 20 Gambar',
            `Hanya ${MAX_IMAGES_LIMIT} gambar pertama yang akan diproses ke dalam PDF.`
          );
          setSelectedImages(combined.slice(0, MAX_IMAGES_LIMIT));
        } else {
          setSelectedImages(combined);
        }

        setConvertedResult(null);
      }
    } catch (err) {
      console.warn('Pick images error:', err);
      Alert.alert('Gagal Memilih Gambar', 'Terjadi kesalahan saat mengakses galeri gambar.');
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = selectedImages.filter((_, idx) => idx !== indexToRemove);
    setSelectedImages(updated);
  };

  const handleClearImages = () => {
    setSelectedImages([]);
    setConvertedResult(null);
  };

  const handleConvert = async () => {
    if (isPdfToImage) {
      if (!selectedPdf) {
        Alert.alert('Pilih Berkas PDF', 'Silakan pilih berkas PDF yang ingin dikonversi.');
        return;
      }

      setIsConverting(true);
      setProgress(15);

      try {
        const result = await convertDocumentMobile(
          selectedPdf,
          targetFormat,
          (p) => {
            setProgress(p);
          },
          {
            quality: renderQuality,
            dpi: renderQuality === 'master' ? 600 : renderQuality === 'ultra' ? 300 : 200
          }
        );

        setConvertedResult(result);
        Alert.alert(
          'Konversi Berhasil',
          `Berkas PDF berhasil dikonversi ke gambar ${targetFormat}!`
        );
      } catch (err) {
        console.error('Convert PDF error:', err);
        Alert.alert('Konversi Gagal', `Terjadi kendala: ${err?.message || 'Gagal memproses dokumen.'}`);
      } finally {
        setIsConverting(false);
      }
    } else {
      // Image to PDF mode
      if (selectedImages.length === 0) {
        Alert.alert(
          'Pilih Gambar',
          'Silakan pilih minimal 1 gambar (maksimal 20 gambar) untuk dikonversi ke PDF.'
        );
        return;
      }

      setIsConverting(true);
      setProgress(10);

      try {
        const result = await convertDocumentMobile(selectedImages, 'PDF', (p) => {
          setProgress(p);
        });

        setConvertedResult(result);
        Alert.alert(
          'Konversi Berhasil',
          `${selectedImages.length} gambar berhasil digabungkan menjadi 1 berkas PDF!`
        );
      } catch (err) {
        console.error('Convert Images to PDF error:', err);
        Alert.alert('Konversi Gagal', `Terjadi kendala: ${err?.message || 'Gagal menggabungkan gambar.'}`);
      } finally {
        setIsConverting(false);
      }
    }
  };

  const handleSharePage = async (pageIdx = activePdfPageIdx) => {
    if (convertedResult) {
      const pageItem =
        isPdfToImage && convertedResult.pages && convertedResult.pages[pageIdx]
          ? convertedResult.pages[pageIdx]
          : null;
      const activeFileUri = pageItem ? pageItem.uri : convertedResult.uri;
      const pageNum = pageItem ? pageItem.pageNumber || pageIdx + 1 : pageIdx + 1;

      if (activeFileUri) {
        const mime =
          convertedResult.mimeType ||
          (targetFormat === 'PNG'
            ? 'image/png'
            : targetFormat === 'JPG' || targetFormat === 'JPEG'
            ? 'image/jpeg'
            : 'application/pdf');

        const title = isPdfToImage
          ? `Kirim Gambar Halaman ${pageNum} ke WhatsApp`
          : 'Kirim Dokumen PDF ke WhatsApp';

        const success = await shareFileNative(activeFileUri, mime, title);
        if (!success) {
          Alert.alert('Informasi', 'Fitur pembagian telah dibuka di sistem perangkat Anda.');
        }
      }
    }
  };

  const togglePageSelection = (idx) => {
    setSelectedPageIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      } else {
        return [...prev, idx].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllPages = () => {
    if (convertedResult?.pages) {
      setSelectedPageIndices(convertedResult.pages.map((_, i) => i));
    }
  };

  const handleDeselectAllPages = () => {
    setSelectedPageIndices([]);
  };

  const handleShareSelectedPages = async () => {
    if (!convertedResult?.pages || convertedResult.pages.length === 0) {
      await handleSharePage(0);
      return;
    }

    const pages = convertedResult.pages;
    const selectedList = pages.filter((_, idx) => selectedPageIndices.includes(idx));

    if (selectedList.length === 0) {
      Alert.alert(
        'Pilih Halaman Terlebih Dahulu',
        'Silakan centang minimal 1 lembar halaman pada daftar di atas untuk dikirim ke WhatsApp.'
      );
      return;
    }

    const mime =
      convertedResult.mimeType ||
      (targetFormat === 'PNG' ? 'image/png' : 'image/jpeg');

    abortBatchShareRef.current = false;
    setIsBatchSharing(true);

    try {
      for (let i = 0; i < selectedList.length; i++) {
        if (abortBatchShareRef.current) break;

        const page = selectedList[i];
        const pageNum = page.pageNumber || i + 1;
        setBatchShareProgress({ current: i + 1, total: selectedList.length });

        const title = `Kirim Halaman ${pageNum} (${i + 1}/${selectedList.length} Terpilih) ke WhatsApp`;

        const success = await shareFileNative(page.uri, mime, title);
        if (!success || abortBatchShareRef.current) {
          break;
        }

        // Brief delay between shares for clean OS transition without blocking alert
        if (i < selectedList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      if (!abortBatchShareRef.current) {
        Alert.alert(
          'Semua Halaman Selesai Dikirim! 🎉',
          `Seluruh ${selectedList.length} lembar foto terpilih telah selesai dikirim ke WhatsApp.`
        );
      }
    } finally {
      setIsBatchSharing(false);
      setBatchShareProgress({ current: 0, total: 0 });
    }
  };

  const handleCancelBatchShare = () => {
    abortBatchShareRef.current = true;
    setIsBatchSharing(false);
    setBatchShareProgress({ current: 0, total: 0 });
  };

  const handleShareAllViaWhatsAppGallery = async () => {
    if (!convertedResult) return;
    const pages =
      convertedResult.pages && convertedResult.pages.length > 0
        ? convertedResult.pages
        : [{ uri: convertedResult.uri, pageNumber: 1 }];

    const selectedList = pages.filter((_, idx) => selectedPageIndices.includes(idx));

    if (selectedList.length === 0) {
      Alert.alert(
        'Pilih Halaman Terlebih Dahulu',
        'Silakan centang minimal 1 lembar halaman pada daftar di atas untuk dikirim ke WhatsApp.'
      );
      return;
    }

    setIsSavingStorage(true);
    const cleanBaseName = selectedPdf?.name
      ? selectedPdf.name.replace(/\.[^/.]+$/, '')
      : 'dokumen_placeboo';

    const res = await saveImagesDirectlyToGallery(selectedList, cleanBaseName);
    setIsSavingStorage(false);

    if (res.success) {
      Linking.openURL('whatsapp://').catch(() => {
        Alert.alert('Buka WhatsApp', 'Silakan buka aplikasi WhatsApp di ponsel Anda.');
      });

      Alert.alert(
        'Foto Siap Dikirim di WhatsApp! 📸',
        `Semua ${res.count} foto lembar dokumen telah tersimpan di Galeri Ponsel Anda.\n\nWhatsApp kini telah dibuka:\n1. Buka ruang obrolan tujuan\n2. Ketuk ikon Klip (📎) lalu Galeri\n3. Centang seluruh ${res.count} foto untuk langsung dikirim sekaligus dalam 1 pesan!`,
        [{ text: 'Siap, Mengerti', style: 'default' }]
      );
    } else {
      Alert.alert('Gagal Menyimpan', res.error || 'Terjadi kendala saat menyimpan foto ke galeri.');
    }
  };

  const handleSaveSelectedToDevice = async () => {
    if (!convertedResult) return;
    const pages =
      convertedResult.pages && convertedResult.pages.length > 0
        ? convertedResult.pages
        : [{ uri: convertedResult.uri, pageNumber: 1 }];

    const selectedList = pages.filter((_, idx) => selectedPageIndices.includes(idx));

    if (selectedList.length === 0) {
      Alert.alert(
        'Pilih Halaman Terlebih Dahulu',
        'Silakan centang minimal 1 lembar halaman pada daftar di bawah untuk disimpan ke galeri.'
      );
      return;
    }

    setIsSavingStorage(true);
    const cleanBaseName = selectedPdf?.name
      ? selectedPdf.name.replace(/\.[^/.]+$/, '')
      : 'dokumen_placeboo';

    const res = await saveImagesDirectlyToGallery(selectedList, cleanBaseName);
    setIsSavingStorage(false);

    if (res.success) {
      const pageNumStr = selectedList.map((p) => p.pageNumber).filter(Boolean).join(', ');
      const msg = res.fallbackSAF
        ? `Semua ${res.count} lembar foto yang Anda pilih (${pageNumStr ? `Hal. ${pageNumStr}` : ''}) berhasil di-download dan disimpan ke folder penyimpanan ponsel Anda.`
        : `Semua ${res.count} lembar foto yang Anda pilih (${pageNumStr ? `Hal. ${pageNumStr}` : ''}) berhasil di-download langsung ke Galeri Foto ponsel Anda!\n\nAnda dapat membuka WhatsApp sekarang dan melampirkan seluruh foto tersebut dari galeri.`;

      Alert.alert(
        'Semua Halaman Terpilih Berhasil Di-download!',
        msg,
        [
          { text: 'Tutup', style: 'cancel' },
          {
            text: 'Buka WhatsApp',
            onPress: () => Linking.openURL('whatsapp://').catch(() => {})
          }
        ]
      );
    } else if (res.error && !res.error.includes('dibatalkan')) {
      Alert.alert('Gagal Men-download', res.error);
    }
  };

  const handleDownloadSinglePage = async (pageIdx) => {
    if (!convertedResult) return;
    const pageItem =
      isPdfToImage && convertedResult.pages && convertedResult.pages[pageIdx]
        ? convertedResult.pages[pageIdx]
        : { uri: convertedResult.uri, pageNumber: pageIdx + 1 };

    setIsSavingStorage(true);
    const cleanBaseName = selectedPdf?.name
      ? selectedPdf.name.replace(/\.[^/.]+$/, '')
      : 'dokumen_placeboo';

    const res = await saveImagesDirectlyToGallery([pageItem], cleanBaseName);
    setIsSavingStorage(false);

    if (res.success) {
      const pageNum = pageItem.pageNumber || pageIdx + 1;
      Alert.alert(
        'Berhasil Di-download!',
        `Gambar Halaman ${pageNum} berhasil di-download dan disimpan ke Galeri ponsel Anda!`,
        [
          { text: 'Tutup', style: 'cancel' },
          {
            text: 'Buka WhatsApp',
            onPress: () => Linking.openURL('whatsapp://').catch(() => {})
          }
        ]
      );
    } else if (res.error && !res.error.includes('dibatalkan')) {
      Alert.alert('Gagal Men-download Halaman', res.error);
    }
  };

  const handleShare = async () => {
    await handleSharePage(activePdfPageIdx);
  };

  const handleReset = () => {
    setSelectedPdf(null);
    setSelectedImages([]);
    setConvertedResult(null);
    setProgress(0);
    setActivePdfPageIdx(0);
    setSelectedPageIndices([]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandGroup}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>Placeboo</Text>
          </View>
          <View style={styles.badgeSecure}>
            <MaterialIcons name="lock" size={12} color="#10b981" />
            <Text style={styles.badgeSecureText}>Zero Retention</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Spesialis Konversi PDF ↔ Gambar Cepat, Tajam, &amp; Maks. 20 Gambar ke PDF.
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
          <View style={[styles.modePill, !isPdfToImage && styles.modePillAmber]}>
            <Text style={[styles.modePillText, !isPdfToImage && styles.modePillTextAmber]}>
              {isPdfToImage ? 'PDF → PNG/JPG' : 'Hingga 20 Foto → PDF'}
            </Text>
          </View>
        </View>

        {/* 1. PDF TO IMAGE UPLOAD SECTION */}
        {isPdfToImage && (
          <>
            {!selectedPdf ? (
              <TouchableOpacity style={styles.dropzone} onPress={pickPdfDocument} activeOpacity={0.8}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="picture-as-pdf" size={34} color="#4f46e5" />
                </View>
                <Text style={styles.dropzoneTitle}>Pilih Berkas PDF</Text>
                <Text style={styles.dropzoneSubtitle}>
                  Ketuk untuk memilih berkas PDF dari HP (Maks. 50 MB)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.fileSelectedBox}>
                <View style={styles.fileInfoRow}>
                  <View style={styles.fileIconBox}>
                    <MaterialIcons name="picture-as-pdf" size={26} color="#4f46e5" />
                  </View>
                  <View style={styles.fileTextCol}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {selectedPdf.name}
                    </Text>
                    <Text style={styles.fileSize}>{formatBytes(selectedPdf.size || 0)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPdf(null)}>
                    <MaterialIcons name="close" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btnChangeFile} onPress={pickPdfDocument}>
                  <Text style={styles.btnChangeFileText}>Ganti Berkas PDF</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Target Format Selector for PDF to Image */}
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

            {/* Quality & DPI Selector for PDF to Image */}
            <View style={[styles.formatSection, { marginTop: 10 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.labelSection}>Resolusi Ketajaman Teks:</Text>
                <View style={styles.badgeQuality}>
                  <Text style={styles.badgeQualityText}>
                    {renderQuality === 'master'
                      ? 'Master HD (600 DPI)'
                      : renderQuality === 'ultra'
                      ? 'Ultra HD (300 DPI)'
                      : 'Tinggi (200 DPI)'}
                  </Text>
                </View>
              </View>
              <View style={styles.formatRow}>
                <TouchableOpacity
                  style={[styles.formatChip, renderQuality === 'master' && styles.formatChipActive]}
                  onPress={() => setRenderQuality('master')}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="verified"
                    size={16}
                    color={renderQuality === 'master' ? '#ffffff' : '#4f46e5'}
                  />
                  <Text
                    style={[
                      styles.formatChipText,
                      renderQuality === 'master' && styles.formatChipTextActive
                    ]}
                  >
                    Master HD (600 DPI)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatChip, renderQuality === 'ultra' && styles.formatChipActive]}
                  onPress={() => setRenderQuality('ultra')}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="high-quality"
                    size={16}
                    color={renderQuality === 'ultra' ? '#ffffff' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.formatChipText,
                      renderQuality === 'ultra' && styles.formatChipTextActive
                    ]}
                  >
                    Ultra HD (300 DPI)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formatChip, renderQuality === 'high' && styles.formatChipActive]}
                  onPress={() => setRenderQuality('high')}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="hd"
                    size={16}
                    color={renderQuality === 'high' ? '#ffffff' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.formatChipText,
                      renderQuality === 'high' && styles.formatChipTextActive
                    ]}
                  >
                    Tinggi (200 DPI)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* 2. IMAGE TO PDF MULTI-UPLOAD SECTION */}
        {!isPdfToImage && (
          <>
            {selectedImages.length === 0 ? (
              <TouchableOpacity style={styles.dropzone} onPress={pickImages} activeOpacity={0.8}>
                <View style={[styles.iconCircle, styles.iconCircleAmber]}>
                  <MaterialIcons name="add-photo-alternate" size={34} color="#d97706" />
                </View>
                <Text style={styles.dropzoneTitle}>Pilih Gambar (Maks. 20)</Text>
                <Text style={styles.dropzoneSubtitle}>
                  Bisa pilih banyak gambar sekaligus (JPG, PNG, WEBP). Semua akan digabung ke 1 berkas PDF.
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.multiImagesContainer}>
                {/* Count Header & Controls */}
                <View style={styles.multiHeaderRow}>
                  <View style={styles.countBadge}>
                    <MaterialIcons name="photo-library" size={14} color="#b45309" />
                    <Text style={styles.countBadgeText}>
                      {selectedImages.length} / {MAX_IMAGES_LIMIT} Gambar Dipilih
                    </Text>
                  </View>

                  <View style={styles.multiActionGroup}>
                    {selectedImages.length < MAX_IMAGES_LIMIT && (
                      <TouchableOpacity style={styles.btnAddMore} onPress={pickImages}>
                        <MaterialIcons name="add" size={16} color="#4f46e5" />
                        <Text style={styles.btnAddMoreText}>Tambah</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.btnClearAll} onPress={handleClearImages}>
                      <Text style={styles.btnClearAllText}>Hapus Semua</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* List of Selected Images */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
                  {selectedImages.map((img, idx) => (
                    <View key={idx} style={styles.thumbCard}>
                      <Image source={{ uri: img.uri }} style={styles.thumbImage} resizeMode="cover" />
                      <View style={styles.thumbPageBadge}>
                        <Text style={styles.thumbPageBadgeText}>Hal. {idx + 1}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.thumbDeleteBtn}
                        onPress={() => handleRemoveImage(idx)}
                      >
                        <MaterialIcons name="close" size={14} color="#ffffff" />
                      </TouchableOpacity>
                      <Text style={styles.thumbName} numberOfLines={1}>
                        {img.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Target Format Fixed Info */}
            <View style={styles.formatSection}>
              <Text style={styles.labelSection}>Format Output Terpilih:</Text>
              <View style={styles.formatRow}>
                <View style={[styles.formatChip, styles.formatChipActive]}>
                  <MaterialIcons name="picture-as-pdf" size={16} color="#ffffff" />
                  <Text style={[styles.formatChipText, styles.formatChipTextActive]}>
                    Dokumen PDF Standar (.pdf)
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Progress Bar during conversion */}
        {isConverting && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressText}>
                {isPdfToImage ? 'Memproses Konversi PDF...' : `Menyusun ${selectedImages.length} Halaman PDF...`}
              </Text>
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
                <MaterialIcons name="check-circle" size={28} color="#10b981" />
              </View>
              <View style={styles.successTextCol}>
                <Text style={styles.successTitle}>Konversi Berhasil!</Text>
                <Text style={styles.successFileName} numberOfLines={1}>
                  {isPdfToImage && convertedResult.pages && convertedResult.pages[activePdfPageIdx]
                    ? convertedResult.pages[activePdfPageIdx].fileName
                    : convertedResult.fileName}
                </Text>
                {!isPdfToImage && (
                  <Text style={styles.successPageCountText}>
                    Dokumen berisi {convertedResult.pageCount || selectedImages.length} halaman gambar.
                  </Text>
                )}
                {isPdfToImage && convertedResult.pages && convertedResult.pages.length > 1 && (
                  <Text style={styles.successPageCountText}>
                    Dokumen PDF berhasil dirender ({convertedResult.pages.length} halaman).
                  </Text>
                )}
              </View>
            </View>

            {/* Live Image Preview for PDF to Image */}
            {isPdfToImage && (
              <View style={styles.previewImageContainer}>
                <View style={styles.previewHeaderRow}>
                  <Text style={styles.previewLabel}>Pratinjau Hasil Dokumen Gambar:</Text>
                  {convertedResult.pages && convertedResult.pages.length > 1 && (
                    <View style={styles.previewCounterBadge}>
                      <Text style={styles.previewCounterBadgeText}>
                        Hal {activePdfPageIdx + 1} / {convertedResult.pages.length}
                      </Text>
                    </View>
                  )}
                </View>

                {convertedResult.pages && convertedResult.pages.length > 1 && (
                  <View style={styles.pageSelectorRow}>
                    <TouchableOpacity
                      style={[styles.pageNavBtn, activePdfPageIdx === 0 && styles.pageNavBtnDisabled]}
                      disabled={activePdfPageIdx === 0}
                      onPress={() => setActivePdfPageIdx((prev) => Math.max(0, prev - 1))}
                    >
                      <MaterialIcons
                        name="chevron-left"
                        size={20}
                        color={activePdfPageIdx === 0 ? '#94a3b8' : '#4f46e5'}
                      />
                      <Text
                        style={[
                          styles.pageNavBtnText,
                          activePdfPageIdx === 0 && styles.pageNavBtnTextDisabled
                        ]}
                      >
                        Sebelumnya
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.pageIndicatorText}>
                      Halaman {activePdfPageIdx + 1} dari {convertedResult.pages.length}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.pageNavBtn,
                        activePdfPageIdx >= convertedResult.pages.length - 1 && styles.pageNavBtnDisabled
                      ]}
                      disabled={activePdfPageIdx >= convertedResult.pages.length - 1}
                      onPress={() =>
                        setActivePdfPageIdx((prev) =>
                          Math.min(convertedResult.pages.length - 1, prev + 1)
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.pageNavBtnText,
                          activePdfPageIdx >= convertedResult.pages.length - 1 &&
                            styles.pageNavBtnTextDisabled
                        ]}
                      >
                        Berikutnya
                      </Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={
                          activePdfPageIdx >= convertedResult.pages.length - 1
                            ? '#94a3b8'
                            : '#4f46e5'
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}

                <Image
                  source={{
                    uri:
                      convertedResult.pages && convertedResult.pages[activePdfPageIdx]
                        ? convertedResult.pages[activePdfPageIdx].uri
                        : convertedResult.uri
                  }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {isPdfToImage && convertedResult.pages && convertedResult.pages.length > 1 ? (
              <View style={styles.multiShareContainer}>
                {/* 1. Fitur Pilih Halaman Mana Saja yang Bisa Di-download & Dikirim */}
                <View style={styles.pagesListSection}>
                  <View style={styles.pagesListHeaderRow}>
                    <View style={styles.pagesListHeaderTitleGroup}>
                      <MaterialIcons name="checklist" size={20} color="#0f172a" />
                      <Text style={styles.pagesListTitle}>
                        Pilih Lembar Halaman ({selectedPageIndices.length}/{convertedResult.pages.length} Terpilih)
                      </Text>
                    </View>

                    <View style={styles.selectionQuickButtons}>
                      <TouchableOpacity
                        style={[
                          styles.quickSelectBtn,
                          selectedPageIndices.length === convertedResult.pages.length && styles.quickSelectBtnActive
                        ]}
                        onPress={
                          selectedPageIndices.length === convertedResult.pages.length
                            ? handleDeselectAllPages
                            : handleSelectAllPages
                        }
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name={
                            selectedPageIndices.length === convertedResult.pages.length
                              ? 'check-box'
                              : 'done-all'
                          }
                          size={14}
                          color={
                            selectedPageIndices.length === convertedResult.pages.length
                              ? '#ffffff'
                              : '#4f46e5'
                          }
                        />
                        <Text
                          style={[
                            styles.quickSelectBtnText,
                            selectedPageIndices.length === convertedResult.pages.length &&
                              styles.quickSelectBtnTextActive
                          ]}
                        >
                          {selectedPageIndices.length === convertedResult.pages.length
                            ? 'Batal Semua'
                            : 'Pilih Semua'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.pagesListSub}>
                    Ketuk lembar foto mana saja untuk memilih/mencentang halaman yang ingin Anda download atau kirim:
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pagesListScroll}>
                    {convertedResult.pages.map((p, idx) => {
                      const isActive = idx === activePdfPageIdx;
                      const isSelected = selectedPageIndices.includes(idx);

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.pageCard,
                            isSelected && styles.pageCardSelected,
                            isActive && styles.pageCardActive
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              setActivePdfPageIdx(idx);
                              togglePageSelection(idx);
                            }}
                            style={styles.pageCardPreviewArea}
                            activeOpacity={0.7}
                          >
                            <Image
                              source={{ uri: p.uri }}
                              style={styles.pageCardThumb}
                              resizeMode="contain"
                            />

                            {/* Badge Nomor Halaman di Kiri Atas */}
                            <View
                              style={[
                                styles.pageCardBadge,
                                isSelected && styles.pageCardBadgeSelected
                              ]}
                            >
                              <Text style={styles.pageCardBadgeText}>
                                Hal. {p.pageNumber}
                              </Text>
                            </View>

                            {/* Checkbox Pilihan Halaman di Kanan Atas */}
                            <View
                              style={[
                                styles.pageCardCheckbox,
                                isSelected && styles.pageCardCheckboxSelected
                              ]}
                            >
                              <MaterialIcons
                                name={isSelected ? 'check' : 'add'}
                                size={14}
                                color={isSelected ? '#ffffff' : '#64748b'}
                              />
                            </View>

                            {/* Label Status Terpilih */}
                            <View
                              style={[
                                styles.pageSelectionLabel,
                                isSelected
                                  ? styles.pageSelectionLabelActive
                                  : styles.pageSelectionLabelInactive
                              ]}
                            >
                              <Text
                                style={[
                                  styles.pageSelectionLabelText,
                                  isSelected && styles.pageSelectionLabelTextActive
                                ]}
                              >
                                {isSelected ? '✓ Terpilih' : '+ Ketuk utk Pilih'}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Tombol Aksi Download & Kirim WhatsApp untuk Halaman Ini */}
                          <View style={styles.cardActionRow}>
                            <TouchableOpacity
                              style={styles.btnDownloadCard}
                              onPress={() => handleDownloadSinglePage(idx)}
                              activeOpacity={0.8}
                            >
                              <MaterialIcons name="file-download" size={13} color="#ffffff" />
                              <Text style={styles.btnDownloadCardText}>
                                Unduh
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.btnShareCard}
                              onPress={() => handleSharePage(idx)}
                              activeOpacity={0.8}
                            >
                              <FontAwesome name="whatsapp" size={13} color="#ffffff" />
                              <Text style={styles.btnShareCardText}>
                                WA
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Status Banner Jika Sedang Mengirim Batch ke WA */}
                {isBatchSharing && (
                  <View style={styles.batchSharingBanner}>
                    <ActivityIndicator size="small" color="#15803d" />
                    <Text style={styles.batchSharingText}>
                      Mengirim Halaman {batchShareProgress.current} dari {batchShareProgress.total} ke WhatsApp...
                    </Text>
                    <TouchableOpacity
                      style={styles.btnCancelBatch}
                      onPress={handleCancelBatchShare}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnCancelBatchText}>Batal</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 2. Tombol Download Semua Halaman yang Dipilih Langsung */}
                <TouchableOpacity
                  style={[
                    styles.btnSaveAllStorage,
                    selectedPageIndices.length === 0 && styles.btnActionDisabled
                  ]}
                  onPress={handleSaveSelectedToDevice}
                  disabled={isSavingStorage || selectedPageIndices.length === 0}
                  activeOpacity={0.8}
                >
                  {isSavingStorage ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <MaterialIcons name="file-download" size={26} color="#ffffff" />
                  )}
                  <View style={styles.btnSaveAllStorageContent}>
                    <Text style={styles.btnSaveAllStorageTitle}>
                      {selectedPageIndices.length === convertedResult.pages.length
                        ? `Download Semua (${convertedResult.pages.length}) Halaman yang Dipilih Langsung`
                        : selectedPageIndices.length > 0
                        ? `Download (${selectedPageIndices.length}) Halaman yang Dipilih Langsung`
                        : 'Pilih Halaman untuk Di-download Langsung'}
                    </Text>
                    <Text style={styles.btnSaveAllStorageSub}>
                      {selectedPageIndices.length > 0
                        ? `Download & simpan ${
                            selectedPageIndices.length === convertedResult.pages.length
                              ? `seluruh ${convertedResult.pages.length} lembar file foto`
                              : `${selectedPageIndices.length} lembar terpilih (Hal. ${selectedPageIndices
                                  .map((i) => convertedResult.pages[i]?.pageNumber || i + 1)
                                  .join(', ')})`
                          } sekaligus langsung ke Galeri / Download HP`
                        : 'Centang lembar halaman di atas yang ingin Anda download ke galeri'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Tombol Kirim Langsung Semua Halaman ke WhatsApp */}
                <TouchableOpacity
                  style={[
                    styles.btnShareWhatsAppPrimary,
                    (selectedPageIndices.length === 0 || isBatchSharing) && styles.btnActionDisabled
                  ]}
                  onPress={handleShareSelectedPages}
                  disabled={selectedPageIndices.length === 0 || isBatchSharing}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="whatsapp" size={26} color="#ffffff" />
                  <View style={styles.btnShareWhatsAppPrimaryContent}>
                    <Text style={styles.btnShareWhatsAppPrimaryTitle}>
                      {selectedPageIndices.length === convertedResult.pages.length
                        ? 'Kirim Langsung Semua Halaman ke WhatsApp'
                        : selectedPageIndices.length > 0
                        ? `Kirim Langsung (${selectedPageIndices.length}) Halaman ke WhatsApp`
                        : 'Pilih Halaman untuk Dikirim ke WhatsApp'}
                    </Text>
                    <Text style={styles.btnShareWhatsAppPrimarySub}>
                      {selectedPageIndices.length > 0
                        ? `Kirim otomatis ${selectedPageIndices.length} halaman terpilih satu per satu tanpa jeda konfirmasi`
                        : 'Centang lembar halaman di atas yang ingin Anda kirim ke WhatsApp'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Tombol Kirim Sekaligus Semua Foto via Galeri WhatsApp */}
                <TouchableOpacity
                  style={[
                    styles.btnShareWhatsAppGroup,
                    selectedPageIndices.length === 0 && styles.btnActionDisabled
                  ]}
                  onPress={handleShareAllViaWhatsAppGallery}
                  disabled={selectedPageIndices.length === 0}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="photo-library" size={22} color="#15803d" />
                  <View style={styles.btnShareWhatsAppGroupContent}>
                    <Text style={styles.btnShareWhatsAppGroupTitle}>
                      Kirim Sekaligus Semua Foto (via Galeri WhatsApp)
                    </Text>
                    <Text style={styles.btnShareWhatsAppGroupSub}>
                      Simpan {selectedPageIndices.length} foto ke Galeri & buka WhatsApp untuk lampirkan semua dalam 1 pesan
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 5. Tombol Kirim Halaman Aktif Saja ke WhatsApp */}
                <TouchableOpacity
                  style={styles.btnShareWhatsAppSingle}
                  onPress={() => handleSharePage(activePdfPageIdx)}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="whatsapp" size={18} color="#15803d" />
                  <Text style={styles.btnShareWhatsAppSingleText}>
                    Kirim Halaman {activePdfPageIdx + 1} Saja ke WhatsApp (Hal. {activePdfPageIdx + 1} dari {convertedResult.pages.length})
                  </Text>
                </TouchableOpacity>

                {/* 6. Reset Button */}
                <TouchableOpacity style={styles.btnResetFull} onPress={handleReset}>
                  <MaterialIcons name="refresh" size={18} color="#475569" />
                  <Text style={styles.btnResetFullText}>Konversi Dokumen Lain</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.multiShareContainer}>
                {isPdfToImage && (
                  <TouchableOpacity
                    style={styles.btnSaveAllStorage}
                    onPress={handleSaveSelectedToDevice}
                    disabled={isSavingStorage}
                    activeOpacity={0.8}
                  >
                    {isSavingStorage ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <MaterialIcons name="file-download" size={24} color="#ffffff" />
                    )}
                    <View style={styles.btnSaveAllStorageContent}>
                      <Text style={styles.btnSaveAllStorageTitle}>
                        Download / Simpan Gambar di Galeri
                      </Text>
                      <Text style={styles.btnSaveAllStorageSub}>
                        Download foto dokumen langsung ke Galeri Foto HP Anda
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <View style={styles.successActionRow}>
                  <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
                    <FontAwesome name="whatsapp" size={20} color="#ffffff" />
                    <Text style={styles.btnShareText}>
                      {isPdfToImage ? 'Kirim Gambar ke WhatsApp' : 'Kirim Berkas PDF ke WhatsApp'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnResetSmall} onPress={handleReset}>
                    <MaterialIcons name="refresh" size={18} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        {!convertedResult && (
          <TouchableOpacity
            style={[
              styles.btnConvert,
              (isConverting ||
                (isPdfToImage && !selectedPdf) ||
                (!isPdfToImage && selectedImages.length === 0)) &&
                styles.btnDisabled
            ]}
            onPress={handleConvert}
            disabled={
              isConverting ||
              (isPdfToImage && !selectedPdf) ||
              (!isPdfToImage && selectedImages.length === 0)
            }
            activeOpacity={0.8}
          >
            {isConverting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="bolt" size={20} color="#ffffff" />
                <Text style={styles.btnConvertText}>
                  {isPdfToImage
                    ? 'Mulai Konversi PDF ke Gambar'
                    : selectedImages.length > 0
                    ? `Gabungkan ${selectedImages.length} Gambar Menjadi PDF`
                    : 'Pilih Gambar Terlebih Dahulu'}
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
              <Text style={styles.modeCardTag}>Hingga 20 Gambar → PDF</Text>
              {!isPdfToImage && (
                <View style={[styles.activeIndicator, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                  <Text style={[styles.activeIndicatorText, { color: '#b45309' }]}>Aktif</Text>
                </View>
              )}
            </View>
            <Text style={styles.modeCardTitle}>Gambar ke PDF (Maks. 20)</Text>
            <Text style={styles.modeCardDesc}>
              Kemas hingga 20 foto/gambar menjadi 1 berkas PDF rapi siap cetak.
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
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  brandLogo: {
    width: 34,
    height: 34
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
  modePillAmber: {
    backgroundColor: '#fef3c7'
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca'
  },
  modePillTextAmber: {
    color: '#b45309'
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
  multiImagesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  multiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e'
  },
  multiActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnAddMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  btnAddMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca'
  },
  btnClearAll: {
    paddingHorizontal: 6,
    paddingVertical: 4
  },
  btnClearAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444'
  },
  thumbScroll: {
    flexDirection: 'row'
  },
  thumbCard: {
    width: 90,
    marginRight: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    position: 'relative'
  },
  thumbImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    backgroundColor: '#e2e8f0'
  },
  thumbPageBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4
  },
  thumbPageBadgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700'
  },
  thumbDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2
  },
  thumbName: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
    textAlign: 'center'
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
  badgeQuality: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  badgeQualityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669'
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
  successPageCountText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
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
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46'
  },
  previewCounterBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  previewCounterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857'
  },
  pageSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6
  },
  pageNavBtnDisabled: {
    opacity: 0.4
  },
  pageNavBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5'
  },
  pageNavBtnTextDisabled: {
    color: '#94a3b8'
  },
  pageIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  previewImage: {
    width: '100%',
    height: 320,
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  successActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
  btnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10
  },
  btnShareText: {
    color: '#ffffff',
    fontSize: 14,
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
  multiShareContainer: {
    gap: 12,
    marginTop: 8
  },
  btnShareWhatsAppPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4
  },
  btnShareWhatsAppPrimaryContent: {
    flex: 1
  },
  btnShareWhatsAppPrimaryTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  btnShareWhatsAppPrimarySub: {
    color: '#f0fdf4',
    fontSize: 11,
    marginTop: 2
  },
  btnShareWhatsAppSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#86efac',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  btnShareWhatsAppSingleText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700'
  },
  batchSharingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dcfce7',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8
  },
  batchSharingText: {
    flex: 1,
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700'
  },
  btnCancelBatch: {
    backgroundColor: '#ef4444',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  btnCancelBatchText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  btnShareWhatsAppGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  btnShareWhatsAppGroupContent: {
    flex: 1
  },
  btnShareWhatsAppGroupTitle: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '800'
  },
  btnShareWhatsAppGroupSub: {
    color: '#166534',
    fontSize: 11,
    marginTop: 2
  },
  btnSaveAllStorage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4
  },
  btnSaveAllStorageContent: {
    flex: 1
  },
  btnSaveAllStorageTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  btnSaveAllStorageSub: {
    color: '#e0f2fe',
    fontSize: 11,
    marginTop: 2
  },
  btnActionDisabled: {
    opacity: 0.55
  },
  pagesListSection: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  pagesListHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  pagesListHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  pagesListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  selectionQuickButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quickSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#eef2ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c7d2fe'
  },
  quickSelectBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4338ca'
  },
  quickSelectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5'
  },
  quickSelectBtnTextActive: {
    color: '#ffffff'
  },
  pagesListSub: {
    fontSize: 11,
    color: '#64748b'
  },
  pagesListScroll: {
    paddingVertical: 4
  },
  pageCard: {
    width: 136,
    marginRight: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    gap: 6
  },
  pageCardActive: {
    borderColor: '#4f46e5'
  },
  pageCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4'
  },
  pageCardPreviewArea: {
    width: '100%',
    alignItems: 'center'
  },
  pageCardThumb: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    backgroundColor: '#f1f5f9'
  },
  pageCardBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  pageCardBadgeSelected: {
    backgroundColor: '#047857'
  },
  pageCardBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  pageCardCheckbox: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  pageCardCheckboxSelected: {
    backgroundColor: '#10b981',
    borderColor: '#059669'
  },
  pageSelectionLabel: {
    width: '100%',
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pageSelectionLabelActive: {
    backgroundColor: '#dcfce7'
  },
  pageSelectionLabelInactive: {
    backgroundColor: '#f1f5f9'
  },
  pageSelectionLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  pageSelectionLabelTextActive: {
    color: '#15803d'
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    marginTop: 2
  },
  btnDownloadCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#0284c7',
    paddingVertical: 7,
    borderRadius: 6
  },
  btnDownloadCardText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  btnShareCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#25D366',
    paddingVertical: 7,
    borderRadius: 6
  },
  btnShareCardText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  btnResetFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 8
  },
  btnResetFullText: {
    color: '#475569',
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
    opacity: 0.55
  },
  btnConvertText: {
    color: '#ffffff',
    fontSize: 14,
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
