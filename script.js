/* --- AURA V44.0 (FEATURE SCRIPT) --- */

const CONFIG = {
    version: 44.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig'
};

// 25 Weltstädte für den Ticker
const WORLD_CITIES = [
    "Berlin", "London", "New York", "Tokyo", "Sydney", 
    "Paris", "Moskau", "Beijing", "Dubai", "Los Angeles",
    "Rio de Janeiro", "Kapstadt", "Singapur", "Bangkok", "Mumbai",
    "Istanbul", "Rom", "Madrid", "Toronto", "Mexiko-Stadt",
    "Kairo", "Seoul", "Hong Kong", "Chicago", "Athen"
];

/* --- SYSTEM START --- */
function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    
    // Vollbild & Video Start
    let el = document.documentElement;
    if(el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
    
    let logoVid = document.getElementById('logo-video');
    if(logoVid) { logoVid.play().catch(e=>{}); }
    
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) { bgVid.play().catch(e=>{}); }

    // Initiale Daten
    runClock();
    loadData();
    checkStatus();

    // Intervalle
    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     // 10 Min Wetter Update
    setInterval(checkUpdate, 300000);  // 5 Min Update Check
    setInterval(checkStatus, 60000);   // 1 Min Status Check
}

/* --- UHRZEIT --- */
function runClock() {
    let now = new Date();
    document.getElementById('clock').innerText = 
        (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
    
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
}

/* --- HAUPT WETTER DATEN --- */
function loadData() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city}&appid=${CONFIG.apiKey}&units=metric&lang=de`)
    .then(r => r.json())
    .then(current => {
        renderCurrent(current);
        return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${current.coord.lat}&lon=${current.coord.lon}&appid=${CONFIG.apiKey}&units=metric&lang=de`);
    })
    .then(r => r.json())
    .then(forecast => {
        renderForecast(forecast);
        // Weltwetter erst laden, wenn lokales Wetter da ist (um API Stau zu vermeiden)
        loadWorldTicker();
    })
    .catch(e => {
        console.error(e);
        document.getElementById('ticker-text').innerHTML = '<span class="t-item" style="color:red">+++ OFFLINE: KEINE DATEN +++</span>';
    });
    
    // Update Zeitstempel setzen
    let now = new Date();
    let ts = (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
    document.getElementById('last-update').innerText = "Aktualisiert: " + ts;
}

function renderCurrent(data) {
    document.getElementById('location-header').innerText = data.name.toUpperCase();
    document.getElementById('main-temp').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('main-icon').src = data.weather[0].icon + ".gif";
    
    let rain = data.rain ? "Regen" : "0% Regen";
    document.getElementById('rain-prob').innerText = rain;
    
    document.getElementById('feels-like').innerText = "Gefühlt: " + Math.round(data.main.feels_like) + "°";
    document.getElementById('desc-text').innerText = data.weather[0].description.toUpperCase();

    // Astro
    let sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
    let ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
    document.getElementById('sunrise').innerText = formatTime(sr);
    document.getElementById('sunset').innerText = formatTime(ss);
}

function renderForecast(data) {
    // 1. Stunden (nächste 5) - Jetzt mit "Uhr"
    let hHTML = "";
    for(let i=0; i<5; i++) {
        let item = data.list[i];
        let h = new Date(item.dt*1000).getHours();
        hHTML += `<div class="f-item">
                    <span class="f-head">${h} Uhr</span>
                    <img src="${item.weather[0].icon}.gif" class="f-icon">
                    <span class="f-temp">${Math.round(item.main.temp)}°</span>
                  </div>`;
    }
    document.getElementById('hourly-row').innerHTML = hHTML;

    // 2. Tage (Min/Max Berechnung)
    let dailyMap = {};
    data.list.forEach(item => {
        let d = new Date(item.dt*1000);
        let dayKey = d.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        // Wir ignorieren den heutigen Tag für die Tagesvorhersage meistens, 
        // oder nehmen ihn dazu. Hier gruppieren wir einfach alles.
        if(!dailyMap[dayKey]) {
            dailyMap[dayKey] = { min: 100, max: -100, icon: item.weather[0].icon, pop: 0, count: 0 };
        }
        let dayData = dailyMap[dayKey];
        if(item.main.temp_min < dayData.min) dayData.min = item.main.temp_min;
        if(item.main.temp_max > dayData.max) dayData.max = item.main.temp_max;
        if(item.pop > dayData.pop) dayData.pop = item.pop;
        // Icon um 12 Uhr nehmen (simuliert)
        if(d.getHours() >= 11 && d.getHours() <= 14) dayData.icon = item.weather[0].icon;
        dayData.count++;
    });

    let dHTML = "";
    let keys = Object.keys(dailyMap).slice(0, 5); // Nimm erste 5 Tage
    keys.forEach(key => {
        let d = dailyMap[key];
        dHTML += `<div class="f-item">
                    <span class="f-head">${key}</span>
                    <div class="f-rain">${Math.round(d.pop*100)}%</div>
                    <img src="${d.icon}.gif" class="f-icon">
                    <span class="temp-low">${Math.round(d.min)}°</span>
                    <span class="temp-high">${Math.round(d.max)}°</span>
                  </div>`;
    });
    document.getElementById('daily-row').innerHTML = dHTML;
    
    // Mondphase update
    document.getElementById('moon-phase').innerText = getMoonPhase(new Date());
}

