// Imports removed for local file compatibility. 
// We rely on 'vision_bundle.js' being loaded via <script> tag in index.html

console.log("Script.js Global Execution Started");

window.onerror = function (message, source, lineno, colno, error) {
    console.error("Global Error Caught:", message, "Line:", lineno);
    alert("Script Error: " + message + "\nLine: " + lineno);
    return false;
};


let GestureRecognizer, FilesetResolver, DrawingUtils;

// Safely attempt to load globals
// FIX: All MediaPipe classes live under the single `vision` global exported by vision_bundle.js.
// fileset_resolver and drawing_utils do NOT exist as separate globals.
try {
    if (typeof vision !== 'undefined') {
        GestureRecognizer = vision.GestureRecognizer;
        FilesetResolver = vision.FilesetResolver;
        DrawingUtils = vision.DrawingUtils;
        console.log("MediaPipe globals loaded successfully.", { GestureRecognizer, FilesetResolver, DrawingUtils });
    } else {
        console.warn("MediaPipe 'vision' object not found. Gestures may not work.");
    }
} catch (e) {
    console.error("Error mapping MediaPipe globals:", e);
    console.warn("Gesture Library Error: " + e.message + ". Presentation can still proceed.");
}

const video = document.getElementById("webcam");
const pdfCanvas = document.getElementById('pdf-render');
const pdfCtx = pdfCanvas.getContext('2d');
const gestureStatus = document.getElementById('gesture-status');

let gestureRecognizer = undefined;
let runningMode = "VIDEO";
let webcamRunning = false;

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;

let isPresentationActive = false;
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 1500; // ms

// PPTX State
let isPptx = false;
let currentPptxSlide = 0;
let pptxTotalSlides = 0;

// UI Guides
const guideItems = {
    next: document.getElementById('guide-next'),
    prev: document.getElementById('guide-prev'),
    stop: document.getElementById('guide-stop'),
    end: document.getElementById('guide-end')
};

// Sound
const okSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
// fallback sound if local file not found


function handleGesture(gestureName) {
    const now = Date.now();

    // Reset highlights
    Object.values(guideItems).forEach(el => {
        if (el) el.classList.remove('active');
    });

    statusDisplay(gestureName);

    if (gestureName === "None") return;

    if (now - lastGestureTime < GESTURE_COOLDOWN) {
        console.log("Gesture ignored (cooldown):", gestureName);
        return;
    }

    console.log("Processing Gesture:", gestureName);

    // 5 or 4 Fingers -> Next Page
    if (gestureName === "Open_Palm" || gestureName === "Four_Fingers") {
        highlight("next");
        if (isPresentationActive) {
            onNextPage();
        } else {
            console.warn("Gesture 'Next' ignored: Presentation not active");
        }
        lastGestureTime = now;
        triggerVisualFeedback("Next Slide ➡️");
    }
    // 2 Fingers (Victory) -> Previous Page
    else if (gestureName === "Victory") {
        highlight("prev");
        if (isPresentationActive) {
            onPrevPage();
        } else {
            console.warn("Gesture 'Prev' ignored: Presentation not active");
        }
        lastGestureTime = now;
        triggerVisualFeedback("Prev Slide ⬅️");
    }
    // Rock (ILoveYou) -> Stop/Freeze
    else if (gestureName === "ILoveYou" || gestureName === "Closed_Fist") {
        highlight("stop");
        lastGestureTime = now;
        triggerVisualFeedback("Paused ⏸️");
    }
    // Remove separate Closed_Fist block to merge logic

    // 1 Finger (Pointing_Up) -> Full Screen
    else if (gestureName === "Pointing_Up") {
        enterFullScreen();
        lastGestureTime = now;
        triggerVisualFeedback("Full Screen ⛶");
    }
    // Thumb Up -> End
    else if (gestureName === "Thumb_Up") {
        highlight("end");
        endPresentation();
        lastGestureTime = now;
        triggerVisualFeedback("Ending... 👍");
    }
}

function highlight(id) {
    if (guideItems[id]) guideItems[id].classList.add('active');
}

function statusDisplay(text) {
    gestureStatus.innerText = `Detected: ${text}`;
}

