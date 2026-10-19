const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'stitch_document_converter_web_app');

const supabaseScripts = `
  <!-- Supabase JS SDK & Client -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="assets/js/supabaseClient.js"></script>
  <script src="assets/js/app.js"></script>
`;

// 1. Process index.html
function buildIndex() {
  let html = fs.readFileSync(path.join(srcDir, 'documorph_beranda_konverter_dokumen', 'code.html'), 'utf8');

  // Brand & navigation
  html = html.replace('<a class="flex items-center gap-space-sm flex-shrink-0" href="#">', '<a class="flex items-center gap-space-sm flex-shrink-0" href="index.html">');
  html = html.replace('data-path="semua-alat" href="#"', 'data-path="semua-alat" href="semua-alat.html"');
  html = html.replace('data-path="konversi-pdf" href="#"', 'data-path="konversi-pdf" href="index.html"');
  html = html.replace('data-path="batch-queue" href="#"', 'data-path="batch-queue" href="batch-queue.html"');
  html = html.replace('data-path="riwayat-dan-unduhan" href="#"', 'data-path="riwayat-dan-unduhan" href="riwayat-unduhan.html"');

  // Explore all tools link
  html = html.replace(/href="#"(\s+class="[^"]*group")/g, 'href="semua-alat.html"$1');
  html = html.replace(/href="#"(\s+class="font-label-md text-label-md text-primary)/g, 'href="semua-alat.html"$1');

  // Supabase-integrated startConversionSim
  const oldSim = "function startConversionSim() {";
  const newSim = `async function startConversionSim() {
    if (selectedFiles.length === 0) {
      alert('Silakan pilih atau tarik minimal 1 berkas terlebih dahulu untuk memulai konversi.');
      return;
    }
    const targetFormat = document.getElementById('targetFormat').value;
    const queueData = [];
    
    for (const f of selectedFiles) {
      const job = {
        filename: f.name,
        file_size: f.size,
        source_format: f.name.split('.').pop().toUpperCase(),
        target_format: targetFormat,
        status: 'queued',
        progress: 0
      };
      if (typeof addConversionToSupabase === 'function') {
        const saved = await addConversionToSupabase(job);
        queueData.push(saved);
      } else {
        queueData.push(job);
      }
    }
    
    sessionStorage.setItem('placeboo_custom_queue', JSON.stringify(queueData));
    if (typeof showToast === 'function') {
      showToast('Menyimpan antrean ke Supabase & mengalihkan...');
    }
    setTimeout(() => {
      window.location.href = 'batch-queue.html';
    }, 400);
  }
  function legacy_startConversionSim() {`;

  html = html.replace(oldSim, newSim);

  // URL parameter reader for target format
  const initScript = `
  window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const fmt = params.get('format');
    if (fmt) {
      const select = document.getElementById('targetFormat');
      if (select) {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value.toUpperCase() === fmt.toUpperCase()) {
            select.selectedIndex = i;
            break;
          }
        }
      }
    }
  });
  `;

  html = html.replace('</script></main>', initScript + '</script>' + supabaseScripts + '</main>');

  fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
  console.log('Built index.html with Supabase integration');
}

// 2. Process semua-alat.html
function buildKatalog() {
  let html = fs.readFileSync(path.join(srcDir, 'documorph_katalog_lengkap_seluruh_alat_dokumen', 'code.html'), 'utf8');

  // Brand & navigation
  html = html.replace('<a class="flex items-center gap-space-sm flex-shrink-0" href="#">', '<a class="flex items-center gap-space-sm flex-shrink-0" href="index.html">');
  html = html.replace('data-path="semua-alat" href="#"', 'data-path="semua-alat" href="semua-alat.html"');
  html = html.replace('data-path="konversi-pdf" href="#"', 'data-path="konversi-pdf" href="index.html"');
  html = html.replace('data-path="batch-queue" href="#"', 'data-path="batch-queue" href="batch-queue.html"');
  html = html.replace('data-path="riwayat-dan-unduhan" href="#"', 'data-path="riwayat-dan-unduhan" href="riwayat-unduhan.html"');

  const cardClickScript = `
  window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      const searchInput = document.getElementById('toolSearchInput');
      if (searchInput) {
        searchInput.value = q;
        searchInput.dispatchEvent(new Event('input'));
      }
    }

    document.querySelectorAll('.tool-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.getAttribute('href') !== '#') return;
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        let format = 'PDF';
        if (title.includes('word') || title.includes('docx')) format = 'DOCX';
        else if (title.includes('excel') || title.includes('xlsx')) format = 'XLSX';
        else if (title.includes('ppt')) format = 'PPTX';
        else if (title.includes('jpg') || title.includes('gambar')) format = 'JPG';
        else if (title.includes('png')) format = 'PNG';
        else if (title.includes('ocr') || title.includes('teks')) format = 'TXT';
        
        window.location.href = 'index.html?format=' + format;
      });
    });
  });
  `;

  html = html.replace('</script></main>', cardClickScript + '</script>' + supabaseScripts + '</main>');

  fs.writeFileSync(path.join(__dirname, 'semua-alat.html'), html, 'utf8');
  console.log('Built semua-alat.html with Supabase integration');
}

// 3. Process batch-queue.html
function buildBatchQueue() {
  let html = fs.readFileSync(path.join(srcDir, 'documorph_batch_queue_pemrosesan', 'code.html'), 'utf8');

  // Brand & navigation
  html = html.replace('<a class="flex items-center gap-space-sm flex-shrink-0" href="#">', '<a class="flex items-center gap-space-sm flex-shrink-0" href="index.html">');
  html = html.replace('data-path="semua-alat" href="#"', 'data-path="semua-alat" href="semua-alat.html"');
  html = html.replace('data-path="konversi-pdf" href="#"', 'data-path="konversi-pdf" href="index.html"');
  html = html.replace('data-path="batch-queue" href="#"', 'data-path="batch-queue" href="batch-queue.html"');
  html = html.replace('data-path="riwayat-dan-unduhan" href="#"', 'data-path="riwayat-dan-unduhan" href="riwayat-unduhan.html"');

  // Breadcrumb home link
  html = html.replace('<a class="hover:text-primary transition-colors flex items-center gap-1" href="#">', '<a class="hover:text-primary transition-colors flex items-center gap-1" href="index.html">');

  // Update session ID display with persistent session ID
  html = html.replace('Session #DM-88219', 'Session #<span id="session-display">DM-88219</span>');

  // Post-conversion action button: download ZIP or go to results
  html = html.replace('<button class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all" type="button">', '<button onclick="triggerDownload(\'Placeboo_Batch_Converted_Files.zip\')" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all" type="button">');

  // Container marker for dynamic file rows
  html = html.replace('<div class="space-y-space-sm">', '<div class="space-y-space-sm" id="batch-items-container">');

  // Dynamic Batch Queue with Supabase Sync
  const batchScript = `
  <script>
    (async function() {
      // Set session display
      const sessionDisplay = document.getElementById('session-display');
      if (sessionDisplay && typeof getSessionId === 'function') {
        sessionDisplay.innerText = getSessionId();
      }

      // Load conversions from Supabase
      let items = [];
      if (typeof fetchConversionsFromSupabase === 'function') {
        items = await fetchConversionsFromSupabase();
      }

      const container = document.getElementById('batch-items-container');
      
      // Helper function to render items
      function renderBatchQueue(list) {
        if (!container || !list || list.length === 0) return;
        container.innerHTML = '';

        list.forEach((item, index) => {
          const ext = (item.source_format || item.ext || 'DOC').toUpperCase();
          const target = (item.target_format || item.targetFormat || 'PDF').toUpperCase();
          const progress = item.progress || (item.status === 'completed' ? 100 : Math.min(95, 20 + index * 25));
          const isDone = progress >= 100 || item.status === 'completed';

          let badgeBg = 'bg-surface-container text-primary';
          if (ext === 'PDF') badgeBg = 'bg-error-container text-error';
          else if (ext === 'PPTX') badgeBg = 'bg-secondary-fixed text-on-secondary-fixed';
          else if (ext === 'XLSX') badgeBg = 'bg-tertiary-container/15 text-tertiary';
          else if (ext === 'JPG' || ext === 'PNG') badgeBg = 'bg-surface-container-high text-on-surface-variant';

          const sizeStr = item.file_size ? (typeof formatBytes === 'function' ? formatBytes(item.file_size) : (item.file_size / 1000000).toFixed(1) + ' MB') : '5.2 MB';

          const card = document.createElement('div');
          card.className = 'rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-3 transition-all hover:shadow-md';
          card.id = 'batch-item-' + (item.id || index);
          card.innerHTML = \`
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div class="flex items-center gap-space-sm min-w-0">
                <span class="material-symbols-outlined text-on-surface-variant cursor-grab text-[20px] select-none">drag_indicator</span>
                <div class="w-10 h-10 rounded-lg \${badgeBg} flex items-center justify-center flex-shrink-0 font-code-mono text-code-mono font-bold">
                  \${ext}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[240px] md:max-w-xs">\${item.filename || item.name}</span>
                    \${isDone ? '<span class="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>' : '<span class="material-symbols-outlined text-[16px] text-primary animate-spin">refresh</span>'}
                  </div>
                  <div class="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                    <span>\${sizeStr}</span>
                    <span>•</span>
                    <span class="font-code-mono text-code-mono text-on-surface-variant">Target: \${target}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between md:justify-end gap-space-md flex-shrink-0">
                <div class="text-right">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded \${isDone ? 'bg-tertiary-container/15 text-tertiary' : 'bg-surface-container text-primary'} font-label-sm text-label-sm font-medium status-badge">
                    \${isDone ? '<span class="material-symbols-outlined text-[14px]">task_alt</span> Siap Diunduh' : 'Mengonversi (' + progress + '%)'}
                  </span>
                  <p class="font-code-mono text-code-mono text-on-surface-variant pt-0.5 time-left">\${isDone ? '100% Selesai' : 'Sisa ~' + Math.max(2, Math.floor((100 - progress) / 5)) + 's'}</p>
                </div>
                <div class="flex items-center gap-1.5">
                  \${isDone ? \`
                    <button onclick="triggerDownload('\${item.filename || 'dokumen.' + target.toLowerCase()}')" class="w-9 h-9 rounded-lg bg-surface-container-low text-primary hover:bg-surface-container flex items-center justify-center transition-colors shadow-sm" title="Unduh Berkas">
                      <span class="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    <button onclick="window.location.href='riwayat-unduhan.html'" class="w-9 h-9 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors" title="Pratinjau">
                      <span class="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                  \` : \`
                    <button class="w-9 h-9 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors pause-btn" title="Jeda">
                      <span class="material-symbols-outlined text-[18px]">pause</span>
                    </button>
                    <button onclick="handleDeleteRow('\${item.id || index}')" class="w-9 h-9 rounded-lg bg-surface-container-low text-error hover:bg-error-container flex items-center justify-center transition-colors" title="Batalkan">
                      <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  \`}
                </div>
              </div>
            </div>
            <div class="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
              <div class="h-full rounded-full \${isDone ? 'bg-tertiary' : 'bg-primary-container'} transition-all duration-300 item-progress-bar" style="width: \${progress}%"></div>
            </div>
          \`;
          container.appendChild(card);
        });
      }

      renderBatchQueue(items);

      // Realtime listener
      window.addEventListener('placeboo:conversions-updated', async () => {
        const fresh = await fetchConversionsFromSupabase();
        renderBatchQueue(fresh);
      });

      // Overall Progress simulation
      let overallProgress = 78;
      const progressBar = document.querySelector('.h-full.rounded-full.bg-gradient-to-r');
      const progressText = document.querySelector('.font-code-mono.text-code-mono.text-primary.font-bold.text-body-lg');
      let isPaused = false;

      const progressInterval = setInterval(async () => {
        if (!isPaused && overallProgress < 100) {
          overallProgress += Math.floor(Math.random() * 3) + 1;
          if (overallProgress > 100) overallProgress = 100;
          if (progressBar) progressBar.style.width = overallProgress + '%';
          if (progressText) progressText.innerText = overallProgress + '% Selesai';

          // Progressively advance items
          document.querySelectorAll('#batch-items-container .rounded-xl').forEach((row, i) => {
            const pBar = row.querySelector('.item-progress-bar');
            const pBadge = row.querySelector('.status-badge');
            const pTime = row.querySelector('.time-left');
            if (pBar && !row.dataset.done) {
              let currentW = parseInt(pBar.style.width) || 50;
              if (currentW < 100) {
                currentW = Math.min(100, currentW + 4);
                pBar.style.width = currentW + '%';
                if (currentW >= 100) {
                  row.dataset.done = '1';
                  pBar.className = 'h-full rounded-full bg-tertiary transition-all duration-300 item-progress-bar';
                  if (pBadge) {
                    pBadge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm font-medium';
                    pBadge.innerHTML = '<span class="material-symbols-outlined text-[14px]">task_alt</span> Siap Diunduh';
                  }
                  if (pTime) pTime.innerText = '100% Selesai';
                  
                  // Update Supabase
                  if (items[i] && typeof updateConversionProgress === 'function') {
                    updateConversionProgress(items[i].id, 100, 'completed');
                  }
                } else {
                  if (pBadge) pBadge.innerText = 'Mengonversi (' + currentW + '%)';
                  if (pTime) pTime.innerText = 'Sisa ~' + Math.max(1, Math.floor((100 - currentW) / 5)) + 's';
                }
              }
            }
          });

          if (overallProgress === 100) {
            clearInterval(progressInterval);
            if (typeof showToast === 'function') {
              showToast('Semua berkas batch di Supabase selesai dikonversi!');
            }
            const ctaBtn = document.querySelector('button[onclick*="triggerDownload"]');
            if (ctaBtn && !document.getElementById('view-results-btn')) {
              const viewBtn = document.createElement('a');
              viewBtn.id = 'view-results-btn';
              viewBtn.href = 'riwayat-unduhan.html';
              viewBtn.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container transition-all ml-2 animate-bounce';
              viewBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">download_done</span> Buka Halaman Unduhan';
              ctaBtn.parentNode.appendChild(viewBtn);
            }
          }
        }
      }, 900);

      // Global control buttons
      const pauseAllBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Jeda Semua'));
      if (pauseAllBtn) {
        pauseAllBtn.addEventListener('click', () => {
          isPaused = !isPaused;
          pauseAllBtn.innerHTML = isPaused ? 
            '<span class="material-symbols-outlined text-[18px]">play_arrow</span> Lanjutkan Semua' :
            '<span class="material-symbols-outlined text-[18px]">pause</span> Jeda Semua';
          if (typeof showToast === 'function') {
            showToast(isPaused ? 'Semua proses antrean dijeda.' : 'Proses antrean dilanjutkan.');
          }
        });
      }

      const cancelAllBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Batalkan Semua'));
      if (cancelAllBtn) {
        cancelAllBtn.addEventListener('click', async () => {
          if (confirm('Apakah Anda yakin ingin membatalkan semua antrean konversi di Supabase?')) {
            isPaused = true;
            document.querySelectorAll('#batch-items-container .rounded-xl').forEach(row => {
              row.style.opacity = '0.4';
            });
            if (typeof purgeAllConversionsFromSupabase === 'function') {
              await purgeAllConversionsFromSupabase();
            }
            if (typeof showToast === 'function') {
              showToast('Semua proses telah dibatalkan & dibersihkan dari server.', 'error');
            }
          }
        });
      }

      const addFileBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tambah Berkas'));
      if (addFileBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        addFileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          for (const f of files) {
            const job = {
              filename: f.name,
              file_size: f.size,
              source_format: f.name.split('.').pop().toUpperCase(),
              target_format: 'PDF',
              status: 'queued',
              progress: 0
            };
            if (typeof addConversionToSupabase === 'function') {
              await addConversionToSupabase(job);
            }
          }
          const updated = await fetchConversionsFromSupabase();
          renderBatchQueue(updated);
          if (typeof showToast === 'function') {
            showToast(files.length + ' berkas baru berhasil ditambahkan ke Supabase.');
          }
        });
      }

      window.handleDeleteRow = async function(id) {
        const row = document.getElementById('batch-item-' + id);
        if (row) {
          row.style.opacity = '0.3';
          setTimeout(() => row.remove(), 200);
        }
        if (typeof deleteConversionFromSupabase === 'function') {
          await deleteConversionFromSupabase(id);
        }
        if (typeof showToast === 'function') {
          showToast('Berkas dihapus dari antrean.');
        }
      };
    })();
  </script>
  ${supabaseScripts}
  `;

  html = html.replace('</body></html>', batchScript + '</body></html>');

  fs.writeFileSync(path.join(__dirname, 'batch-queue.html'), html, 'utf8');
  console.log('Built batch-queue.html with Supabase integration');
}

// 4. Process riwayat-unduhan.html
function buildRiwayatUnduhan() {
  let html = fs.readFileSync(path.join(srcDir, 'documorph_hasil_unduhan_dokumen', 'code.html'), 'utf8');

  // Brand & navigation
  html = html.replace('<a class="flex items-center gap-space-sm flex-shrink-0" href="#">', '<a class="flex items-center gap-space-sm flex-shrink-0" href="index.html">');
  html = html.replace('data-path="semua-alat" href="#"', 'data-path="semua-alat" href="semua-alat.html"');
  html = html.replace('data-path="konversi-pdf" href="#"', 'data-path="konversi-pdf" href="index.html"');
  html = html.replace('data-path="batch-queue" href="#"', 'data-path="batch-queue" href="batch-queue.html"');
  html = html.replace('data-path="riwayat-dan-unduhan" href="#"', 'data-path="riwayat-dan-unduhan" href="riwayat-unduhan.html"');

  // Container marker for download cards list
  html = html.replace('<div class="space-y-2">', '<div class="space-y-2" id="download-items-container">');

  // Supabase integrated logic
  const resultsScript = `
  <script>
    (async function() {
      // Load files from Supabase
      let items = [];
      if (typeof fetchConversionsFromSupabase === 'function') {
        items = await fetchConversionsFromSupabase();
      }

      const container = document.getElementById('download-items-container');

      function renderDownloadItems(list) {
        if (!container || !list || list.length === 0) return;
        container.innerHTML = '';

        list.forEach((item, index) => {
          const ext = (item.target_format || item.targetFormat || 'DOCX').toUpperCase();
          const origExt = (item.source_format || item.ext || 'PDF').toUpperCase();
          const origSize = item.file_size ? (item.file_size / 1000000).toFixed(1) + ' MB' : '10.5 MB';
          const resultSize = item.result_size ? (item.result_size / 1000000).toFixed(1) + ' MB' : '3.8 MB';
          const isFirst = index === 0;

          let badgeBg = 'bg-primary-fixed text-primary';
          if (ext === 'XLSX') badgeBg = 'bg-tertiary-container/15 text-tertiary';
          else if (ext === 'PDF') badgeBg = 'bg-error-container text-error';
          else if (ext === 'PPTX') badgeBg = 'bg-secondary-fixed text-on-secondary-fixed';

          const card = document.createElement('div');
          card.className = \`p-space-md rounded-xl \${isFirst ? 'bg-surface-container-low/70 ring-2 ring-primary/40' : 'bg-surface-container-lowest shadow-sm'} hover:bg-surface-container-low transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md download-item-row\`;
          card.id = 'download-card-' + (item.id || index);
          card.innerHTML = \`
            <div class="flex items-center gap-space-sm min-w-0">
              <span class="w-10 h-10 rounded-lg \${badgeBg} flex items-center justify-center font-code-mono font-bold text-code-mono flex-shrink-0">\${ext}</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-label-md text-label-md text-on-surface font-semibold truncate item-title">\${item.filename || item.name}</span>
                  \${isFirst ? '<span class="px-1.5 py-0.5 rounded bg-surface-container text-primary font-code-mono text-[10px] uppercase font-bold preview-badge">Sedang Dilihat</span>' : ''}
                </div>
                <div class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                  <span>Dari: \${origExt} (\${origSize})</span>
                  <span>•</span>
                  <span class="text-on-surface font-medium">Hasil: \${resultSize}</span>
                  <span>•</span>
                  <span class="text-tertiary font-semibold">Siap Diunduh</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 self-end md:self-center">
              <button onclick="handlePreviewItem('\${item.filename}', '\${ext}', '\${origExt}', '\${origSize}', '\${resultSize}', this)" class="preview-trigger-btn px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm transition-colors flex items-center gap-1" type="button">
                <span class="material-symbols-outlined text-[16px]">visibility</span> Pratinjau
              </button>
              <button onclick="handleShareLink('\${item.filename}')" class="share-trigger-btn p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant transition-colors" title="Salin Tautan Terenkripsi" type="button">
                <span class="material-symbols-outlined text-[18px]">share</span>
              </button>
              <button onclick="triggerDownload('\${item.filename || 'dokumen.' + ext.toLowerCase()}')" class="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm shadow-sm transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">download</span> Unduh
              </button>
              <button onclick="handleDeleteItem('\${item.id || index}')" class="delete-item-btn p-2 rounded-lg hover:bg-error-container hover:text-on-error-container text-outline transition-colors" title="Hapus Berkas" type="button">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          \`;
          container.appendChild(card);
        });
      }

      renderDownloadItems(items);

      // Preview Item Handler
      window.handlePreviewItem = function(title, ext, origExt, origSize, resultSize, btn) {
        const activeTitle = document.getElementById('active-file-title');
        if (activeTitle) activeTitle.innerText = title;

        document.querySelectorAll('.download-item-row').forEach(r => {
          r.classList.remove('ring-2', 'ring-primary/40');
          const badge = r.querySelector('.preview-badge');
          if (badge) badge.remove();
        });

        const row = btn.closest('.download-item-row');
        if (row) {
          row.classList.add('ring-2', 'ring-primary/40');
          const titleContainer = row.querySelector('.item-title').parentNode;
          if (titleContainer) {
            const badge = document.createElement('span');
            badge.className = 'px-1.5 py-0.5 rounded bg-surface-container text-primary font-code-mono text-[10px] uppercase font-bold preview-badge';
            badge.innerText = 'Sedang Dilihat';
            titleContainer.appendChild(badge);
          }
        }

        if (typeof showToast === 'function') {
          showToast('Pratinjau: ' + title);
        }
      };

      // Share Link Handler
      window.handleShareLink = function(title) {
        const mockUrl = window.location.origin + '/riwayat-unduhan.html?share=' + encodeURIComponent(title);
        navigator.clipboard.writeText(mockUrl).then(() => {
          if (typeof showToast === 'function') {
            showToast('Tautan terenkripsi berhasil disalin ke clipboard!');
          }
        }).catch(() => {
          if (typeof showToast === 'function') {
            showToast('Tautan siap dibagikan.');
          }
        });
      };

      // Delete Individual Item
      window.handleDeleteItem = async function(id) {
        const row = document.getElementById('download-card-' + id);
        if (row) {
          row.style.opacity = '0.3';
          setTimeout(() => row.remove(), 250);
        }
        if (typeof deleteConversionFromSupabase === 'function') {
          await deleteConversionFromSupabase(id);
        }
        if (typeof showToast === 'function') {
          showToast('Berkas dihapus permanen dari Supabase.');
        }
      };

      // Delete All Items (Zero Retention)
      const deleteAllBtn = document.getElementById('delete-all-btn');
      if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', async () => {
          if (confirm('Apakah Anda yakin ingin memusnahkan semua berkas dari server Supabase sekarang?')) {
            if (typeof purgeAllConversionsFromSupabase === 'function') {
              await purgeAllConversionsFromSupabase();
            }
            if (container) container.innerHTML = '<p class="text-on-surface-variant text-center py-8">Semua berkas telah dimusnahkan secara permanen.</p>';
            if (typeof showToast === 'function') {
              showToast('Semua berkas dan cache terenkripsi berhasil dimusnahkan.', 'success');
            }
          }
        });
      }
    })();
  </script>
  ${supabaseScripts}
  `;

  html = html.replace('</body></html>', resultsScript + '</body></html>');

  fs.writeFileSync(path.join(__dirname, 'riwayat-unduhan.html'), html, 'utf8');
  console.log('Built riwayat-unduhan.html with Supabase integration');
}

buildIndex();
buildKatalog();
buildBatchQueue();
buildRiwayatUnduhan();
console.log('ALL 4 PAGES REBUILT WITH SUPABASE INTEGRATION SUCCESSFULLY!');
