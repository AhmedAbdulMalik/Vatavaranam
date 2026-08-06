import { useState, useEffect, useRef } from 'react';
import './App.css';

const API_KEY = import.meta.env.VITE_API_KEY;
const MAX_HISTORY = 5;

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(history));
  }, [history]);

  const saveToHistory = (cityName) => {
    setHistory((prev) => {
      const updated = [
        cityName,
        ...prev.filter((c) => c.toLowerCase() !== cityName.toLowerCase()),
      ];
      return updated.slice(0, MAX_HISTORY);
    });
  };

  const getWeatherByCity = async (cityName) => {
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast([]);

    try {
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          cityName
        )}&limit=1&appid=${API_KEY}`
      );

      if (!geoResponse.ok)
        throw new Error(`Geo API error! Status: ${geoResponse.status}`);

      const geoData = await geoResponse.json();

      if (geoData.length === 0)
        throw new Error(`No location found for "${cityName}"`);

      const { lat, lon, name, country } = geoData[0];

      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      if (!weatherResponse.ok)
        throw new Error(`Weather API error! Status: ${weatherResponse.status}`);

      const weatherData = await weatherResponse.json();

      setWeather({
        city: name,
        country,
        temp: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
      });

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      if (!forecastResponse.ok)
        throw new Error(`Forecast API error! Status: ${forecastResponse.status}`);

      const forecastData = await forecastResponse.json();

      const daily = forecastData.list.filter((entry) =>
        entry.dt_txt.includes('12:00:00')
      );

      setForecast(
        daily.map((entry) => ({
          date: new Date(entry.dt * 1000).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          temp: entry.main.temp,
          icon: entry.weather[0].icon,
          description: entry.weather[0].description,
        }))
      );

      saveToHistory(name);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && city.trim()) {
      getWeatherByCity(city);
    }
  };

  const handleHistoryClick = (cityName) => {
    setCity(cityName);
    getWeatherByCity(cityName);
  };

  return (
    <div
      className={darkMode ? 'app dark' : 'app'}
      onClick={() => inputRef.current?.focus()}
    >
      <button
        className="theme-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setDarkMode((prev) => !prev);
        }}
      >
        {darkMode ? '☀' : '☾'}
      </button>

      <div className="canvas">
        <input
          ref={inputRef}
          className="thought-input"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Where do you live?"
          autoFocus
        />

        {loading && <p className="status">loading…</p>}
        {error && <p className="status error">{error}</p>}

        {weather && (
          <div className="weather-block">
            <p className="w-location">
              {weather.city}, {weather.country}
            </p>

            <div className="w-main">
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
              />
              <span className="w-temp">
                {Math.round(weather.temp)}°
              </span>
            </div>

            <p className="w-desc">{weather.description}</p>

            <p className="w-details">
              humidity {weather.humidity}% · wind {weather.windSpeed} m/s
            </p>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="forecast">
            {forecast.map((day) => (
              <div key={day.date} className="forecast-day">
                <p className="f-date">{day.date}</p>

                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                  alt={day.description}
                />

                <p className="f-temp">
                  {Math.round(day.temp)}°
                </p>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="history">
            {history.map((h) => (
              <button
                key={h}
                className="history-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHistoryClick(h);
                }}
              >
                {h}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;