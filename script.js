let originalSrtContent = '', adjustedSrtContent = '';
const $ = id => document.getElementById(id),
  srtFileInput = $("srtFile"), timeAdjustmentInput = $("timeAdjustment"), processBtn = $("processBtn"), downloadBtn = $("downloadBtn"), originalPreview = $("originalPreview"), adjustedPreview = $("adjustedPreview"), floatingTimeAdjustment = $("floatingTimeAdjustment"), scrollToTopBtn = $("scrollToTopBtn"), floatingTooltip = $("floatingTooltip"), step1 = $("step1"), step2 = $("step2"), step3 = $("step3");

[srtFileInput, processBtn].forEach((el, i) => el.addEventListener(['change', 'click'][i], [handleFileSelect, processSrtFile][i]));
downloadBtn.addEventListener('click', downloadAdjustedSrt);
timeAdjustmentInput.addEventListener('input', updateProcessButton);
const showStep = s => { step1.style.display = s === 1 ? '' : 'none'; step2.style.display = s === 2 ? '' : 'none'; step3.style.display = s === 3 ? 'flex' : 'none'; if (s === 3) floatingTimeAdjustment.value = timeAdjustmentInput.value; };
showStep(1);
function handleFileSelect(e) {
  const f = e.target.files[0];
  if (f && f.name.endsWith('.srt')) {
    const r = new FileReader();
    r.onload = e => { originalSrtContent = e.target.result; originalPreview.textContent = originalSrtContent; updateProcessButton(); showStep(2); };
    r.readAsText(f);
  } else alert('Please select a valid SRT file');
}
function updateProcessButton() { processBtn.disabled = !(originalSrtContent.length > 0 && timeAdjustmentInput.value !== ''); }
const parseSrtTime = t => { const [h, m, s] = t.split(',')[0].split(':').map(Number), ms = t.split(',')[1]; return h * 3600 + m * 60 + s + parseInt(ms) / 1000; };
const formatSrtTime = t => { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60), ms = Math.round((t % 1) * 1000); return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`; };
function adjustSrtTiming(srt, adj) { return srt.split('\n').map(l => l.includes(' --> ') ? (() => { const [a, b] = l.split(' --> '), sa = parseSrtTime(a.trim()) + adj, sb = parseSrtTime(b.trim()) + adj; if (sa < 0 || sb < 0) alert('Warning: Adjustment would result in negative timestamps. Some subtitles may be clipped.'); return `${formatSrtTime(Math.max(0, sa))} --> ${formatSrtTime(Math.max(0, sb))}`; })() : l.trim()).join('\n'); }
function processSrtFile() {
  let adj = parseFloat(timeAdjustmentInput.value); if (isNaN(adj)) adj = 0;
  try { adjustedSrtContent = adjustSrtTiming(originalSrtContent, adj); adjustedPreview.value = adjustedSrtContent; downloadBtn.disabled = false; showStep(3); processBtn.textContent = 'Processing Complete!'; setTimeout(() => { processBtn.textContent = 'Process SRT File'; }, 2000); } catch (e) { alert('Error processing SRT file: ' + e.message); }
}
adjustedPreview.addEventListener('input', () => { adjustedSrtContent = adjustedPreview.value; });
function downloadAdjustedSrt() {
  if (adjustedPreview.value) {
    const blob = new Blob([adjustedPreview.value], { type: 'text/plain' }), url = URL.createObjectURL(blob), a = document.createElement('a'), n = srtFileInput.files[0].name, b = n.replace('.srt', ''), f = `${b}_adjusted.srt`;
    a.href = url; a.download = f; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
}
floatingTimeAdjustment.setAttribute('maxlength', '3');
floatingTimeAdjustment.addEventListener('input', e => { let v = floatingTimeAdjustment.value.replace(/[^0-9.-]/g, ''); if (v.length > 3) v = v.slice(0, 3); floatingTimeAdjustment.value = v; timeAdjustmentInput.value = v; processSrtFile(); });
timeAdjustmentInput.setAttribute('maxlength', '3');
timeAdjustmentInput.setAttribute('inputmode', 'decimal');
timeAdjustmentInput.addEventListener('input', e => { let v = timeAdjustmentInput.value.replace(/[^0-9.-]/g, ''); if (v.length > 3) v = v.slice(0, 3); timeAdjustmentInput.value = v; if (step3.style.display === 'flex') floatingTimeAdjustment.value = v; });
if (scrollToTopBtn) scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
function showTooltip(text, anchorEl) {
  floatingTooltip.textContent = text;
  if (anchorEl) {
    const r = anchorEl.getBoundingClientRect();
    floatingTooltip.style.top = `${r.top + window.scrollY + r.height / 2 - floatingTooltip.offsetHeight / 2}px`;
    floatingTooltip.style.left = `${r.left + window.scrollX - floatingTooltip.offsetWidth - 12}px`;
    floatingTooltip.style.right = '';
  } else {
    floatingTooltip.style.top = '';
    floatingTooltip.style.left = '';
    floatingTooltip.style.right = '110px';
  }
  floatingTooltip.classList.add('visible');
}
const hideTooltip = () => floatingTooltip.classList.remove('visible');
scrollToTopBtn.addEventListener('mouseenter', () => showTooltip('Scroll to top', scrollToTopBtn));
scrollToTopBtn.addEventListener('mouseleave', hideTooltip);
floatingTimeAdjustment.addEventListener('mouseenter', () => showTooltip(document.activeElement === floatingTimeAdjustment ? 'Delay' : 'Adjust delay on the go', floatingTimeAdjustment));
floatingTimeAdjustment.addEventListener('mouseleave', hideTooltip);
floatingTimeAdjustment.addEventListener('focus', () => showTooltip('Delay', floatingTimeAdjustment));
floatingTimeAdjustment.addEventListener('blur', hideTooltip);
downloadBtn.addEventListener('mouseenter', () => showTooltip('Download adjusted SRT file', downloadBtn));
downloadBtn.addEventListener('mouseleave', hideTooltip);