function triggerVisualFeedback(msg) {
    const feedback = document.createElement('div');
    feedback.className = 'visual-feedback';
    feedback.innerText = msg;
    feedback.style.position = 'absolute';
    feedback.style.top = '50%';
    feedback.style.left = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.background = 'rgba(0,0,0,0.8)';
    feedback.style.color = 'white';
    feedback.style.padding = '30px';
    feedback.style.borderRadius = '15px';
    feedback.style.fontSize = '3rem';
    feedback.style.zIndex = '1000';
    feedback.style.pointerEvents = 'none';
    feedback.style.animation = 'fadeOut 1s forwards';
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1000);
}

function endPresentation() {
    isPresentationActive = false;
    document.querySelector('.placeholder-content').style.display = 'block';
    pdfCanvas.style.display = 'none';
    document.getElementById('pptx-render').style.display = 'none';
    document.querySelector('.placeholder-content h2').innerText = "Presentation Ended";
    pdfDoc = null;
    pageNum = 1;
    // Clear PPTX
    document.getElementById('pptx-render').innerHTML = "";
    isPptx = false;
}

// --- File Handling (PDF & PPTX) ---

const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
if (pdfjsLib) {
    console.log("PDF.js Lib Loaded. Setting worker...");
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdfjs/pdf.worker.min.js';
    console.log("Worker Set to: " + pdfjsLib.GlobalWorkerOptions.workerSrc);
    // console.log("PDF Worker disabled for local file compatibility (forcing main thread).");
} else {
    console.error("PDF.js not found in window");
    alert("Error: PDF Library not loaded within script.js scope.");
}

// Check JSZip
if (!window.JSZip) {
    console.error("JSZip not found!");
    alert("CRITICAL: JSZip library not loaded. Check console.");
} else {
    console.log("JSZip found:", window.JSZip);
    // Attempt rudimentary version check if possible
}

// Check PPTXjs
if (!window.jQuery) {
    alert("CRITICAL: jQuery not loaded.");
}

// Manual Navigation
document.getElementById('btn-next').addEventListener('click', () => {
    console.log("Manual Next Clicked");
    if (isPresentationActive) onNextPage();
});
document.getElementById('btn-prev').addEventListener('click', () => {
    console.log("Manual Prev Clicked");
    if (isPresentationActive) onPrevPage();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    endPresentation();
    document.getElementById('fileStatus').innerText = "No file selected";
    document.getElementById('gesture-status').innerText = "Reset.";
    location.reload(); // Hard reset to clear PPTXjs pollution
});

document.getElementById('start-cam-btn').addEventListener('click', () => {
    console.log("Manual Camera Start Requested");
    document.getElementById('gesture-status').innerText = "Manual Cam Start...";
    enableCam();
});

document.getElementById('fileInput').addEventListener('change', function (e) {
    console.log("File Input Changed");
    // alert("File selected! Processing..."); // Removed blocking alert
    const file = e.target.files[0];
    if (!file) {
        console.log("No file selected in dialog");
        return;
    }
    console.log("File Selected:", file.name, file.type);

    document.getElementById('fileStatus').innerText = `Selected: ${file.name}`;

    // Show Loading Status IMMEDIATELY
    const statusEl = document.getElementById('gesture-status');
    statusEl.innerText = "Loading File...";
    statusEl.style.color = "#fbbf24"; // Warning/Loading color

    endPresentation(); // Reset
    document.querySelector('.placeholder-content').style.display = 'none';

    // Robust File Type Checking (Type + Extension)
    const fileName = file.name.toLowerCase();

    if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
        console.log("Detected PDF");
        isPptx = false;
        statusEl.innerText = "Reading PDF Data..."; // Confirm we entered the block

        const fileReader = new FileReader();

        fileReader.onload = function () {
            console.log("File Read Complete. size:", this.result.byteLength);
            statusEl.innerText = "Data Read. Parsing...";
            const typedarray = new Uint8Array(this.result);
            loadPDF(typedarray);
        };

        fileReader.onerror = function (err) {
            console.error("FileReader Error:", err);
            statusEl.innerText = "File Read Failed";
            statusEl.style.color = "red";
            alert("Error reading file: " + fileReader.error.message);
        };

        try {
            fileReader.readAsArrayBuffer(file);
        } catch (e) {
            console.error("FileReader Exception:", e);
            statusEl.innerText = "Read Exception";
            alert("FileReader Failed: " + e.message);
        }
    }
    else if (fileName.endsWith(".pptx") || file.type.includes("presentation") || fileName.endsWith(".ppt")) {
        console.log("Detected PPTX");
        isPptx = true;
        loadPPTX(file);
    } else {
        console.warn("Unsupported file type:", file.type, fileName);
        alert("Unsupported file type: " + file.type + "\nPlease upload a .pdf or .pptx file.");
        endPresentation();
    }
});

