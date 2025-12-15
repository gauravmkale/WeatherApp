import { useState, useEffect, useMemo, memo } from 'react';
import './App.css';
import axios from 'axios';

// --- WEATHER EFFECTS COMPONENTS (Defined Outside App for Persistence) ---

const SunEffect = () => (
  <div className="sun-container">
    <div className="sun"></div>
  </div>
);

const MoonEffect = () => (
  <div className="moon-container">
    <div className="moon"></div>
  </div>
);

const RainEffect = () => (
  <div className="rain-container">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="raindrop"
        style={{
          left: `${Math.random() * 100}%`,
          animationDuration: `${0.5 + Math.random() * 0.5}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      />
    ))}
  </div>
);

const SnowEffect = () => (
  <div className="snow-container">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="snowflake"
        style={{
          left: `${Math.random() * 100}%`,
          animationDuration: `${3 + Math.random() * 5}s`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: Math.random(),
          fontSize: `${10 + Math.random() * 20}px`
        }}
      >
        ❄
      </div>
    ))}
  </div>
);

const NightEffect = () => (
  <div className="night-container">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="star"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 80}%`,
          animationDelay: `${Math.random() * 3}s`,
          width: `${1 + Math.random() * 2}px`,
          height: `${1 + Math.random() * 2}px`
        }}
      />
    ))}
  </div>
);

const ThunderstormEffect = () => {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) { 
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={`lightning-flash ${flash ? 'active' : ''}`}></div>
      <RainEffect />
    </>
  );
};

const CloudyEffect = () => (
  <div className="clouds-container">
    {[...Array(8)].map((_, i) => {
      const size = Math.random() > 0.6 ? 'large' : (Math.random() > 0.3 ? 'medium' : 'small');
      const top = Math.random() * 60; 
      const duration = 20 + Math.random() * 40; 
      
      return (
        <div
          key={i}
          className={`cloud ${size}`}
          style={{
            top: `${top}%`,
            left: `-200px`,
            animationDuration: `${duration}s`,
            animationDelay: `${i * -5}s`
          }}
        />
      );
    })}
  </div>
);

const WeatherEffects = memo(({ type, isNight }) => {
  return (
    <>
      {isNight ? <MoonEffect /> : (type !== 'rainy' && type !== 'thunderstorm' && <SunEffect />)}
      {isNight && <NightEffect />}

      {type === 'rainy' && <RainEffect />}
      {type === 'snowy' && <SnowEffect />}
      {type === 'thunderstorm' && <ThunderstormEffect />}
      {(type === 'cloudy' || type === 'partly_cloudy') && <CloudyEffect />}
      
      {type === 'sunny' && !isNight && (
         <div className="clouds-container" style={{opacity: 0.6}}>
            <div className="cloud small" style={{top: '10%', animationDuration:'45s'}} />
            <div className="cloud medium" style={{top: '25%', animationDuration:'55s', animationDelay:'-20s'}} />
         </div>
      )}
    </>
  );
});


// --- DASHBOARD COMPONENT ---
const WeatherDashboard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="weather-dashboard">
      <div className="dashboard-header">
        <h2 className="city-name">{data.city}</h2>
        <p className="condition-text">{data.condition}</p>
      </div>
      
      <div className="main-stats">
        <div className="temp-display">
          <span className="temp-value">{data.temp}</span>
          <span className="temp-unit">°C</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Feels Like</span>
          <span className="stat-value">{data.feels_like}°</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Humidity</span>
          <span className="stat-value">{data.humidity}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Wind</span>
          <span className="stat-value">{data.wind_speed} <small>km/h</small></span>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [input, setInput] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState({ type: 'neutral', isNight: false });

  const determineWeather = (condition, timeOfDay) => {
    const lowerCondition = (condition || "").toLowerCase();
    const isNight = timeOfDay === "NIGHT";
    
    let type = 'neutral';
    if (lowerCondition.includes('thunderstorm')) {
      type = 'thunderstorm';
    } else if (lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) {
      type = 'snowy';
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
      type = 'rainy';
    } else if (lowerCondition.includes('fog') || lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      type = 'cloudy';
    } else if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
      type = 'sunny';
    } else if (isNight) {
        type = 'sunny'; 
    }
    return { type, isNight };
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setWeatherData(null);
    
    try {
      const response = await axios.post('http://localhost:8000/chat', { message: input });
      
      // The backend with return_direct=True now returns a JSON Object directly.
      const rawData = response.data.response;
      console.log("API Response:", rawData);

      if (rawData && rawData.city) {
        setWeatherData(rawData);
        setWeather(determineWeather(rawData.condition, rawData.time_of_day));
      } else if (rawData && rawData.error) {
          alert(rawData.error);
      } else if (typeof rawData === 'string') {
          // Fallback: If the agent returns plain text (e.g., "I don't understand"), show it.
          alert(rawData);
      } else {
          console.warn("Unexpected response format:", rawData);
          alert("Received an unexpected response from the server.");
      }
      
      setInput(''); 
    } catch (error) {
      console.error("Error fetching response:", error);
      alert("Could not fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-wrapper ${weather.type} ${weather.isNight ? 'night-mode' : ''}`}>
      <WeatherEffects type={weather.type} isNight={weather.isNight} />
      
      <div className="app-container">
        {!weatherData && !loading && (
           <div className="welcome-screen">
             <h1>Weather App</h1>
             <p>Enter a city to get started</p>
           </div>
        )}

        {loading && <div className="loading-spinner">Checking weather...</div>}

        {weatherData && !loading && (
          <WeatherDashboard data={weatherData} />
        )}

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search city..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;