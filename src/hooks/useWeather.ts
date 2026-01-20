import { useState, useEffect } from 'react';

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  location: string;
}

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️',
  sunny: '☀️',
  'partly cloudy': '⛅',
  cloudy: '☁️',
  overcast: '☁️',
  rain: '🌧️',
  drizzle: '🌦️',
  thunderstorm: '⛈️',
  snow: '❄️',
  mist: '🌫️',
  fog: '🌫️',
  default: '🌤️',
};

function getWeatherIcon(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (lowerCondition.includes(key)) return icon;
  }
  return WEATHER_ICONS.default;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWeather() {
      try {
        // First, get user's location via IP (non-blocking, no permission needed)
        const geoResponse = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(5000),
        });
        
        if (!geoResponse.ok) throw new Error('Geo lookup failed');
        
        const geoData = await geoResponse.json();
        const { city, latitude, longitude } = geoData;

        if (!latitude || !longitude) throw new Error('No location data');

        // Fetch weather from Open-Meteo (free, no API key needed)
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (!weatherResponse.ok) throw new Error('Weather fetch failed');

        const weatherData = await weatherResponse.json();
        
        // Map weather codes to conditions
        const weatherCode = weatherData.current?.weather_code ?? 0;
        const condition = mapWeatherCode(weatherCode);

        if (mounted) {
          setWeather({
            temp: Math.round(weatherData.current?.temperature_2m ?? 70),
            condition,
            icon: getWeatherIcon(condition),
            location: city || 'your area',
          });
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Weather unavailable');
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      mounted = false;
    };
  }, []);

  return { weather, loading, error };
}

// Map Open-Meteo weather codes to conditions
function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}
