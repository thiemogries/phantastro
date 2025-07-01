
![Phantastro Screenshot](public/logo192.png)

# Phantastro

**A stellar weather app for astronomical observations**

> 🤖 **Disclaimer:** This was heavily vibe coded

Phantastro is a weather application designed specifically for astronomy enthusiasts. It provides detailed weather forecasts with a focus on observing conditions, cloud coverage, atmospheric transparency, and other factors crucial for stargazing and astrophotography.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A free Meteoblue API key

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd phantastro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

4. **Get your free Meteoblue API key**:
   - Visit [Meteoblue Weather API](https://www.meteoblue.com/en/weather-api)
   - Create a free account
   - Copy your API key from the dashboard

5. **Configure your `.env` file**:
   ```env
   REACT_APP_METEOBLUE_API_KEY=your_api_key_here
   REACT_APP_DEFAULT_LAT=53.5511
   REACT_APP_DEFAULT_LON=9.9937
   REACT_APP_DEFAULT_LOCATION=Hamburg, Germany
   ```

6. **Start the development server**:
   ```bash
   npm start
   ```

7. **Open your browser** to `http://localhost:3000`

## 🛠 API Integration
- **Meteoblue Weather API** for meteorological data
- **Nominatim API** for location search

## 🚢 Deployment

### GitHub Pages

This app is hosted on GitHub Pages at [https://phantastro.pages.dev](https://phantastro.pages.dev).

---

**Clear skies and happy observing!** 🌌⭐🔭
