import React, { useState } from 'react';
import GeolocationWizard from './components/GeolocationWizard';
import './App.css';

interface WizardResult {
  projectLocation: [number, number] | null;
  projectExtent: { center: [number, number] | null; radius: number };
  buildingLocation: [number, number] | null;
  buildingRotation: number;
  interactionMode: string;
}

function App() {
  const [wizardResult, setWizardResult] = useState<WizardResult | null>(null);

  const handleWizardComplete = (result: WizardResult) => {
    console.log('Geolocation wizard completed:', result);
    setWizardResult(result);
  };

  const handleWizardReset = () => {
    setWizardResult(null);
  };

  return (
    <div className="App">
      {wizardResult ? (
        <div className="results-container">
          <div className="results-card">
            <h2 className="results-title">✅ Geolocation Setup Complete!</h2>
            <div className="results-content">
              <div className="result-item">
                <strong>Project Location:</strong> {wizardResult.projectLocation ? `${wizardResult.projectLocation[0].toFixed(6)}, ${wizardResult.projectLocation[1].toFixed(6)}` : 'Not set'}
              </div>
              <div className="result-item">
                <strong>Project Extent:</strong> {wizardResult.projectExtent?.center ? `Center: ${wizardResult.projectExtent.center[0].toFixed(6)}, ${wizardResult.projectExtent.center[1].toFixed(6)}, Radius: ${wizardResult.projectExtent.radius}m` : 'Not set'}
              </div>
              <div className="result-item">
                <strong>Building Location:</strong> {wizardResult.buildingLocation ? `${wizardResult.buildingLocation[0].toFixed(6)}, ${wizardResult.buildingLocation[1].toFixed(6)}` : 'Not placed'}
              </div>
              <div className="result-item">
                <strong>Building Rotation:</strong> {wizardResult.buildingRotation}°
              </div>
              <div className="result-item">
                <strong>Interaction Mode Used:</strong> {wizardResult.interactionMode}
              </div>
            </div>
            <button 
              onClick={handleWizardReset}
              className="reset-button"
            >
              Start New Wizard
            </button>
          </div>
        </div>
      ) : (
        <GeolocationWizard onComplete={handleWizardComplete} />
      )}
    </div>
  );
}

export default App;