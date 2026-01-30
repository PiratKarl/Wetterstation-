/* --- AURA V47.0 (AUTO-SLEEP & LOGIC) --- */

const CONFIG = {
    version: 47.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    sleepFrom: localStorage.getItem('aura_sleep_from') || '',
    sleepTo: localStorage.getItem('aura_sleep_to') || ''
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
    
    // Wachhalter
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) { bgVid.play().catch(e=>{}); }

    // Logo Logik
    initVideoFallback();

    // Inputs füllen
    document.getElementById('inp-city-val').value = CONFIG.city;
    document.getElementById('inp-time-from').value = CONFIG.sleepFrom;
    document.getElementById('inp-time-to').value = CONFIG.sleepTo;

    // Start
    runClock();
    loadData();
    checkStatus();

    // Timer
    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     
    setInterval(checkUpdate, 300000);  
    setInterval(checkStatus, 60000);   
}

/* --- LOGO SICHERHEIT --- */
function initVideoFallback() {
    let vid = document.getElementById('logo-video');
    let playPromise = vid.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => { vid.style.display = 'none'; });
    }
    setTimeout(() => {
        if(vid.paused || vid.readyState < 3) vid.style.display = 'none';
    }, 1500);
}

/* --- UHRZEIT & AUTO-SLEEP CHECK --- */
function runClock() {
    let now = new Date();
    let h = (now.getHours()<10?'0':'')+now.getHours();
    let m = (now.getMinutes()<10?'0':'')+now.getMinutes();
    let timeStr = h + ":" + m;
    
    document.getElementById('clock').innerText = timeStr;
    
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];

    // AUTO-SLEEP PRÜFUNG (Jede Minute genau einmal beim Wechsel)
    // Wir prüfen, ob die Sekunde 0 ist, um mehrfaches Triggern zu vermeiden, 
    // oder wir prüfen einfach Status. Hier: Einfacher Vergleich.
    if(now.getSeconds() === 0) {
        checkAutoSleep(timeStr);
    }
}

function checkAutoSleep(currentTime) {
    if(CONFIG.sleepFrom && currentTime === CONFIG.sleepFrom) {
        // Zeit zum Schlafen
        let ol = document.getElementById('sleep-overlay');
        if(ol.style.display !== 'block') {
            ol.style.display = 'block';
            closeMenu(); 
        }
    }
    if(CONFIG.sleepTo && currentTime === CONFIG.sleepTo) {
        // Zeit zum Aufwachen
        document.getElementById('sleep-overlay').style.display = 'none';
    }
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
        loadTicker(forecast);
    })
    .catch(e => {
        document.getElementById('ticker-text').innerHTML = '<span class="t-alert">+++ OFFLINE +++</span>';
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
    // Stunden
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

    // Tage
    let dailyMap = {};
    data.list.forEach(item => {
        let d = new Date(item.dt*1000);
        let dayKey = d.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        if(!dailyMap[dayKey]) dailyMap[dayKey] = { min: 100, max: -100, icon: item.weather[0].icon, pop: 0 };
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
                    <div class="temp-range">
                        <span class="temp-low">${Math.round(d.min)}°</span>
                        <span class="temp-sep">-</span>
                        <span class="temp-high">${Math.round(d.max)}°</span>
                    </div>
                  </div>`;
    });
    document.getElementById('daily-row').innerHTML = dHTML;
    document.getElementById('moon-phase').innerText = getMoonPhase(new Date());
}

async function loadTicker(localForecast) {
    let alertHTML = "";
    for(let i=0; i<3; i++) {
        let id = localForecast.list[i].weather[0].id;
        if(id >= 200 && id < 300) alertHTML = `<span class="t-alert">⚡ ACHTUNG: GEWITTER</span>`;
        else if(id >= 600 && id < 700) alertHTML = `<span class="t-alert">❄ ACHTUNG: SCHNEEFALL</span>`;
        else if(id === 502 || id === 503 || id === 504) alertHTML = `<span class="t-alert">🌧 STARKREGEN</span>`;
    }
    let tickerContent = alertHTML + `<span class="t-item">+++ AURA V${CONFIG.version} ONLINE +++</span>`;
    
    let requests = WORLD_CITIES.map(city => 
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${CONFIG.apiKey}&units=metric`)
        .then(r => r.json()).catch(e => null)
    );
    const results = await Promise.all(requests);
    results.forEach(data => {
        if(data && data.main) {
            let utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
            let cityTime = new Date(utc + (1000 * data.timezone));
            let timeStr = (cityTime.getHours()<10?'0':'')+cityTime.getHours() + ":" + (cityTime.getMinutes()<10?'0':'')+cityTime.getMinutes();
            tickerContent += `<div class="t-item">${data.name.toUpperCase()} <img src="${data.weather[0].icon}.gif" class="t-icon"> <span class="t-time">${timeStr}</span> ${Math.round(data.main.temp)}°</div>`;
        }
    });
    document.getElementById('ticker-text').innerHTML = tickerContent;
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

// NEU: Explizite Funktion für den Zurück-Button
function closeAccordion(id) {
    document.getElementById(id).style.display = 'none';
}

function saveSettings() {
    let city = document.getElementById('inp-city-val').value;
    let tFrom = document.getElementById('inp-time-from').value;
    let tTo = document.getElementById('inp-time-to').value;
    
    if(city) {
        localStorage.setItem('aura_city', city);
        CONFIG.city = city;
        loadData();
    }
    
    localStorage.setItem('aura_sleep_from', tFrom);
    CONFIG.sleepFrom = tFrom;
    
    localStorage.setItem('aura_sleep_to', tTo);
    CONFIG.sleepTo = tTo;
    
    closeMenu();
}