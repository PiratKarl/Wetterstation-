const API_KEY = '518e81d874739701f08842c1a55f6588';
// Falls kein Standort gespeichert, nutze Braunschweig als Standard
let currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';

const iconMap = {
    "01d": "fa-sun", "01n": "fa-moon", "02d": "fa-cloud-sun", "02n": "fa-cloud-moon",
    "03d": "fa-cloud", "04d": "fa-smog", "09d": "fa-cloud-showers-heavy",
    "10d": "fa-cloud-rain", "11d": "fa-bolt", "13d": "fa-snowflake", "50d": "fa-align-justify"
};

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatTime(ts, offset) {
    const d = new Date((ts + offset) * 1000);
    return d.getUTCHours().toString().padStart(2, '0') + ":" + d.getUTCMinutes().toString().padStart(2, '0');
}

async function fetchWeather() {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(currentCity)}&appid=${API_KEY}&units=metric&lang=de&_=${Date.now()}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.cod === 200) {
            document.getElementById('city-title').innerText = data.name.toUpperCase();
            document.getElementById('temp-display').innerText = Math.round(data.main.temp);
            document.getElementById('weather-desc').innerText = data.weather[0].description;
            document.getElementById('main-icon').className = "fa " + (iconMap[data.weather[0].icon] || "fa-cloud");
            
            document.getElementById('sunrise-val').innerText = formatTime(data.sys.sunrise, data.timezone);
            document.getElementById('sunset-val').innerText = formatTime(data.sys.sunset, data.timezone);

            // Ticker befüllen
            const tickerText = [
                `GEFÜHLT: ${Math.round(data.main.feels_like)}°C`,
                `WIND: ${Math.round(data.wind.speed * 3.6)} KM/H`,
                `FEUCHTE: ${data.main.humidity}%`,
                `DRUCK: ${data.main.pressure} HPA`,
                `WOLKEN: ${data.clouds.all}%`
            ];
            document.getElementById('info-ticker').innerText = " +++ " + tickerText.join(" +++ ") + " +++ ";
        }

        const resF = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(currentCity)}&appid=${API_KEY}&units=metric&lang=de`);
        const dataF = await resF.json();

        // Stunden
        const hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(let i=0; i<6; i++) {
            const it = dataF.list[i];
            hList.innerHTML += `<div class="f-item"><span class="f-time">${new Date(it.dt*1000).getHours()}:00</span><i class="fa ${iconMap[it.weather[0].icon]} f-icon"></i><span class="f-temp">${Math.round(it.main.temp)}°</span></div>`;
        }

        // Tage
        const dList = document.getElementById('daily-list'); dList.innerHTML = "";
        const days = {};
        dataF.list.forEach(it => {
            const d = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!days[d]) days[d] = { t: it.main.temp, ic: it.weather[0].icon };
        });
        Object.keys(days).slice(1,6).forEach(d => {
            dList.innerHTML += `<div class="f-item"><span class="f-time" style="color:#00ffcc">${d}</span><i class="fa ${iconMap[days[d].ic]} f-icon"></i><span class="f-temp">${Math.round(days[d].t)}°</span></div>`;
        });
    } catch (e) { console.log("Netzwerkfehler"); }
}

function toggleSettings() {
    const s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display === 'flex') ? 'none' : 'flex';
}

function saveCity() {
    const val = document.getElementById('city-input').value.trim();
    if(val) {
        localStorage.setItem('selectedCity', val);
        // Brutaler Neustart der Seite - löst alle Cache- und Speicherprobleme
        window.location.href = window.location.pathname + "?city=" + encodeURIComponent(val);
    }
}

// Intervall: 15 Minuten
setInterval(updateClock, 1000);
setInterval(fetchWeather, 900000);
updateClock(); fetchWeather();
if ('wakeLock' in navigator) navigator.wakeLock.request('screen');