function loadPDF(data) {
    const statusEl = document.getElementById('gesture-status');
    statusEl.innerText = "Rendering PDF...";

    // alert("Starting PDF Load..."); // Removed
    if (!pdfjsLib) {
        console.error("PDF.js library not loaded");
        statusEl.innerText = "Error: PDF Lib Missing";
        return;
    }

    pdfjsLib.getDocument(data).promise.then(function (pdf) {
        console.log("PDF Loaded! Pages: " + pdf.numPages);
        statusEl.innerText = "PDF Ready. Use Gestures.";
        statusEl.style.color = "#34d399"; // Success

        pdfDoc = pdf;
        pdfCanvas.style.display = 'block';
        isPresentationActive = true;
        pageNum = 1;
        renderPage(pageNum);
    }).catch(function (error) {
        console.error("Error loading PDF:", error);
        statusEl.innerText = "PDF Load Error";
        statusEl.style.color = "red";
        alert("Error loading PDF: " + error.message);
    });
}

function loadPPTX(file) {
    console.log("Starting PPTX Load...");
    const pptxContainer = document.getElementById('pptx-render');
    pptxContainer.style.display = 'block';
    pptxContainer.innerHTML = ""; // clear

    const statusEl = document.getElementById('gesture-status');
    statusEl.innerText = "Processing PPTX... (this may take a while)";

    // Using global $ from jQuery
    if (!window.jQuery) {
        console.error("CRITICAL ERROR: jQuery is not loaded. PPTX cannot run.");
        statusEl.innerText = "Error: jQuery not loaded.";
        statusEl.style.color = "red";
        return;
    }

    const url = URL.createObjectURL(file);
    console.log("PPTX Blob URL created. Calling pptxToHtml...");

    try {
        $("#pptx-render").pptxToHtml({
            pptxFileUrl: url,
            slideMode: false,
            keyBoardShortCut: false,
            mediaProcess: true,
            slideModeConfig: {
                first: 1,
                nav: false,
                showPlayPauseBtn: false
            }
        });
    } catch (e) {
        console.error(e);
        statusEl.innerText = "Error initializing PPTX engine.";
        alert("PPTX Engine Crash: " + e.message);
        return;
    }

    // Force hide PPTX container during load to prevent "1%" glitch
    pptxContainer.style.opacity = "0";

    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';

    // Polling for completion
    let attempts = 0;
    const maxAttempts = 200; // 20 seconds approx

    const checkInterval = setInterval(() => {
        const slides = document.querySelectorAll('#pptx-render .slide');
        attempts++;

        if (slides.length > 0) {
            clearInterval(checkInterval);
            loadingOverlay.style.display = 'none';
            pptxContainer.style.display = "flex"; // Use Flex for centering
            pptxContainer.style.opacity = "1";

            statusEl.innerText = "Success! PPTX Loaded.";
            setTimeout(() => { statusEl.innerText = "Ready. Use Gestures."; }, 2000);
            isPresentationActive = true;
            setupPptxSlides();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            loadingOverlay.style.display = 'none';
            statusEl.innerText = "PPTX Timeout.";
            alert("The PPTX file is taking too long to load (over 20s).\n\nIt is likely too complex for the browser-based converter.\n\nRECOMMENDATION: Please save your PPTX as a PDF and upload the PDF file instead for instant, perfect rendering.");
            endPresentation();
        }
    }, 100);
}



function getPptxSlides() {
    // Try standard class first
    let slides = document.querySelectorAll('#pptx-render .slide');
    if (slides.length > 0) return slides;

    // Fallback: direct children divs (common in some pptxjs versions)
    const container = document.getElementById('pptx-render');
    const children = Array.from(container.children).filter(el => el.tagName === 'DIV' && !el.classList.contains('loading-overlay'));
    return children;
}

