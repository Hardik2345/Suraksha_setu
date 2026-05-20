const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

const WEATHER_SUMMARIES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

function neutralWeatherContext() {
  return {
    provider: 'open-meteo',
    summary: 'Weather unavailable',
    fetchedAt: new Date(),
  };
}

async function fetchWeatherContext({ lat, lng }) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,precipitation,wind_speed_10m,weather_code',
    timezone: 'auto',
  });

  try {
    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);
    if (!response.ok) {
      return neutralWeatherContext();
    }

    const payload = await response.json();
    const current = payload.current;
    if (!current) {
      return neutralWeatherContext();
    }

    return {
      provider: 'open-meteo',
      summary: WEATHER_SUMMARIES[current.weather_code] || 'Current conditions captured',
      temperatureC: current.temperature_2m,
      windSpeedKph: current.wind_speed_10m,
      precipitationMm: current.precipitation,
      weatherCode: current.weather_code,
      fetchedAt: new Date(),
    };
  } catch (_error) {
    return neutralWeatherContext();
  }
}

module.exports = {
  fetchWeatherContext,
  neutralWeatherContext,
};
