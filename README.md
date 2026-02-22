# 🖐️ GesturePPT – AI Hand Gesture & Voice Controlled Presentation Viewer

> **Control your presentations hands-free.** Upload a PDF or PPTX, wave your hand, and present like a pro — no clicker, no mouse, no hardware required.

[![Browser](https://img.shields.io/badge/Browser-Chrome%20%7C%20Edge-blue)](#)
[![AI](https://img.shields.io/badge/AI-MediaPipe%20Gesture%20Recognition-orange)](#)
[![Voice](https://img.shields.io/badge/Voice-Web%20Speech%20API-green)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen)](#)

---

## 📋 Project Overview

*Written by **Mike**, Team Leader*

**GesturePPT** is a fully browser-based, AI-powered presentation controller. It uses **Google MediaPipe** to perform real-time hand gesture recognition via your webcam, and the **Web Speech API** for hands-free voice commands — all running locally in your browser with **zero installation and zero server**.

It was designed for presenters, educators, and developers who want a frictionless, interactive way to deliver presentations without needing a physical clicker or remote.

### 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| AI Gesture Recognition | [MediaPipe Gesture Recognizer](https://developers.google.com/mediapipe) (WASM, local) |
| Webcam Access | WebRTC (`getUserMedia`) |
| Voice Commands | Web Speech API (Chrome) |
| PDF Rendering | [PDF.js](https://mozilla.github.io/pdf.js/) |
| PPTX Conversion | [PPTXjs](https://github.com/meshesha/PPTXjs) + JSZip |
| Audio | [Howler.js](https://howlerjs.com/) |
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2020) |

---

## ✨ Features

*Authored by **Emma**, Product Manager*

### Core Features
- 🖐️ **Hand Gesture Slide Control** — Navigate slides with Open Palm (next), Victory sign (prev), Thumb Up (end), and more
- 🎙️ **Voice Command Navigation** — Say "next", "back", "full screen", "stop" — slides respond instantly
- 📄 **PDF Rendering** — Pixel-perfect PDF presentation display via PDF.js
- 📊 **PPTX to HTML** — Experimental PPTX support via browser-side conversion (no server needed)
- ⛶ **Full Screen Mode** — One gesture or voice command to enter full-screen presenter mode
- 🔄 **Manual Fallback** — On-screen Prev/Next buttons always available as backup

### User Stories
- *As a lecturer*, I want to walk around the classroom while my slides advance automatically, so that I can engage with students without being tied to a podium.
- *As a presenter*, I want voice backup control so that if gestures fail, I can still confidently control the deck.
- *As a student*, I want an open-source tool I can run offline from my laptop without downloading software.

---

## 🚀 Getting Started

*Written by **Alex**, Full Stack Engineer*

### Prerequisites
- A modern web browser: **Google Chrome** (recommended) or Microsoft Edge
- A **webcam** (built-in or USB) for hand gesture control
- A **microphone** for voice commands

> **⚠️ Note:** Firefox and Safari have limited Web Speech API support. For best results, use **Google Chrome**.

### Installation & Setup

No installation or build step required. Everything runs from local files.

```bash
# 1. Clone or download the project
git clone https://github.com/your-org/gesture-ppt.git
cd gesture-ppt

# 2. Serve locally (required for camera access — 'file://' is blocked by browser security)
# Any of these will work:
npx serve .
# OR
python -m http.server 8080
# OR use VS Code Live Server extension

# 3. Open Chrome and go to:
# http://localhost:8080
```

> **Why a local server?** Browser security policies block camera access (`getUserMedia`) when opening `index.html` directly as a `file://` URL. You **must** serve it via `http://localhost`.

### First Run
1. Open Chrome → navigate to `http://localhost:8080`
2. Click **Allow** when prompted for camera and microphone permissions
3. Wait for the green ● indicator to appear in the camera preview (AI model loaded)
4. Upload your presentation (PDF or PPTX)
5. Show your hand to the camera and start presenting!

### File Structure
```
gesture-ppt/
├── index.html          # Main entry point (SEO + structured data)
├── script.js           # App logic, gesture handling, voice control
├── style.css           # UI styling
├── README.md           # This file
└── libs/
    ├── mediapipe/
    │   ├── vision_bundle.js        # MediaPipe AI vision library
    │   ├── gesture_recognizer.task # Trained gesture model (8.4 MB)
    │   └── wasm/                   # WebAssembly inference backend
    ├── pdfjs/                      # Mozilla PDF.js for PDF rendering
    ├── pptxjs/                     # PPTXjs for PPTX-to-HTML conversion
    └── others/                     # jQuery, JSZip, D3, Howler
```

---

## 🖐️ Gesture Reference

| Gesture | Emoji | Action |
|---|---|---|
| Open Palm | ✋ | Next Slide |
| Victory / Peace | ✌️ | Previous Slide |
| Pointing Up | ☝️ | Enter Full Screen |
| Closed Fist | ✊ | Pause / Freeze |
| ILoveYou Sign | 🤟 | Play Sound |
| Thumb Up | 👍 | End Presentation |

## 🎙️ Voice Command Reference

| Say | Action |
|---|---|
| "next" | Next Slide |
| "back" / "previous" | Previous Slide |
| "full screen" / "full" | Enter Full Screen |
| "exit" / "leave" | Exit Full Screen |
| "stop" / "end presentation" / "thank you" | End Presentation |
| "play" / "music" | Play Sound Effect |

---

## 🔍 SEO & Discoverability

*Authored by **Sarah**, SEO Specialist*

GesturePPT is optimised for discovery by educators, students, and developers searching for:
- **"gesture controlled presentation browser"**
- **"hand gesture PowerPoint control"**
- **"AI slide navigator webcam"**
- **"hands-free PDF presenter"**
- **"MediaPipe presentation controller"**

### On-Page SEO (implemented in `index.html`)
- ✅ Descriptive `<title>` tag with primary keyword
- ✅ `<meta name="description">` with unique, compelling content
- ✅ `<meta name="keywords">` with long-tail phrases
- ✅ Open Graph (`og:`) tags for Facebook/LinkedIn sharing
- ✅ Twitter Card tags for X/Twitter sharing
- ✅ `<link rel="canonical">` for duplicate content prevention
- ✅ `schema.org/WebApplication` JSON-LD structured data for Google rich results

### GEO Targeting (Malaysia / Southeast Asia)
- ✅ `<meta name="geo.region" content="MY">`
- ✅ `<meta name="geo.placename" content="Kuala Lumpur, Malaysia">`
- ✅ `<meta name="ICBM" content="3.1390, 101.6869">`

---

## 🧪 Testing & Troubleshooting

*Authored by **David**, Data Analyst & QA*

### Test Checklist
- [ ] Camera permission granted (green ● in preview)
- [ ] AI model loaded (status shows "System Ready. Show Hand.")
- [ ] PDF upload: opens and displays first page
- [ ] Gesture: ✋ Open Palm → slide advances with "Next Slide ➡️" feedback
- [ ] Gesture: ✌️ Victory → slide goes back with "Prev Slide ⬅️" feedback
- [ ] Voice: say "next" → slide advances with "Voice: Next ➡️" feedback
- [ ] Manual buttons: ➡️ and ⬅️ buttons work correctly

### Common Issues & Fixes

| Problem | Cause | Fix |
|---|---|---|
| **No gesture response** | Opened as `file://` (camera blocked) | Serve with `npx serve .` or Live Server |
| **"AI Failed. Use Buttons."** | MediaPipe WASM failed to load | Check browser console; ensure `libs/mediapipe/wasm/` files exist |
| **Camera access denied** | Permission blocked in browser settings | Chrome → Settings → Privacy → Camera → Allow for localhost |
| **PPTX not loading** | Complex PPTX or JSZip error | Save as PDF instead (`File > Save a Copy > PDF`) |
| **Voice not working** | Browser not Chrome, or mic denied | Use Chrome; check microphone permissions |
| **Gesture detected, no slide change** | Presentation not active | Upload a file first, then use gestures |

### Browser Console Diagnostics
Open DevTools (`F12`) → Console. You should see:
```
Script.js Global Execution Started
MediaPipe globals loaded successfully. { GestureRecognizer, FilesetResolver, DrawingUtils }
Gesture Recognizer Created Successfully
System Ready. Show Hand.
```
If you see errors instead, check the **Common Issues** table above.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

## 📄 License

MIT License © 2026 GesturePPT Team
