import { useState, useEffect, useMemo, memo, useRef } from 'react';
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

const CelestialOrbit = ({ angle, showSun, showMoon }) => (
  <div 
    className="celestial-orbit"
    style={{
      position: 'absolute',
      top: '50%', 
      left: '50%', 
      width: '100vmax', 
      height: '100vmax',
      transform: `translate(-50%, -20%) rotate(${angle}deg)`, 
      transition: 'transform 1s cubic-bezier(0.25, 0.1, 0.25, 1)', 
      pointerEvents: 'none',
      zIndex: 1,
    }}
  >
    {/* Sun Container - Top of Circle (0 deg) */}
    <div style={{ 
        position: 'absolute', 
        top: '0', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
    }}> 
       {showSun && (
          <div className="sun-container" style={{position: 'static', transform: `rotate(${-angle}deg)`}}> 
             <div className="sun"></div>
          </div>
       )}
    </div>

    {/* Moon Container - Bottom of Circle (180 deg) */}
    <div style={{ 
        position: 'absolute', 
        bottom: '0', 
        left: '50%', 
        transform: 'translate(-50%, 50%) rotate(180deg)' 
    }}> 
       {showMoon && (
          <div className="moon-container" style={{position: 'static', transform: `rotate(${-angle + 180}deg)`}}> 
             <div className="moon"></div>
          </div>
       )}
    </div>
  </div>
);