function setupPptxSlides() {
    console.log("Setting up PPTX slides...");
    const slides = getPptxSlides();
    pptxTotalSlides = slides.length;
    currentPptxSlide = 0;

    console.log(`Found ${pptxTotalSlides} PPTX slides/elements.`);

    if (pptxTotalSlides === 0) return;

    // Apply visibility
    slides.forEach((s, index) => {
        s.classList.add('gesture-ppt-slide');

        // --- 1. Force Visibility ---
        s.style.display = index === 0 ? 'block' : 'none';
        if (index !== 0) s.style.setProperty('display', 'none', 'important');
        s.style.backgroundColor = "white"; // JS backup for CSS

        // --- 2. Scaling Logic ---
        const container = document.getElementById('presentation-area');
        const containerW = container.clientWidth - 60; // Padding buffer
        const containerH = container.clientHeight - 60;

        // Simple Scale Fit
        // We assume 16:9 standard if not readable, or read from inline style
        const slideW = s.offsetWidth || 960;
        const slideH = s.offsetHeight || 540;

        const scaleX = containerW / slideW;
        const scaleY = containerH / slideH;
        let scale = Math.min(scaleX, scaleY);

        if (scale > 1) scale = 1; // Don't upscale blurrily, optional

        // Apply Centering & Scaling
        s.style.margin = 'auto';
        s.style.position = 'absolute'; // Use absolute to center in flex container easily
        s.style.left = '50%';
        s.style.top = '50%';
        s.style.transform = `translate(-50%, -50%) scale(${scale})`;
        s.style.transformOrigin = 'center center';
    });

    updateSlideStatus(1, pptxTotalSlides);
}


function updateSlideStatus(current, total) {
    const t = total ? ` / ${total}` : '';
    document.getElementById('gesture-status').innerText = `Slide ${current}${t}`;
}

