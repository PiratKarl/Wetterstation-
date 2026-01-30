/* --- AURA V45.0 (VIDEO FIX & LOGIC) --- */

const CONFIG = {
    version: 45.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig'
};

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
    
    // Vollbild
    let el = document.documentElement;
    if(el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
    
    // WACHHALTER Video (Hintergrund)
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) { bgVid.play().catch(e=>{}); }

    // LOGO VIDEO FIX (Versucht Play, sonst Fallback Bild)
    initVideoFallback();

    // Daten laden
    runClock();
    loadData();
    checkStatus();

    // Intervalle
    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     
    setInterval(checkUpdate, 300000);  
    setInterval(checkStatus, 60000);   
}

/* --- VIDEO FALLBACK LOGIK --- */
function initVideoFallback() {
    let vid = document.getElementById('logo-video');
    let img = document.getElementById('logo-fallback');
    
    if(!vid) return;

    // Versuche zu spielen
    let playPromise = vid.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Autoplay hat geklappt!
            // Video läuft, Bild bleibt versteckt.
        })
        .catch(error => {
            // Autoplay wurde blockiert oder Fehler
            console.log("Video Autoplay blockiert, zeige Bild.");
            vid.style.display = 'none';
            img.style.display = 'block';
        });
    } else {
        // Ältere Browser ohne Promise Rückgabe
        // Wir prüfen einfach nach 1 Sekunde ob es läuft
        setTimeout(() => {
            if(vid.paused) {
                vid.style.display = 'none';
                img.style.display = 'block';
            }
        }, 1000);
    }
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

/* --- WETTER --- */
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
        loadWorldTicker();
    })
    .catch(e => {
        document.getElementById('ticker-text').innerHTML = '<span class="t-item" style="color:red">+++ OFFLINE +++</span>';
    });
    
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

    let sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
    let ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
    document.getElementById('sunrise').innerText = formatTime(sr);
    document.getElementById('sunset').innerText = formatTime(ss);
}

function renderForecast(data) {
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

    let dailyMap = {};
    data.list.forEach(item => {
        let d = new Date(item.dt*1000);
        let dayKey = d.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        if(!dailyMap[dayKey]) {
            dailyMap[dayKey] = { min: 100, max: -100, icon: item.weather[0].icon, pop: 0 };
        }
        let dayData = dailyMap[dayKey];
        if(item.main.temp_min < dayData.min) dayData.min = item.main.temp_min;
        if(item.main.temp_max > dayData.max) dayData.max = item.main.temp_max;
        if(item.pop > dayData.pop) dayData.pop = item.pop;
        if(d.getHours() >= 11 && d.getHours() <= 14) dayData.icon = item.weather[0].icon;
    });

    let dHTML = "";
    let keys = Object.keys(dailyMap).slice(0, 5); 
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
    document.getElementById('moon-phase').innerText = getMoonPhase(new Date());
}

/* --- WELTWETTER --- */
async function loadWorldTicker() {
    let tickerHTML = `<span class="t-item">+++ AURA V${CONFIG.version} ONLINE +++</span>`;
    let requests = WORLD_CITIES.map(city => 
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${CONFIG.apiKey}&units=metric`)
        .then(r => r.json())
        .catch(e => null)
    );
    const results = await Promise.all(requests);
    results.forEach(data => {
        if(data && data.main) {
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

/* --- HELFER --- */
function toggleSleep() {
    let ol = document.getElementById('sleep-overlay');
    if(ol.style.display === 'block') ol.style.display = 'none';
    else { ol.style.display = 'block'; closeMenu(); }
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