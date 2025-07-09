let originalSrtContent = '';
let adjustedSrtContent = '';

// DOM elements
const srtFileInput = document.getElementById('srtFile');
const timeAdjustmentInput = document.getElementById('timeAdjustment');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const originalPreview = document.getElementById('originalPreview');
const adjustedPreview = document.getElementById('adjustedPreview');
const floatingTimeAdjustment = document.getElementById('floatingTimeAdjustment');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const floatingTooltip = document.getElementById('floatingTooltip');

// Event listeners
srtFileInput.addEventListener('change', handleFileSelect);
processBtn.addEventListener('click', processSrtFile);
downloadBtn.addEventListener('click', downloadAdjustedSrt);
timeAdjustmentInput.addEventListener('input', updateProcessButton);

// Step navigation logic
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

function showStep(step) {
    step1.style.display = step === 1 ? '' : 'none';
    step2.style.display = step === 2 ? '' : 'none';
    step3.style.display = step === 3 ? 'flex' : 'none';
    if (step === 3) {
        syncFloatingInput();
    }
}

// Start at step 1
showStep(1);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.srt')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalSrtContent = e.target.result;
            originalPreview.textContent = originalSrtContent;
            updateProcessButton();
            showStep(2);
        };
        reader.readAsText(file);
    } else {
        alert('Please select a valid SRT file');
    }
}

function updateProcessButton() {
    const hasFile = originalSrtContent.length > 0;
    const hasAdjustment = timeAdjustmentInput.value !== '';
    processBtn.disabled = !(hasFile && hasAdjustment);
}

function parseSrtTime(timeString) {
    // Parse time in format "HH:MM:SS,mmm"
    const [time, milliseconds] = timeString.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + parseInt(milliseconds) / 1000;
}

function formatSrtTime(totalSeconds) {
    // Format time back to "HH:MM:SS,mmm"
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

function adjustSrtTiming(srtContent, adjustmentSeconds) {
    const lines = srtContent.split('\n');
    const adjustedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if line contains timing (has --> arrow)
        if (line.includes(' --> ')) {
            const [startTime, endTime] = line.split(' --> ');
            
            // Parse times and apply adjustment
            const startSeconds = parseSrtTime(startTime.trim()) + adjustmentSeconds;
            const endSeconds = parseSrtTime(endTime.trim()) + adjustmentSeconds;
            
            // Ensure times don't go negative
            if (startSeconds < 0 || endSeconds < 0) {
                alert('Warning: Adjustment would result in negative timestamps. Some subtitles may be clipped.');
            }
            
            const adjustedStartTime = formatSrtTime(Math.max(0, startSeconds));
            const adjustedEndTime = formatSrtTime(Math.max(0, endSeconds));
            
            adjustedLines.push(`${adjustedStartTime} --> ${adjustedEndTime}`);
        } else {
            adjustedLines.push(line);
        }
    }
    
    return adjustedLines.join('\n');
}

function processSrtFile() {
    let adjustment = parseFloat(timeAdjustmentInput.value);
    // If no adjustment is given, default to 0 (original time)
    if (isNaN(adjustment)) {
        adjustment = 0;
    }
    try {
        adjustedSrtContent = adjustSrtTiming(originalSrtContent, adjustment);
        adjustedPreview.value = adjustedSrtContent;
        downloadBtn.disabled = false;
        showStep(3);
        // Show success message
        processBtn.textContent = 'Processing Complete!';
        setTimeout(() => {
            processBtn.textContent = 'Process SRT File';
        }, 2000);
    } catch (error) {
        alert('Error processing SRT file: ' + error.message);
    }
}

// Update adjustedSrtContent when user edits the textarea
adjustedPreview.addEventListener('input', function() {
    adjustedSrtContent = adjustedPreview.value;
});

