# ⭐ Phantastro

**A stellar weather app for astronomical observations**

Phantastro is a specialized React-based weather application designed specifically for astronomy enthusiasts. It provides detailed weather forecasts with a focus on observing conditions, cloud coverage, atmospheric seeing, and other factors crucial for stargazing and astrophotography.

![Phantastro Screenshot](public/logo192.png)

## 🌟 Features

### 🔭 Astronomical Focus
- **Seeing Conditions**: Atmospheric turbulence forecasts for telescope observations
- **Cloud Layer Analysis**: Detailed breakdown of low, mid, and high-altitude clouds
- **Transparency Forecasts**: Atmospheric clarity predictions for deep-sky observations
- **Equipment Stability**: Wind speed analysis for telescope stability

### 🌤️ Comprehensive Weather Data
- **7-Day Forecast**: Extended outlook for planning observing sessions
- **Hourly Updates**: 24-hour detailed forecasts with observing quality indicators
- **Real-time Conditions**: Current weather with astronomical observation recommendations
- **Location Search**: Find weather data for observatories and dark-sky sites worldwide

### 🎯 Smart Recommendations
- **Observation Type Suggestions**: Planetary, deep-sky, lunar, solar, and astrophotography recommendations
- **Quality Scoring**: 0-10 scoring system for different observing conditions
- **Equipment Tips**: Personalized advice based on current conditions
- **Best Viewing Hours**: Automatic identification of optimal observing windows

### 🌍 Global Coverage
- **Popular Observatory Sites**: Quick access to famous astronomical locations
- **Custom Locations**: Search for any location worldwide
- **Elevation Data**: Important for atmospheric pressure calculations
- **Time Zone Support**: Accurate sunrise/sunset times for any location

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
   cp .env.example .env
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

## 🎨 Design Philosophy

Phantastro features a **cosmic dark theme** inspired by the night sky:
- **Deep space colors**: Dark blues and purples mimicking the cosmos
- **Star-themed icons**: Custom favicon and loading animations
- **Gradient accents**: Purple-to-magenta gradients representing stellar phenomena
- **Responsive design**: Works beautifully on desktop, tablet, and mobile devices

## 📊 Understanding the Data

### Observing Quality Scale (0-10)
- **9-10**: Excellent - Perfect conditions for any observation
- **7-8**: Good - Great for most observations
- **5-6**: Fair - Adequate for bright objects
- **3-4**: Poor - Limited observations possible
- **0-2**: Impossible - Indoor activities recommended

### Cloud Coverage
- **0-10%**: Clear skies 🌌
- **10-25%**: Mostly clear 🌙
- **25-50%**: Partly cloudy ⛅
- **50-75%**: Mostly cloudy ☁️
- **75-100%**: Overcast ☁️

### Observation Type Recommendations
- **🪐 Planetary**: Requires steady atmosphere, low wind
- **🌌 Deep Sky**: Needs dark, transparent skies
- **📸 Astrophotography**: Requires stable conditions, minimal wind
- **🌙 Lunar**: Works with some clouds, wind-tolerant
- **☀️ Solar**: Can work with partial cloud coverage

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **CSS3** with custom cosmic styling
- **Date-fns** for time formatting
- **Axios** for API requests

### API Integration
- **Meteoblue Weather API** for meteorological data
- **Custom algorithms** for astronomical condition calculations
- **Mock data support** for development without API key

### Features
- **Progressive Web App** ready
- **Responsive design** for all devices
- **Accessibility** features with ARIA labels
- **Error handling** with retry mechanisms

## 🌍 Popular Observatory Locations

Phantastro includes quick access to world-renowned astronomical sites:

- **🔭 Mauna Kea, Hawaii** - World's premier observatory site (4,207m)
- **🏜️ Atacama Desert, Chile** - Home to ALMA and VLT (2,400m)
- **🏔️ La Palma, Spain** - Roque de los Muchachos Observatory (2,396m)
- **🎿 Pic du Midi, France** - Historic mountain observatory (2,877m)
- **🌲 Mount Wilson, California** - Historic observatory (1,742m)

### API Information