const WeatherEffects = memo(({ type, isNight, rotationAngle }) => {
  // Use passed rotationAngle for smooth transitions
  const showSun = type !== 'rainy' && type !== 'thunderstorm';
  const showMoon = true;

  return (
    <>
      <CelestialOrbit angle={rotationAngle} showSun={showSun} showMoon={showMoon} />
      
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

// --- TIMELINE SCRUBBER COMPONENT ---
const TimelineScrubber = ({ data, selectedIndex, onIndexChange, isLive }) => {
  const containerRef = useRef(null);
  const isUserScrolling = useRef(false);

  // Constants based on CSS (min-width: 25px, gap: 8px)
  const ITEM_WIDTH = 25; 
  const GAP = 8;
  const TOTAL_ITEM_WIDTH = ITEM_WIDTH + GAP;

  // Auto-scroll to center ONLY when we are in "Live" mode (reset) or initial load
  useEffect(() => {
    if (isLive && containerRef.current && selectedIndex >= 0 && !isUserScrolling.current) {
       scrollToIndex(selectedIndex);
    }
  }, [isLive, selectedIndex]);

  const scrollToIndex = (index) => {
      const container = containerRef.current;
      if (!container) return;

      const targetScroll = index * TOTAL_ITEM_WIDTH;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
  };

  const handleScroll = (e) => {
    isUserScrolling.current = true;
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    
    // Calculate which index is closest to the center
    let newIndex = Math.round(scrollLeft / TOTAL_ITEM_WIDTH);
    
    // Clamp index
    newIndex = Math.max(0, Math.min(newIndex, data.length - 1));

    if (newIndex !== selectedIndex) {
        onIndexChange(newIndex);
    }

    // Reset scrolling flag after a short delay
    clearTimeout(container.scrollTimeout);
    container.scrollTimeout = setTimeout(() => {
        isUserScrolling.current = false;
    }, 150); 
  };

  // Helper to determine which day label is active
  const getActiveDayLabel = () => {
      if (!data || !data[selectedIndex]) return 'Today';
      
      const selectedTime = new Date(data[selectedIndex].time);
      const now = new Date();
      
      // Normalize to midnight for comparison
      const selectedDate = new Date(selectedTime.getFullYear(), selectedTime.getMonth(), selectedTime.getDate());
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffTime = selectedDate - todayDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === -1) return 'Yesterday';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      return ''; 
  };

  const activeLabel = getActiveDayLabel();

  if (!data || data.length === 0) return null;

  return (
    <div className="timeline-scrubber-wrapper">
       <div className="timeline-labels">
          {['Yesterday', 'Today', 'Tomorrow'].map(label => (
              <span 
                key={label}
                className={label === activeLabel ? 'active-label' : ''}
                style={{
                    opacity: label === activeLabel ? 1 : 0.4,
                    fontWeight: label === activeLabel ? '800' : '400',
                    transform: label === activeLabel ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    textShadow: label === activeLabel ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
                }}
              >
                {label}
              </span>
          ))}
       </div>
       <div 
          className="timeline-container" 
          ref={containerRef}
          onScroll={handleScroll}
       >
          {data.map((hour, index) => {
             const date = new Date(hour.time);
             const hours = date.getHours();
             const ampm = hours >= 12 ? 'PM' : 'AM';
             const formattedTime = `${hours % 12 || 12} ${ampm}`;
             const isSelected = index === selectedIndex;
             
             // Golden Hour Logic
             let sunPhase = hour.is_day ? 'day' : 'night';
             const prev = data[index - 1];
             const next = data[index + 1];
             if (hour.is_day && prev && !prev.is_day) sunPhase = 'sunrise';
             else if (hour.is_day && next && !next.is_day) sunPhase = 'sunset';
             else if (!hour.is_day && prev && prev.is_day) sunPhase = 'twilight';

             return (
                <div 
                   key={index} 
                   className={`timeline-item ${isSelected ? 'selected' : ''}`}
                   onClick={() => scrollToIndex(index)} // Click to snap
                >
                   <div className={`bar ${sunPhase}`} style={{height: `${Math.min(50, Math.max(10, hour.temp + 20))}px`}}></div>
                   <span className="time-label">{hours % 3 === 0 ? formattedTime : '•'}</span>
                </div>
             );
          })}
       </div>
    </div>
  );
};




// --- DASHBOARD COMPONENT ---
const WeatherDashboard = ({ data, trend, isLive, onBackToLive, briefing }) => {
  if (!data) return null;

  return (
    <div className="weather-dashboard">
      <div className="dashboard-header">
        <h2 className="city-name">{data.city}</h2>
        <p className="condition-text">{data.condition}</p>
        {isLive && briefing && <p className="briefing-text">{briefing}</p>}
        {!isLive && <div className="time-indicator">Historical/Forecast View</div>}
      </div>
      
      <div className="main-stats">
        <div className="temp-display">
          <span className="temp-value">{Math.round(data.temp)}</span>
          <span className="temp-unit">°C</span>
        </div>
        {isLive && trend && <div className="trend-badge">{trend}</div>}
        
        {!isLive && (
           <button className="back-to-live-btn" onClick={onBackToLive}>
              Return to Now
           </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Feels Like</span>
          <span className="stat-value">{Math.round(data.feels_like)}°</span>
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
  const [loading, setLoading] = useState(false);
  
  // New State for Time-Traveler
  const [timelineData, setTimelineData] = useState([]);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1); 
  const [selectedIndex, setSelectedIndex] = useState(-1); 
  const [trend, setTrend] = useState('');
  const [briefing, setBriefing] = useState(''); // New Briefing State
  const [isLive, setIsLive] = useState(true);

  // Derived state for display
  const displayData = useMemo(() => {
     if (isLive && currentSnapshot) return currentSnapshot;
     if (!isLive && timelineData.length > 0 && selectedIndex >= 0) {
        const item = timelineData[selectedIndex];
        return {
           city: currentSnapshot?.city, 
           condition: item.condition,
           temp: item.temp,
           feels_like: item.feels_like,
           humidity: item.humidity,
           wind_speed: item.wind_speed,
           time_of_day: item.is_day === 1 ? 'DAY' : 'NIGHT',
           weather_code: item.weather_code
        };
     }
     return null;
  }, [isLive, currentSnapshot, timelineData, selectedIndex]);

  const weatherType = useMemo(() => {
     const data = displayData;
     if (!data) return { type: 'neutral', isNight: false };

     const lowerCondition = (data.condition || "").toLowerCase();
     const isNight = data.time_of_day === "NIGHT";
    
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
  }, [displayData]);
  
  // Calculate Rotation Angle based on linear timeline index
  const rotationAngle = useMemo(() => {
      let idx = selectedIndex;
      if (isLive && currentIndex === -1) {
          idx = 36; 
      } else if (isLive && currentIndex !== -1) {
          idx = currentIndex;
      }
      return (idx - 36) * 15;
  }, [selectedIndex, isLive, currentIndex]);


  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setTimelineData([]);
    setCurrentSnapshot(null);
    setSelectedIndex(-1);
    setBriefing(''); // Reset briefing
    
    try {
      const response = await axios.post('http://localhost:8000/chat', { message: input });
      
      const rawData = response.data.response;
      console.log("API Response:", rawData);

      if (rawData && rawData.current_snapshot) {
         setCurrentSnapshot(rawData.current_snapshot);
         setTimelineData(rawData.timeline_data || []);
         setTrend(rawData.trend);
         
         const nowIndex = rawData.current_index;
         setCurrentIndex(nowIndex);
         setSelectedIndex(nowIndex);
         setIsLive(true);

         // Fetch Briefing Async
         axios.post('http://localhost:8000/narrate', { weather_data: rawData })
            .then(res => setBriefing(res.data.briefing))
            .catch(err => console.error("Briefing error:", err));

      } else if (rawData && rawData.error) {
          alert(rawData.error);
      } else {
          console.warn("Unexpected response format:", rawData);
      }
      
      setInput(''); 
    } catch (error) {
      console.error("Error fetching response:", error);
      alert("Could not fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleScrub = (index) => {
     setSelectedIndex(index);
     setIsLive(index === currentIndex); 
  };

  const handleBackToNow = () => {
     setSelectedIndex(currentIndex);
     setIsLive(true);
  };

  return (
    <div className={`app-wrapper ${weatherType.type} ${weatherType.isNight ? 'night-mode' : ''}`}>
      <WeatherEffects 
          type={weatherType.type} 
          isNight={weatherType.isNight} 
          rotationAngle={rotationAngle}
      />
      
      <div className="app-container">
        {!displayData && !loading && (
           <div className="welcome-screen">
             <h1>Weather </h1>
             <p>Enter a city to see the timeline.</p>
           </div>
        )}

        {loading && <div className="loading-spinner">Checking weather...</div>}

        {displayData && !loading && (
          <>
            <WeatherDashboard 
               data={displayData} 
               trend={trend} 
               isLive={isLive}
               onBackToLive={handleBackToNow}
               briefing={briefing}
            />
            
            <TimelineScrubber 
               data={timelineData} 
               selectedIndex={selectedIndex} 
               onIndexChange={handleScrub}
               isLive={isLive}
            />
          </>
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