function renderPage(num) {
    pageRendering = true;

    // Fetch page
    pdfDoc.getPage(num).then(function (page) {
        console.log(`Rendering PDF Page ${num}`);

        // Dynamic Scale Calculation
        const container = document.getElementById('presentation-area');
        const containerWidth = container.clientWidth - 40; // padding
        const containerHeight = container.clientHeight - 40;

        // Get unscaled viewport
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / unscaledViewport.width;
        const scaleY = containerHeight / unscaledViewport.height;
        const scale = Math.min(scaleX, scaleY); // Fit entirely

        const viewport = page.getViewport({ scale: scale });
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        pdfCanvas.style.display = 'block'; // Ensure visible

        const renderContext = {
            canvasContext: pdfCtx,
            viewport: viewport
        };

        const renderTask = page.render(renderContext);

        // Wait for render to finish
        renderTask.promise.then(function () {
            console.log(`Finished rendering Page ${num}`);
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        }).catch(function (error) {
            console.error("Error rendering PDF page:", error);
            pageRendering = false; // Reset flag so we aren't stuck
        });
    });

    updateSlideStatus(num, pdfDoc.numPages);
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onNextPage() {
    console.log("onNextPage Called");

    // PPTX Logic
    if (isPptx) {
        // Use our robust getter or the class we added
        let slides = document.querySelectorAll('.gesture-ppt-slide');
        if (slides.length === 0) slides = getPptxSlides();

        console.log(`PPTX Next: Current ${currentPptxSlide}, Total ${slides.length}`);

        if (slides.length === 0) return;

        if (currentPptxSlide < slides.length - 1) {
            // Hide current
            slides[currentPptxSlide].style.display = 'none'; // Standard
            slides[currentPptxSlide].style.setProperty('display', 'none', 'important'); // Force

            // Advance
            currentPptxSlide++;

            // Show next
            slides[currentPptxSlide].style.display = 'block';
            slides[currentPptxSlide].style.setProperty('display', 'block', 'important');

            updateSlideStatus(currentPptxSlide + 1, pptxTotalSlides);
            document.getElementById('pptx-render').scrollTop = 0;
        } else {
            console.log("PPTX at last slide");
            triggerVisualFeedback("End of Slides");
        }
        return;
    }

    // PDF Logic
    if (!pdfDoc) {
        console.log("No PDF Doc loaded");
        return;
    }

    if (pageNum >= pdfDoc.numPages) {
        console.log("Already at last page");
        triggerVisualFeedback("End of Doc");
        return;
    }

    pageNum++;
    console.log(`Queueing Page ${pageNum}`);
    queueRenderPage(pageNum);
}

function onPrevPage() {
    console.log("onPrevPage Called");

    // PPTX Logic
    if (isPptx) {
        let slides = document.querySelectorAll('.gesture-ppt-slide');
        if (slides.length === 0) slides = getPptxSlides();

        if (slides.length === 0) return;

        if (currentPptxSlide > 0) {
            // Hide current
            slides[currentPptxSlide].style.display = 'none';
            slides[currentPptxSlide].style.setProperty('display', 'none', 'important');

            // Go back
            currentPptxSlide--;

            // Show prev
            slides[currentPptxSlide].style.display = 'block';
            slides[currentPptxSlide].style.setProperty('display', 'block', 'important');

            updateSlideStatus(currentPptxSlide + 1, pptxTotalSlides);
            document.getElementById('pptx-render').scrollTop = 0;
        } else {
            triggerVisualFeedback("Start of Slides");
        }
        return;
    }

    // PDF Logic
    if (!pdfDoc) return;

    if (pageNum <= 1) {
        triggerVisualFeedback("Start of Doc");
        return;
    }

    pageNum--;
    console.log(`Queueing Page ${pageNum}`);
    queueRenderPage(pageNum);
}

// Start
// --- Voice Control ---

function setupVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Browser does not support Speech Recognition");
        document.getElementById('voice-text').innerText = "Not Supported (Try Chrome)";
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        document.getElementById('voice-text').innerText = "Listening...";
        document.getElementById('mic-status').style.color = "#34d399"; // Success green
    };

    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        if (event.error === 'not-allowed') {
            document.getElementById('voice-text').innerText = "Mic Access Denied";
            document.getElementById('mic-status').style.color = "#f87171"; // Red
        } else {
            // Often 'no-speech' or 'network', just ignore or show status
            // document.getElementById('voice-text').innerText = "Standby...";
        }
    };

    recognition.onend = () => {
        // Auto-restart if we are supposed to be running, but prevent infinite loops if denied
        if (webcamRunning && document.getElementById('voice-text').innerText !== "Mic Access Denied") {
            try { recognition.start(); } catch (e) { /* ignore already started */ }
        }
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log("Voice Command:", transcript);
        document.getElementById('voice-text').innerText = `"${transcript}"`;

        processVoiceCommand(transcript);
    };

    try {
        recognition.start();
    } catch (e) {
        console.error("Error starting speech:", e);
    }
}

function processVoiceCommand(cmd) {
    // Simple keyword matching
    console.log("Processing Voice Command:", cmd);

    if (cmd.includes("next")) {
        triggerVisualFeedback("Voice: Next ➡️");
        if (isPresentationActive) {
            onNextPage();
        } else {
            console.warn("Command ignored: Presentation not active");
        }
    }
    else if (cmd.includes("back") || cmd.includes("previous")) {
        triggerVisualFeedback("Voice: Back ⬅️");
        if (isPresentationActive) {
            onPrevPage();
        }
    }
    else if (cmd.includes("thank you") || cmd.includes("stop") || cmd.includes("end presentation")) {
        triggerVisualFeedback("Voice: End 👍");
        endPresentation();
    }
    else if (cmd.includes("play") || cmd.includes("sound") || cmd.includes("music")) {
        triggerVisualFeedback("Voice: Playing 🎵");
        okSound.play().catch(e => console.warn("Audio play failed:", e));
    }
    else if (cmd.includes("full") || cmd.includes("screen")) {
        triggerVisualFeedback("Voice: Full Screen ⛶");
        enterFullScreen();
    }
    else if (cmd.includes("exit") || cmd.includes("leave")) {
        triggerVisualFeedback("Voice: Exit Full Screen ❌");
        exitFullScreen();
    } else {
        // Catch-all feedback for unrecognized but processed
        // triggerVisualFeedback("Heard: " + cmd);
    }
}

function enterFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

function exitFullScreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

// --- Gesture Recognition Core ---

