# 🗺️ Geolocation Wizard

A React-based interactive mapping application for selecting project locations, defining extents, and placing buildings with precision.

## ✨ Features

- **Interactive Map**: Satellite imagery with precise location selection
- **Multi-Step Wizard**: Guided workflow for location setup
- **Coordinate Tooltip**: Real-time lat/lng display and editing
- **Reverse Geocoding**: Automatic address lookup from coordinates
- **Search Functionality**: Address and coordinate-based search
- **Drag & Drop**: Intuitive marker positioning
- **Building Rotation**: 360° building orientation control

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
git clone <your-repo-url>
cd geolocation-wizard
npm install
```

### Development
```bash
npm start
# Opens http://localhost:3000
```

### Production Build
```bash
npm run build
npm install -g serve
serve -s build
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Leaflet** - Interactive maps
- **React Leaflet** - React bindings
- **Lucide React** - Icons
- **Nominatim API** - Geocoding services

## 📱 Usage

1. **Step 1**: Click or search to set project location
2. **Step 2**: Define project extent with radius control
3. **Step 3**: (Optional) Place and rotate buildings

### Coordinate Tooltip
- Appears next to markers in Step 1
- Edit latitude/longitude directly
- Drag to reposition
- Auto-updates address via reverse geocoding

## 🌐 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📧 Contact

Your Name - your.email@company.com
Project Link: [https://github.com/yourusername/geolocation-wizard](https://github.com/yourusername/geolocation-wizard)