### Meteoblue Integration
- **Free Tier**: 500 API calls per day
- **Package Used**: Basic hourly weather data (`basic-1h`)
- **Data Coverage**: Global weather data
- **Update Frequency**: Hourly forecasts
- **Forecast Range**: 24-hour detailed + 7-day outlook
- **Astronomy Features**: Enhanced with calculated data

### Custom Calculations
- **Seeing Estimation**: Based on wind speed and atmospheric pressure
- **Transparency Index**: Calculated from humidity and cloud coverage
- **Equipment Stability**: Wind speed analysis for telescope mounts
- **Observation Scoring**: Multi-factor algorithm for optimal viewing times

## 🔧 Development

### Project Structure
```
phantastro/
├── public/                 # Static assets and custom icons
├── src/
│   ├── components/        # React components
│   ├── services/          # API integration and weather service
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions and calculations
│   └── App.tsx           # Main application component
├── .env.example          # Environment variable template
└── README.md             # This file
```

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Use the `build` folder
- **Docker**: Containerize with nginx

### Environment Variables
Remember to set your environment variables in your deployment platform:
- `REACT_APP_METEOBLUE_API_KEY`
- `REACT_APP_DEFAULT_LAT`
- `REACT_APP_DEFAULT_LON`
- `REACT_APP_DEFAULT_LOCATION`

## 🌟 Tips for Astronomers

### Best Practices
- **Check hourly forecasts** for short observation windows
- **Monitor seeing conditions** for planetary observations
- **Watch cloud trends** throughout the day
- **Plan around moon phases** for deep-sky photography

### Reading the Data
- **Green indicators**: Excellent conditions, perfect for any observation
- **Yellow indicators**: Fair conditions, good for bright objects
- **Red indicators**: Poor conditions, consider indoor activities
- **Wind speed**: Critical for telescope stability and image quality

## 🎯 Roadmap

### Upcoming Features
- [ ] **Moon phase calendar** with illumination percentages
- [ ] **Satellite pass predictions** for ISS and other objects
- [ ] **Aurora forecasts** for northern/southern lights
- [ ] **Light pollution maps** integration
- [ ] **Equipment-specific recommendations** (telescope types)
- [ ] **Historical weather analysis** for location planning
- [ ] **Push notifications** for excellent viewing conditions
- [ ] **User profiles** with favorite locations

### Long-term Goals
- [ ] **Mobile app** versions (iOS/Android)
- [ ] **Offline support** for remote locations
- [ ] **Weather station integration** for real-time local data
- [ ] **Community features** for sharing observation reports
- [ ] **AI-powered predictions** for optimal viewing times

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **Meteoblue** for providing excellent weather data
- **The astronomy community** for inspiration and feedback
- **React team** for the amazing framework
- **Open source contributors** who make projects like this possible

## 💬 Support

Having issues or questions?
- 🐛 **Bug reports**: Open an issue on GitHub
- 💡 **Feature requests**: Share your ideas in discussions
- 📧 **General questions**: Check the FAQ or reach out

## 🔧 Troubleshooting

### API Issues

**Problem**: Getting "Data corrupted" or "invalid package" errors from Meteoblue API
- **Solution**: App uses only basic weather packages available in free tier
- **Auto-fallback**: Automatically switches to mock data if API calls fail
- **Check**: Ensure your API key is correctly set in `.env`
- **Verify**: API key should not be `your_meteoblue_api_key_here`

**Problem**: No weather data loading
- **Check**: Open browser developer console for error messages
- **Solution**: App uses high-quality mock data when API is unavailable
- **Verify**: Meteoblue free tier allows 500 calls/day

**Problem**: "Failed to fetch weather data" error
- **Causes**:
  - Invalid API key
  - API rate limit exceeded (500 calls/day limit)
  - Network connectivity issues
  - Meteoblue API temporary outage
  - Package not available in your plan
- **Solution**: App automatically switches to mock data for uninterrupted experience
- **Note**: Mock data provides full astronomical functionality

### Development Mode
- App works perfectly without an API key using realistic mock data
- All features are functional in development mode
- Mock data includes varied weather conditions for testing

### Getting Help
- Check browser console for detailed error messages
- Verify `.env` file configuration
- Test with different locations
- Try refreshing the page

---

**Clear skies and happy observing!** 🌌⭐🔭

*Built with ❤️ for the astronomy community*