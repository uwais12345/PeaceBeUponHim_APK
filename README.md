# Peace Be Upon Him (ﷺ)

A comprehensive, beautifully designed Islamic application built to provide Muslims with essential daily tools and educational resources. The app is accessible both as a modern Web Application and a native Android App.

---

## 🌟 Key Features

The application offers a wide variety of tools and resources for daily Islamic practices:

- **📖 The Holy Quran:** Read and engage with the Quran with a clean, distraction-free interface.
- **🕌 Prayer Times (Salah):** Accurate daily prayer timings to help you stay on track.
- **🧭 Qibla Compass:** Find the exact direction of the Qibla (Kaaba) from anywhere in the world.
- **🤲 Dua & Dhikr:** A rich collection of daily supplications, remembrances, and post-salah (After Salah) invocations.
- **📚 Hadith Collection:** Authentic sayings and teachings of Prophet Muhammad (ﷺ).
- **📿 99 Names of Allah:** Beautifully presented names of Allah with their meanings.
- **📍 Nearby Masjids:** Discover mosques in your vicinity easily.
- **🎓 Islamic Lessons & Library:** Educational content, videos, and lectures powered dynamically by a dedicated YouTube channel integration.

---

## 💻 Tech Stack

- **Frontend:** React 19, Vite, React Router
- **Styling:** CSS / Framer Motion (for smooth animations) / Lucide React (for icons)
- **Mobile Capabilities:** Capacitor (for Android native packaging) and PWA (Progressive Web App) support
- **Backend / API:** Serverless API functions (hosted on Vercel) proxying YouTube Data API requests securely

---

## 🚀 Getting Started (For Developers)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/uwais12345/PeaceBeUponHim_APK.git
cd Peace-be-upon-him
npm install
```

### 2. Environment Variables
You need to set up your environment variables for the API and YouTube integration to work.
Create a `.env` file in the root of the project and add the following:
```env
# The YouTube Channel ID used to fetch lessons and videos
VITE_YOUTUBE_CHANNEL_ID=your_channel_id_here

# The base URL for the production API (used by the Android app to reach the backend)
VITE_API_BASE_URL=https://peacebeuponhim.vercel.app
```
*Note: The actual `YOUTUBE_API_KEY` is kept secret and securely configured in the Vercel server environment. Never expose your API keys in the frontend `.env` file.*

### 3. Running the App Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

---

## 📱 Building for Android

This project uses [Capacitor](https://capacitorjs.com/) to wrap the web app into a native Android APK.

### 1. Build the Web Assets
First, compile the production-ready web files:
```bash
npm run build
```

### 2. Sync with Android
Sync the newly built web assets and configuration into the Android project folder:
```bash
npx cap sync android
```

### 3. Compile the APK
You can open the project in Android Studio to build, or build it directly from the terminal (requires Android SDK installed):
```bash
cd android
./gradlew assembleDebug
```
The resulting `.apk` file will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Updating App Icons and Splash Screens
If you ever need to regenerate the Android icons:
1. Ensure your source logo is at `assets/icon-foreground.png` and `assets/icon-background.png`.
2. Run `npx @capacitor/assets generate --android`
3. Re-run the build and sync steps above.

---

## 🌐 Deployment

The web version of this application is deployed using [Vercel](https://vercel.com).
- **Live Production URL:** [https://peacebeuponhim.vercel.app](https://peacebeuponhim.vercel.app)
- Vercel automatically hosts the frontend and executes the serverless functions found in the `/api` directory.

---

## 🤝 Contributing

When contributing to this project:
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request on GitHub.

*May peace and blessings be upon you.*
