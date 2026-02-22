# 🖐️ GesturePPT – AI Hand Gesture & Voice Controlled Presentation Viewer

> **Control your presentations hands-free.** Upload a PDF or PPTX, wave your hand, and present like a pro — no clicker, no mouse, no hardware required.

[![Browser](https://img.shields.io/badge/Browser-Chrome%20%7C%20Edge-blue)](#)
[![AI](https://img.shields.io/badge/AI-MediaPipe%20Tasks%20Vision-orange)](#)
[![Voice](https://img.shields.io/badge/Voice-Web%20Speech%20API-green)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen)](#)

---

## 📋 Project Overview

*Written by **Mike**, Team Leader*

**GesturePPT** is a fully browser-based, AI-powered presentation controller. It uses **Google MediaPipe Tasks Vision** to perform real-time hand gesture recognition via your webcam, and the **Web Speech API** for bilingual (English + Chinese) hands-free voice commands — all running in your browser with **zero installation**.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| AI Gesture Recognition | [MediaPipe Tasks Vision 0.10.3](https://developers.google.com/mediapipe) (CDN ES Module) |
| Webcam Access | WebRTC (`getUserMedia`) |
| Voice Commands | Web Speech API — bilingual `zh-CN` / English |
| PDF Rendering | [PDF.js 3.11](https://mozilla.github.io/pdf.js/) (CDN) |
| PPTX Conversion | [PPTXjs](https://github.com/meshesha/PPTXjs) + JSZip (CDN) |
| Audio | [Howler.js](https://howlerjs.com/) (CDN) |
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2020) |

All third-party libraries load from **CDN first, local fallback** — so the app works on GitHub Pages even without the `libs/` folder committed.

---

## ✨ Features

*Authored by **Emma**, Product Manager*

- 🖐️ **Hand Gesture Slide Control** — Open Palm (next), Victory (prev), Thumb Up (end), Pointing Up (fullscreen)
- 🎙️ **Bilingual Voice Commands** — English and Chinese (下一张 / 上一张 / 结束)
- 📄 **PDF Rendering** — Pixel-perfect display via PDF.js
- 📊 **PPTX Support** — Experimental browser-side PPTX rendering (no server)
- ⛶ **Full Screen Mode** — One gesture or voice command
- 🔄 **Manual Fallback** — On-screen Prev/Next buttons always available
- 🎤 **Re-activate Mic Button** — One-click mic restart if voice recognition stops

---

## 🚀 Getting Started

*Written by **Alex**, Full Stack Engineer*

### Prerequisites
- **Google Chrome** (recommended) or Microsoft Edge
- A **webcam** for hand gesture control
- A **microphone** for voice commands

> **⚠️ Note:** Firefox and Safari have limited Web Speech API support. Use **Google Chrome** for best results.

### Run Locally

No build step required.

```bash
# Clone the repo
git clone https://github.com/tiansu888888/GesturePPT.git
cd GesturePPT

# Serve locally (required — camera is blocked on file:// URLs)
python -m http.server 3000

# Open Chrome at:
# http://localhost:3000
```

### First Run
1. Open Chrome → `http://localhost:3000`
2. Click **Allow** when prompted for camera and microphone
3. Wait for the green ● dot in the camera preview (AI model loaded, ~10–20 s first time)
4. Upload a PDF or PPTX
5. Show your hand to the camera and start presenting!

### File Structure
```
gesture-ppt/
├── index.html          # Main entry (loads MediaPipe as ES module)
├── script.js           # Gesture, voice, PDF, PPTX logic
├── style.css           # UI styling
├── README.md           # This file
└── libs/
    ├── mediapipe/
    │   ├── gesture_recognizer.task   # Trained gesture model (8.4 MB, local)
    │   └── wasm/                     # WASM fallback (WASM loads from CDN)
    ├── pdfjs/                        # PDF.js local fallback
    ├── pptxjs/                       # PPTXjs (no CDN available)
    └── others/                       # jQuery, JSZip, D3, Howler local fallbacks
```

> **Note:** `libs/` is only needed for local/offline use. When deployed to GitHub Pages, all major libraries are loaded from CDN automatically.

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

---

## 🎙️ Voice Command Reference

Supports both **English** and **Chinese (普通话)**. Voice language is set to `zh-CN`.

| Say (English) | Say (Chinese) | Action |
|---|---|---|
| "next" | "下一张" / "下一页" | Next Slide |
| "back" / "previous" | "上一张" / "上一页" | Previous Slide |
| "stop" / "end presentation" / "thank you" | "结束" / "停止" / "退出" | End Presentation |
| "full screen" / "full" | "全屏" | Enter Full Screen |
| "exit" / "leave" | "退出全屏" | Exit Full Screen |
| "play" / "music" | "播放" / "音乐" | Play Sound Effect |

> If voice stops responding, click the **🎤 Re-activate Mic** button in the sidebar.

---

## 🧪 Testing & Troubleshooting

*Authored by **David**, Data Analyst & QA*

### Test Checklist
- [ ] Camera permission granted (green ● in camera preview)
- [ ] AI model loaded (status: "System Ready. Show Hand.")
- [ ] PDF upload: displays first page correctly
- [ ] Gesture ✋ Open Palm → slide advances
- [ ] Gesture ✌️ Victory → slide goes back
- [ ] Voice "next" or "下一张" → slide advances
- [ ] Manual ➡️ ⬅️ buttons work

### Common Issues & Fixes

| Problem | Cause | Fix |
|---|---|---|
| **"Gestures Unavailable"** | MediaPipe CDN failed to load | Check internet connection; CDN loads from jsDelivr |
| **AI model loads slow** | First load downloads WASM from CDN | Wait 10–20 s; subsequent loads are faster (cached) |
| **Camera access denied** | Browser permission blocked | Chrome → Settings → Privacy → Camera → Allow for localhost |
| **Voice not responding** | Mic not active or recognition stopped | Click **🎤 Re-activate Mic** in sidebar |
| **Voice not understanding me** | Language mismatch | The app uses `zh-CN`; try saying commands clearly |
| **PPTX not loading** | Complex slide or JSZip error | Export as PDF instead (`File > Save a Copy > PDF`) |
| **Gesture detected, no slide change** | No file uploaded yet | Upload a PDF or PPTX first |

### Browser Console Diagnostics

Open DevTools (`F12`) → Console. On successful load you should see:
```
Script.js Global Execution Started
[MediaPipe] ES module loaded. Classes assigned to window.
[MediaPipe] mediapipe-ready event received. Starting app...
[Voice] Speech recognition started.
Gesture Recognizer Created Successfully
```

---

## 🔍 SEO & Discoverability

*Authored by **Sarah**, SEO Specialist*

GesturePPT targets educators, students, and developers searching for:
- **"gesture controlled presentation browser"**
- **"hand gesture PowerPoint control"**
- **"AI slide navigator webcam"**
- **"hands-free PDF presenter"**

Implemented: `<title>`, `<meta description>`, Open Graph, Twitter Cards, JSON-LD structured data, and GEO targeting for Malaysia / Southeast Asia.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss what you'd like to change.

## 📄 License

MIT License © 2026 GesturePPT Team