function downloadAdjustedSrt() {
    if (adjustedPreview.value) {
        const blob = new Blob([adjustedPreview.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Get original filename and add "_adjusted" suffix
        const originalFileName = srtFileInput.files[0].name;
        const baseName = originalFileName.replace('.srt', '');
        const adjustedFileName = `${baseName}_adjusted.srt`;
        
        a.href = url;
        a.download = adjustedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Add floating download button event listener
downloadBtn.addEventListener('click', downloadAdjustedSrt);

// Sync floating input with main input on step 3 entry
function syncFloatingInput() {
    floatingTimeAdjustment.value = timeAdjustmentInput.value;
}

// When user changes floating input, update and reprocess
floatingTimeAdjustment.addEventListener('input', function() {
    timeAdjustmentInput.value = floatingTimeAdjustment.value;
    processSrtFile();
});

// When user changes main input, update floating input (if on step 3)
timeAdjustmentInput.addEventListener('input', function() {
    if (step3.style.display === 'flex') {
        floatingTimeAdjustment.value = timeAdjustmentInput.value;
    }
});

// Limit floating input to max 3 characters and only valid numbers
floatingTimeAdjustment.setAttribute('maxlength', '3');
floatingTimeAdjustment.addEventListener('input', function(e) {
    // Remove non-numeric except minus and dot
    let val = floatingTimeAdjustment.value.replace(/[^0-9.-]/g, '');
    // Limit to 3 characters (allow negative sign and dot)
    if (val.length > 3) val = val.slice(0, 3);
    floatingTimeAdjustment.value = val;
    timeAdjustmentInput.value = val;
    processSrtFile();
});

// Also limit main input to 3 characters and hide arrows
timeAdjustmentInput.setAttribute('maxlength', '3');
timeAdjustmentInput.setAttribute('inputmode', 'decimal');
timeAdjustmentInput.style.MozAppearance = 'textfield';
timeAdjustmentInput.style.appearance = 'textfield';
timeAdjustmentInput.addEventListener('input', function(e) {
    // Remove non-numeric except minus and dot
    let val = timeAdjustmentInput.value.replace(/[^0-9.-]/g, '');
    if (val.length > 3) val = val.slice(0, 3);
    timeAdjustmentInput.value = val;
    if (step3.style.display === 'flex') {
        floatingTimeAdjustment.value = val;
    }
});

if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function showTooltip(text, anchorEl) {
    floatingTooltip.textContent = text;
    // Position the tooltip to slide out from the anchor element (button/input)
    if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        // Place tooltip vertically centered to the button/input, and to the left of it
        floatingTooltip.style.top = `${rect.top + window.scrollY + rect.height / 2 - floatingTooltip.offsetHeight / 2}px`;
        floatingTooltip.style.left = `${rect.left + window.scrollX - floatingTooltip.offsetWidth - 12}px`;
        floatingTooltip.style.right = '';
    } else {
        floatingTooltip.style.top = '';
        floatingTooltip.style.left = '';
        floatingTooltip.style.right = '110px';
    }
    floatingTooltip.classList.add('visible');
}
function hideTooltip() {
    floatingTooltip.classList.remove('visible');
}

scrollToTopBtn.addEventListener('mouseenter', function() {
    showTooltip('Scroll to top', scrollToTopBtn);
});
scrollToTopBtn.addEventListener('mouseleave', hideTooltip);

floatingTimeAdjustment.addEventListener('mouseenter', function() {
    if (document.activeElement === floatingTimeAdjustment) {
        showTooltip('Delay', floatingTimeAdjustment);
    } else {
        showTooltip('Adjust delay on the go', floatingTimeAdjustment);
    }
});
floatingTimeAdjustment.addEventListener('mouseleave', hideTooltip);
floatingTimeAdjustment.addEventListener('focus', function() {
    showTooltip('Delay', floatingTimeAdjustment);
});
floatingTimeAdjustment.addEventListener('blur', hideTooltip);

downloadBtn.addEventListener('mouseenter', function() {
    showTooltip('Download adjusted SRT file', downloadBtn);
});
downloadBtn.addEventListener('mouseleave', hideTooltip);