/* --- WELTWETTER TICKER --- */
async function loadWorldTicker() {
    let tickerHTML = `<span class="t-item">+++ AURA V${CONFIG.version} ONLINE +++</span>`;
    
    // Wir holen die Daten nacheinander (Promise.all wäre schneller, aber riskanter für API Limit)
    // Trick: Wir nutzen Promise.allSettled für 5er Gruppen oder einfach alle.
    // Bei 25 Städten: Achtung API Limit (60/min). Wir machen es langsam.
    
    let requests = WORLD_CITIES.map(city => 
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${CONFIG.apiKey}&units=metric`)
        .then(r => r.json())
        .catch(e => null)
    );

    const results = await Promise.all(requests);
    
    results.forEach(data => {
        if(data && data.main) {
            // Ortszeit berechnen
            let utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
            let cityTime = new Date(utc + (1000 * data.timezone));
            let timeStr = (cityTime.getHours()<10?'0':'')+cityTime.getHours() + ":" + (cityTime.getMinutes()<10?'0':'')+cityTime.getMinutes();
            
            tickerHTML += `<div class="t-item">
                            ${data.name.toUpperCase()} 
                            <img src="${data.weather[0].icon}.gif" class="t-icon">
                            <span class="t-time">${timeStr}</span> 
                            ${Math.round(data.main.temp)}°
                           </div>`;
        }
    });

    document.getElementById('ticker-text').innerHTML = tickerHTML;
}

/* --- FUNKTIONEN --- */
function toggleSleep() {
    let ol = document.getElementById('sleep-overlay');
    if(ol.style.display === 'block') {
        ol.style.display = 'none'; // Aufwachen
    } else {
        ol.style.display = 'block'; // Schlafen
        closeMenu();
    }
}

function checkStatus() {
    let net = document.getElementById('net-status');
    if(navigator.onLine) { net.innerText = "WLAN: OK"; net.style.color = "#0f0"; }
    else { net.innerText = "OFFLINE"; net.style.color = "#f00"; }
    
    if(navigator.getBattery) {
        navigator.getBattery().then(bat => {
            document.getElementById('bat-level').innerText = "BAT: " + Math.round(bat.level*100) + "%";
        });
    }
}

function checkUpdate() {
    fetch("version.json?t=" + Date.now()).then(r=>r.json()).then(d=>{
        if(d.version > CONFIG.version) location.reload(true);
    });
}

function formatTime(d) { return (d.getHours()<10?'0':'')+d.getHours() + ":" + (d.getMinutes()<10?'0':'')+d.getMinutes(); }

function getMoonPhase(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 3) { year--; month += 12; }
    let c = 365.25 * year;
    let e = 30.6 * month;
    let jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    let b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    if (b >= 8) b = 0;
    const phases = ['🌑 Neumond', '🌒 Zunehmend', '🌓 Halbmond', '🌔 Zunehmend', '🌕 Vollmond', '🌖 Abnehmend', '🌗 Halbmond', '🌘 Abnehmend'];
    return phases[b];
}

/* --- MENÜ --- */
function openMenu() { document.getElementById('menu-modal').style.display = 'block'; }
function closeMenu() { document.getElementById('menu-modal').style.display = 'none'; }

function toggleAccordion(id) {
    let content = document.getElementById(id);
    let isVisible = content.style.display === "block";
    document.querySelectorAll('.acc-content').forEach(el => el.style.display = 'none');
    if(!isVisible) content.style.display = "block";
}

function saveSettings() {
    let val = document.getElementById('inp-city-val').value;
    if(val) {
        localStorage.setItem('aura_city', val);
        CONFIG.city = val;
        loadData();
    }
    closeMenu();
}