import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, RotateCw, Move, Navigation, GripHorizontal } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './GeolocationWizard.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons
const projectIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="#0696D7" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const buildingIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="16" height="24" fill="#FF6B35" stroke="white" stroke-width="2" rx="2"/>
      <rect x="10" y="18" width="3" height="3" fill="white"/>
      <rect x="15" y="18" width="3" height="3" fill="white"/>
      <rect x="10" y="23" width="3" height="3" fill="white"/>
      <rect x="15" y="23" width="3" height="3" fill="white"/>
      <rect x="12" y="32" width="4" height="8" fill="white"/>
    </svg>
  `),
  iconSize: [32, 48],
  iconAnchor: [16, 48],
});


interface WizardResult {
  projectLocation: [number, number] | null;
  projectExtent: { center: [number, number] | null; radius: number };
  buildingLocation: [number, number] | null;
  buildingRotation: number;
  interactionMode: string;
}

interface Props {
  onComplete?: (result: WizardResult) => void;
  onClose?: () => void;
}

// Map event handlers
function MapEvents({ 
  onMapClick, 
  interactionMode, 
  currentStep 
}: { 
  onMapClick: (latlng: L.LatLng) => void;
  interactionMode: string;
  currentStep: number;
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Component to handle map centering
function MapCenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

// Custom draggable marker component
function DraggableMarker({ 
  position, 
  onDragEnd, 
  icon, 
  children 
}: {
  position: [number, number];
  onDragEnd?: (latlng: L.LatLng) => void;
  icon: L.Icon;
  children?: React.ReactNode;
}) {
  const markerRef = useRef<L.Marker>(null);
  
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker && onDragEnd) {
        onDragEnd(marker.getLatLng());
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    >
      {children}
    </Marker>
  );
}



// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: { title: string }[] }) {
  return (
    <div className="step-indicator">
      <div className="step-indicator-content">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className={`step-item ${index === currentStep ? 'step-active' : ''}`}>
              <div className="step-title">
                {step.title}
              </div>
              <div className={`step-number ${
                index < currentStep
                  ? 'step-completed'
                  : index === currentStep
                  ? 'step-current'
                  : 'step-pending'
              }`}>
                {index + 1}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${
                index < currentStep ? 'step-connector-completed' : 'step-connector-pending'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Search component
function SearchInput({ 
  onSearch, 
  value = "",
  placeholder = "Enter address or latitude/longitude to start" 
}: {
  onSearch: (searchTerm: string) => void;
  value?: string;
  placeholder?: string;
}) {
  const [searchValue, setSearchValue] = useState(value);

  // Update local state when external value changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="search-input"
          />
        </div>
      </form>
    </div>
  );
}

// Interaction mode toggle
function InteractionModeToggle({ mode, onModeChange }: {
  mode: string;
  onModeChange: (mode: 'drag' | 'center') => void;
}) {
  return (
    <div className="mode-toggle">
      <div className="mode-toggle-title">Interaction Mode</div>
      <div className="mode-toggle-buttons">
        <button
          onClick={() => onModeChange('drag')}
          className={`mode-button ${mode === 'drag' ? 'active' : 'inactive'}`}
        >
          <Move className="mode-icon" />
          Drag
        </button>
        <button
          onClick={() => onModeChange('center')}
          className={`mode-button ${mode === 'center' ? 'active' : 'inactive'}`}
        >
          <Navigation className="mode-icon" />
          Center
        </button>
      </div>
    </div>
  );
}

// Building rotation control
function BuildingRotationControl({ 
  rotation, 
  onRotationChange, 
  visible 
}: {
  rotation: number;
  onRotationChange: (rotation: number) => void;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="rotation-control">
      <div className="rotation-title">Building Rotation</div>
      <div className="rotation-buttons">
        <button
          onClick={() => onRotationChange(rotation - 15)}
          className="rotation-button"
        >
          <RotateCw className="rotation-icon-left" />
        </button>
        <span className="rotation-value">{rotation}°</span>
        <button
          onClick={() => onRotationChange(rotation + 15)}
          className="rotation-button"
        >
          <RotateCw className="rotation-icon" />
        </button>
      </div>
    </div>
  );
}

// Map Reference Component to capture map instance
function MapRef({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  return null;
}

// Coordinate Tooltip Component
function CoordinateTooltip({ 
  position, 
  onPositionChange, 
  isDraggable = true,
  mapRef
}: { 
  position: [number, number]; 
  onPositionChange: (lat: number, lng: number) => void;
  isDraggable?: boolean;
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const [localLat, setLocalLat] = useState(position[0].toFixed(6));
  const [localLng, setLocalLng] = useState(position[1].toFixed(6));
  const [isDragging, setIsDragging] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const point = map.latLngToContainerPoint([position[0], position[1]]);
    setTooltipPosition({
      x: point.x + 60, // Offset to the right of the marker
      y: point.y - 30  // Offset above the marker
    });
  }, [mapRef, position]);

  // Update tooltip position when marker position changes
  useEffect(() => {
    setLocalLat(position[0].toFixed(6));
    setLocalLng(position[1].toFixed(6));
    updateTooltipPosition();
  }, [position, updateTooltipPosition]);

  // Update tooltip position when map view changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updatePosition = () => updateTooltipPosition();
    
    map.on('zoom', updatePosition);
    map.on('move', updatePosition);
    map.on('resize', updatePosition);

    return () => {
      map.off('zoom', updatePosition);
      map.off('move', updatePosition);
      map.off('resize', updatePosition);
    };
  }, [mapRef, updateTooltipPosition]);

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalLat(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= -90 && numValue <= 90) {
      onPositionChange(numValue, position[1]);
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalLng(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= -180 && numValue <= 180) {
      onPositionChange(position[0], numValue);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosition = { ...tooltipPosition };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      setTooltipPosition({
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={tooltipRef}
      className="coordinate-tooltip"
      style={{ 
        cursor: isDragging ? 'grabbing' : 'default',
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        transform: 'none'
      }}
    >
      <div className="coordinate-tooltip-content">
        <div 
          className="coordinate-gripper"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <GripHorizontal className="gripper-icon" />
        </div>
        <div className="coordinate-inputs">
          <div className="coordinate-row">
            <label className="coordinate-label">Latitude</label>
            <input
              type="number"
              value={localLat}
              onChange={handleLatChange}
              className="coordinate-input"
              step="0.000001"
              min="-90"
              max="90"
            />
          </div>
          <div className="coordinate-row">
            <label className="coordinate-label">Longitude</label>
            <input
              type="number"
              value={localLng}
              onChange={handleLngChange}
              className="coordinate-input"
              step="0.000001"
              min="-180"
              max="180"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Instruction overlay
function InstructionOverlay({ step, interactionMode }: { step: number; interactionMode: string }) {
  const instructions = {
    0: {
      drag: "Search for a location or click on the map to place a project marker. You can drag the marker to adjust its position.",
      center: "Search for a location to center the map, then use the crosshair to position your project."
    },
    1: {
      drag: "Click and drag to create a circular project extent. Drag the blue handles to resize the circle.",
      center: "Use the map controls to position the circular extent for your project area."
    },
    2: {
      drag: "Click to place a building within the project extent. Drag to reposition and use the rotation controls.",
      center: "Center the map where you want to place the building, then use the controls to position and rotate it."
    }
  };

  return (
    <div className="instruction-overlay">
      <p className="instruction-text">
        {instructions[step as keyof typeof instructions]?.[interactionMode as keyof typeof instructions[0]]}
      </p>
    </div>
  );
}

export default function GeolocationWizard({ onClose, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [interactionMode, setInteractionMode] = useState<'drag' | 'center'>('drag');
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // Center of US
  const [mapZoom, setMapZoom] = useState(4);
  const [projectLocation, setProjectLocation] = useState<[number, number] | null>(null);
  const [projectExtent, setProjectExtent] = useState<{ center: [number, number] | null; radius: number }>({ center: null, radius: 1000 });
  const [buildingLocation, setBuildingLocation] = useState<[number, number] | null>(null);
  const [buildingRotation, setBuildingRotation] = useState(0);
  const [searchAddress, setSearchAddress] = useState("");
  const mapRef = useRef<L.Map | null>(null);

  const steps = [
    { title: 'Locate project' },
    { title: 'Extent' },
    { title: 'Place building (Optional)' }
  ];

  // Geocoding function (simplified - in production, use a proper geocoding service)
  const geocodeLocation = async (searchTerm: string): Promise<{ lat: number; lng: number }> => {
    // Check if it's coordinates (lat,lng format)
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (coordPattern.test(searchTerm)) {
      const [lat, lng] = searchTerm.split(',').map(Number);
      return { lat, lng };
    }

    // For demo purposes, return a mock location
    // In production, integrate with a geocoding service like Nominatim or Google Geocoding
    return { lat: 40.7128, lng: -74.0060 }; // NYC coordinates
  };

  // Reverse geocoding function to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using Nominatim reverse geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    
    // Fallback to coordinates if reverse geocoding fails
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const handleSearch = async (searchTerm: string) => {
    try {
      const location = await geocodeLocation(searchTerm);
      setMapCenter([location.lat, location.lng]);
      setMapZoom(15);
      
      if (currentStep === 0) {
        setProjectLocation([location.lat, location.lng]);
        
        // If user searched with coordinates, keep them as is, otherwise try reverse geocoding
        const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
        if (coordPattern.test(searchTerm)) {
          setSearchAddress(searchTerm);
        } else {
          // For address searches, try to get the proper formatted address
          try {
            const address = await reverseGeocode(location.lat, location.lng);
            setSearchAddress(address);
          } catch (error) {
            setSearchAddress(searchTerm); // Fallback to original search term
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleMapClick = async (latlng: L.LatLng) => {
    if (currentStep === 0) {
      setProjectLocation([latlng.lat, latlng.lng]);
      if (interactionMode === 'center') {
        setMapCenter([latlng.lat, latlng.lng]);
      }
      
      // Update search address when clicking on map
      try {
        const address = await reverseGeocode(latlng.lat, latlng.lng);
        setSearchAddress(address);
      } catch (error) {
        console.error('Failed to reverse geocode:', error);
        setSearchAddress(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
      }
    } else if (currentStep === 1) {
      setProjectExtent({ center: [latlng.lat, latlng.lng], radius: 1000 });
      if (interactionMode === 'center') {
        setMapCenter([latlng.lat, latlng.lng]);
      }
    } else if (currentStep === 2) {
      setBuildingLocation([latlng.lat, latlng.lng]);
      if (interactionMode === 'center') {
        setMapCenter([latlng.lat, latlng.lng]);
      }
    }
  };

  const handleMarkerDrag = async (latlng: L.LatLng, type: 'project' | 'extent' | 'building') => {
    if (type === 'project') {
      setProjectLocation([latlng.lat, latlng.lng]);
      
      // Update search address when project marker is dragged
      if (currentStep === 0) {
        try {
          const address = await reverseGeocode(latlng.lat, latlng.lng);
          setSearchAddress(address);
        } catch (error) {
          console.error('Failed to reverse geocode:', error);
          setSearchAddress(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
        }
      }
    } else if (type === 'extent') {
      setProjectExtent(prev => ({ ...prev, center: [latlng.lat, latlng.lng] }));
    } else if (type === 'building') {
      setBuildingLocation([latlng.lat, latlng.lng]);
    }
  };

  const handleCoordinateChange = async (lat: number, lng: number) => {
    setProjectLocation([lat, lng]);
    setMapCenter([lat, lng]);
    
    // Update search address with reverse geocoding
    try {
      const address = await reverseGeocode(lat, lng);
      setSearchAddress(address);
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      setSearchAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return projectLocation !== null;
    if (currentStep === 1) return projectExtent.center !== null;
    return true; // Step 2 is optional
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Auto-center on the project location for next step
      if (currentStep === 0 && projectLocation) {
        setMapCenter(projectLocation);
        setMapZoom(14);
        if (currentStep + 1 === 1) {
          // Set initial extent center to project location
          setProjectExtent({ center: projectLocation, radius: 1000 });
        }
      }
    } else {
      // Wizard complete
      const result: WizardResult = {
        projectLocation,
        projectExtent,
        buildingLocation,
        buildingRotation,
        interactionMode
      };
      if (onComplete) {
        onComplete(result);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="wizard-container">
      {/* Header */}
      <div className="wizard-header">
        <div className="wizard-header-content">
          <h1 className="wizard-title">Create geolocation</h1>
          {onClose && (
            <button onClick={onClose} className="close-button">
              <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} steps={steps} />

      {/* Map Container */}
      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-map"
        >
          <MapRef mapRef={mapRef} />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
          
          <MapCenter center={mapCenter} zoom={mapZoom} />
          <MapEvents 
            onMapClick={handleMapClick} 
            interactionMode={interactionMode}
            currentStep={currentStep}
          />

          {/* Project Location Marker */}
          {projectLocation && (
            interactionMode === 'drag' ? (
              <DraggableMarker
                position={projectLocation}
                onDragEnd={(latlng) => handleMarkerDrag(latlng, 'project')}
                icon={projectIcon}
              />
            ) : (
              <Marker position={projectLocation} icon={projectIcon} />
            )
          )}

          {/* Project Extent Circle */}
          {currentStep >= 1 && projectExtent.center && (
            <>
              <Circle
                center={projectExtent.center}
                radius={projectExtent.radius}
                pathOptions={{
                  fillColor: '#0696D7',
                  fillOpacity: 0.1,
                  color: '#0696D7',
                  weight: 2,
                }}
              />
              {interactionMode === 'drag' && (
                <DraggableMarker
                  position={projectExtent.center}
                  onDragEnd={(latlng) => handleMarkerDrag(latlng, 'extent')}
                  icon={projectIcon}
                />
              )}
            </>
          )}

          {/* Building Location */}
          {currentStep >= 2 && buildingLocation && (
            interactionMode === 'drag' ? (
              <DraggableMarker
                position={buildingLocation}
                onDragEnd={(latlng) => handleMarkerDrag(latlng, 'building')}
                icon={buildingIcon}
              />
            ) : (
              <Marker position={buildingLocation} icon={buildingIcon} />
            )
          )}
        </MapContainer>

        {/* UI Overlays */}
        <InteractionModeToggle 
          mode={interactionMode} 
          onModeChange={setInteractionMode}
        />
        
        {currentStep === 0 && (
          <SearchInput 
            onSearch={handleSearch} 
            value={searchAddress}
          />
        )}

        {currentStep === 0 && projectLocation && (
          <CoordinateTooltip
            position={projectLocation}
            onPositionChange={handleCoordinateChange}
            isDraggable={true}
            mapRef={mapRef}
          />
        )}

        <BuildingRotationControl
          rotation={buildingRotation}
          onRotationChange={setBuildingRotation}
          visible={currentStep === 2 && buildingLocation !== null}
        />

        <InstructionOverlay step={currentStep} interactionMode={interactionMode} />

        {/* Crosshair for center mode */}
        {interactionMode === 'center' && (
          <div className="crosshair">
            <div className="crosshair-svg">
              <svg viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="none" stroke="#0696D7" strokeWidth="2" />
                <line x1="16" y1="4" x2="16" y2="12" stroke="#0696D7" strokeWidth="2" />
                <line x1="16" y1="20" x2="16" y2="28" stroke="#0696D7" strokeWidth="2" />
                <line x1="4" y1="16" x2="12" y2="16" stroke="#0696D7" strokeWidth="2" />
                <line x1="20" y1="16" x2="28" y2="16" stroke="#0696D7" strokeWidth="2" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="wizard-footer">
        <div className="wizard-footer-content">
          <button className="help-button" onClick={() => console.log('Help clicked')}>
            Help
          </button>
          <div className="footer-buttons">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="btn-secondary"
            >
              Previous
            </button>
            {onClose && (
              <button 
                onClick={onClose}
                className="btn-secondary">
                Cancel
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