async function createGestureRecognizer() {
    const statusEl = document.getElementById('gesture-status');
    statusEl.innerText = "Loading AI Model...";

    // Path configuration for Localhost/File
    const visionPath = "libs/mediapipe/wasm";
    const modelPath = "libs/mediapipe/gesture_recognizer.task";

    console.log("Initializing MediaPipe with paths:", { visionPath, modelPath });

    try {
        const vision = await FilesetResolver.forVisionTasks(visionPath);
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: modelPath,
                delegate: "CPU"
            },
            runningMode: runningMode
        });

        statusEl.innerText = "Model Loaded. Starting Cam...";
        console.log("Gesture Recognizer Created Successfully");

        // Add visual indicator (Green Dot)
        const camContainer = document.querySelector('.camera-container');
        let indicator = document.getElementById('ai-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'ai-indicator';
            indicator.style.cssText = "position: absolute; top: 10px; right: 10px; width: 12px; height: 12px; border-radius: 50%; background: #22c55e; border: 2px solid white; z-index: 100; box-shadow: 0 0 5px #22c55e;";
            camContainer.appendChild(indicator);
        }
        indicator.style.background = "#22c55e"; // Green

        enableCam();
    } catch (e) {
        console.error("Model Load Error:", e);
        statusEl.innerText = "AI Failed. Use Buttons."; // Explicit fail message

        // Add visual indicator (Red Dot)
        const camContainer = document.querySelector('.camera-container');
        let indicator = document.getElementById('ai-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'ai-indicator';
            indicator.style.cssText = "position: absolute; top: 10px; right: 10px; width: 12px; height: 12px; border-radius: 50%; background: #ef4444; border: 2px solid white; z-index: 100; box-shadow: 0 0 5px #ef4444;";
            camContainer.appendChild(indicator);
        }
        indicator.style.background = "#ef4444"; // Red

        // Still try to enable cam for pass-through
        enableCam();
    }
}

function enableCam() {
    const statusEl = document.getElementById('gesture-status');

    if (!gestureRecognizer) {
        console.warn("Enabling camera without AI (Model failed)");
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusEl.innerText = "Camera Not Supported";
        return;
    }

    // Toggle logic if needed, but here we just start it
    if (webcamRunning) return;

    webcamRunning = true;

    const constraints = {
        video: { width: 640, height: 480 } // Standard resolution
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
        statusEl.innerText = gestureRecognizer ? "System Ready. Show Hand." : "Camera On (No Gestures)";
        statusEl.style.color = gestureRecognizer ? "#34d399" : "orange";
    }).catch(function (err) {
        console.error("Camera Error:", err);
        statusEl.innerText = "Camera Access Denied";
        statusEl.style.color = "red";
    });
}

let lastVideoTime = -1;
let results = undefined;

async function predictWebcam() {
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");

    // Adjust canvas size to match video
    if (video.videoWidth > 0 && canvasElement.width !== video.videoWidth) {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
    }

    // AI Prediction
    if (gestureRecognizer && runningMode === "VIDEO") {
        let nowInMs = Date.now();
        if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            try {
                results = gestureRecognizer.recognizeForVideo(video, nowInMs);
            } catch (e) {
                console.error("Recognition Error:", e);
            }
        }
    }

    // Drawing
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results && results.landmarks) {
        // FIX: DrawingUtils must be instantiated with a canvas context — it is NOT a static utility class.
        const drawingUtils = DrawingUtils ? new DrawingUtils(canvasCtx) : null;

        for (const landmarks of results.landmarks) {
            if (drawingUtils) {
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 5
                });
                drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
            }
        }

        // Handle Logic
        if (results.gestures.length > 0) {
            const categoryName = results.gestures[0][0].categoryName;
            const score = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
            console.log(`Gesture: ${categoryName} (${score}%)`);
            handleGesture(categoryName);
        } else {
            handleGesture("None");
        }
    }

    canvasCtx.restore();

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Start
try {
    createGestureRecognizer();
} catch (e) {
    console.error("Gesture Recognizer Failed:", e);
    // Fallback: Enable Camera anyway so user feels it works
    const statusEl = document.getElementById('gesture-status');
    statusEl.innerText = "Gestures Disabled (Local Mode)";
    statusEl.style.color = "orange";

    // Attempt to start camera without AI
    enableCam();
}


try {
    setupVoiceControl();
} catch (e) {
    console.error("Voice Control Failed:", e);
}
