const API_KEY = '518e81d874739701f08842c1a55f6588';
let currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';

const iconMap = {
    "01d": "fa-sun", "01n": "fa-moon", "02d": "fa-cloud-sun", "02n": "fa-cloud-moon",
    "03d": "fa-cloud", "03n": "fa-cloud", "04d": "fa-smog", "09d": "fa-cloud-showers-heavy",
    "10d": "fa-cloud-rain", "11d": "fa-bolt", "13d": "fa-snowflake", "50d": "fa-align-justify"
};

function updateClock() {
    const now = new Date();
    // Sekunden wurden hier entfernt
    document.getElementById('clock').innerText = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

function getMoonPhase() {
    const lp = 2551443; 
    const now = new Date();
    const new_moon = new Date(1970, 0, 7, 20, 35, 0);
    const phase = ((now.getTime() - new_moon.getTime()) / 1000) % lp;
    const day = Math.floor(phase / (24 * 3600)) + 1;
    if (day <= 2) return { name: "Neumond", icon: "fa-circle-notch" };
    if (day <= 14) return { name: "Zunehmend", icon: "fa-moon" };
    if (day <= 16) return { name: "Vollmond", icon: "fa-circle" };
    return { name: "Abnehmend", icon: "fa-moon" };
}

function formatTime(ts, offset) {
    const d = new Date((ts + offset) * 1000);
    return d.getUTCHours().toString().padStart(2, '0') + ":" + d.getUTCMinutes().toString().padStart(2, '0');
}

async function fetchWeather() {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${currentCity}&appid=${API_KEY}&units=metric&lang=de`);
        const data = await res.json();
        
        if (data.cod !== 200) {
            console.error("Stadt nicht gefunden");
            return;
        }

        // Hauptanzeigen
        document.getElementById('city-title').innerText = data.name.toUpperCase();
        document.getElementById('temp-display').innerText = Math.round(data.main.temp);
        document.getElementById('weather-desc').innerText = data.weather[0].description;
        document.getElementById('main-icon').className = "fa " + (iconMap[data.weather[0].icon] || "fa-cloud");
        
        const sunrise = formatTime(data.sys.sunrise, data.timezone);
        const sunset = formatTime(data.sys.sunset, data.timezone);
        document.getElementById('sun-status').innerText = sunrise + " / " + sunset;
        
        const moon = getMoonPhase();
        document.getElementById('moon-name').innerText = moon.name;
        document.getElementById('moon-img').className = "fa " + moon.icon;

        // DER INFO-TICKER (Alle verfügbaren Daten)
        const windKmH = Math.round(data.wind.speed * 3.6);
        const feelsLike = Math.round(data.main.feels_like);
        const visibility = (data.visibility / 1000).toFixed(1);
        
        const tickerData = [
            `GEFÜHLTE TEMPERATUR: ${feelsLike}°C`,
            `LUFTFEUCHTIGKEIT: ${data.main.humidity}%`,
            `WINDGESCHWINDIGKEIT: ${windKmH} km/h`,
            `LUFTDRUCK: ${data.main.pressure} hPa`,
            `BEWÖLKUNG: ${data.clouds.all}%`,
            `SICHTWEITE: ${visibility} km`,
            `KOORDINATEN: ${data.coord.lat}, ${data.coord.lon}`,
            `STANDORT: ${data.name}, ${data.sys.country}`
        ];
        document.getElementById('info-ticker').innerText = " +++ " + tickerData.join(" +++ ") + " +++ ";

        // Vorhersage
        const resF = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${currentCity}&appid=${API_KEY}&units=metric&lang=de`);
        const dataF = await resF.json();

        // Hourly
        const hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(let i=0; i<6; i++) {
            const it = dataF.list[i];
            hList.innerHTML += `<div class="f-item"><span>${new Date(it.dt*1000).getHours()}:00</span><i class="fa ${iconMap[it.weather[0].icon]||"fa-cloud"} f-icon"></i><span class="f-temp">${Math.round(it.main.temp)}°</span></div>`;
        }

        // Daily
        const dList = document.getElementById('daily-list'); dList.innerHTML = "";
        const uniqueDays = {};
        dataF.list.forEach(it => {
            const d = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!uniqueDays[d]) uniqueDays[d] = { t: it.main.temp, ic: it.weather[0].icon };
        });
        Object.keys(uniqueDays).slice(1,6).forEach(d => {
            dList.innerHTML += `<div class="f-item"><span style="color:#00ffcc">${d}</span><i class="fa ${iconMap[uniqueDays[d].ic]||"fa-cloud"} f-icon"></i><span class="f-temp">${Math.round(uniqueDays[d].t)}°</span></div>`;
        });

    } catch (e) { console.log(e); }
}

// STABILER STANDORTWECHSEL
function toggleSettings() {
    const s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display === 'flex') ? 'none' : 'flex';
}

document.getElementById('save-btn').addEventListener('click', function() {
    const input = document.getElementById('city-input');
    if (input.value.trim() !== "") {
        currentCity = input.value.trim();
        localStorage.setItem('selectedCity', currentCity);
        fetchWeather(); // Sofort aktualisieren
        toggleSettings();
        input.value = "";
    }
});

async function getBattery() {
    if ('getBattery' in navigator) {
        const b = await navigator.getBattery();
        const up = () => {
            document.getElementById('bat-level').innerText = Math.round(b.level * 100) + "%";
            document.getElementById('bat-icon').className = b.charging ? "fa fa-bolt" : "fa fa-plug";
            document.getElementById('bat-icon').style.color = b.charging ? "#00ffcc" : "#444";
        };
        b.addEventListener('chargingchange', up); 
        b.addEventListener('levelchange', up);
        up();
    }
}

setInterval(updateClock, 1000);
setInterval(fetchWeather, 1800000); // 30 Min
updateClock(); fetchWeather(); getBattery();
if ('wakeLock' in navigator) navigator.wakeLock.request('screen');