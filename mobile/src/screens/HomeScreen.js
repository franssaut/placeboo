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

const MAX_IMAGES_LIMIT = 20;

export default function HomeScreen({ mode = 'pdf_to_image', onModeChange }) {
  const [activeMode, setActiveMode] = useState(mode);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [targetFormat, setTargetFormat] = useState('PNG');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState(null);
  const [activePdfPageIdx, setActivePdfPageIdx] = useState(0);

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

  // Pick PDF (Single file)
  const pickPdfDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
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
        if (ext !== 'pdf') {
          Alert.alert(
            'Berkas Tidak Sesuai',
            'Silakan pilih berkas dokumen berformat PDF untuk mode PDF ke Gambar.'
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
      const remainingSlots = MAX_IMAGES_LIMIT - selectedImages.length;
      if (remainingSlots <= 0) {
        Alert.alert(
          'Batas Maksimal Terpenuhi',
          `Anda telah memilih batas maksimal ${MAX_IMAGES_LIMIT} gambar.`
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
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
        const result = await convertDocumentMobile(selectedPdf, targetFormat, (p) => {
          setProgress(p);
        });

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

  const handleShare = async () => {
    if (convertedResult) {
      const activeFileUri =
        isPdfToImage && convertedResult.pages && convertedResult.pages[activePdfPageIdx]
          ? convertedResult.pages[activePdfPageIdx].uri
          : convertedResult.uri;

      if (activeFileUri) {
        const mime =
          convertedResult.mimeType ||
          (targetFormat === 'PNG'
            ? 'image/png'
            : targetFormat === 'JPG' || targetFormat === 'JPEG'
            ? 'image/jpeg'
            : 'application/pdf');

        const success = await shareFileNative(activeFileUri, mime);
        if (!success) {
          Alert.alert('Informasi', 'Fitur penyimpanan berkas telah dibuka di sistem perangkat Anda.');
        }
      }
    }
  };

  const handleShareStitched = async () => {
    if (convertedResult?.stitchedUri) {
      const mime =
        convertedResult.mimeType ||
        (targetFormat === 'JPG' || targetFormat === 'JPEG' ? 'image/jpeg' : 'image/png');
      const success = await shareFileNative(convertedResult.stitchedUri, mime);
      if (!success) {
        Alert.alert('Informasi', 'Fitur penyimpanan gambar utuh telah dibuka di perangkat Anda.');
      }
    }
  };

  const handleReset = () => {
    setSelectedPdf(null);
    setSelectedImages([]);
    setConvertedResult(null);
    setProgress(0);
    setActivePdfPageIdx(0);
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
                {/* 1. Primary Share Action: 1 Gambar Utuh (Semua Halaman) */}
                {convertedResult.stitchedUri ? (
                  <TouchableOpacity
                    style={styles.btnShareAllImage}
                    onPress={handleShareStitched}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="photo-library" size={22} color="#ffffff" />
                    <View style={styles.btnShareAllImageContent}>
                      <Text style={styles.btnShareAllImageTitle}>
                        Bagikan Semua Halaman (1 Gambar Utuh)
                      </Text>
                      <Text style={styles.btnShareAllImageSub}>
                        Kirim gambar bersambung ke WhatsApp/Telegram (Bisa langsung dibuka di chat)
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                {/* 2. Row: Share current preview page & Reset */}
                <View style={styles.secondaryShareRow}>
                  <TouchableOpacity
                    style={styles.btnShareSecondary}
                    onPress={handleShare}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="share" size={16} color="#4338ca" />
                    <Text style={styles.btnShareSecondaryText}>
                      Bagikan Halaman {activePdfPageIdx + 1} Saja
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnResetSmall}
                    onPress={handleReset}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="refresh" size={18} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.successActionRow}>
                <TouchableOpacity style={styles.btnShare} onPress={handleShare}>
                  <MaterialIcons name="share" size={18} color="#ffffff" />
                  <Text style={styles.btnShareText}>Buka / Bagikan Berkas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnResetSmall} onPress={handleReset}>
                  <MaterialIcons name="refresh" size={18} color="#475569" />
                </TouchableOpacity>
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
  multiShareContainer: {
    gap: 8,
    marginTop: 6
  },
  btnShareAllImage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  btnShareAllImageContent: {
    flex: 1
  },
  btnShareAllImageTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  btnShareAllImageSub: {
    color: '#e0e7ff',
    fontSize: 10,
    marginTop: 2
  },
  secondaryShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnShareSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingVertical: 9,
    borderRadius: 8
  },
  btnShareSecondaryText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '700'
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
