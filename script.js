/* --- AURA V56.0 (SMART GUARD & CLOUD DRIFT) --- */

const CONFIG = {
    version: 56.0,
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

// VARIABLEN FÜR BATTERY GUARD
let lastBatLevel = null;
let batDropCounter = 0;
let batteryCritical = false;

/* --- SYSTEM START --- */
function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    let el = document.documentElement;
    if(el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
    
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) { bgVid.play().catch(e=>{}); }

    initVideoFallback();

    document.getElementById('inp-city-val').value = CONFIG.city;
    document.getElementById('inp-time-from').value = CONFIG.sleepFrom;
    document.getElementById('inp-time-to').value = CONFIG.sleepTo;

    runClock();
    loadData();
    checkStatus(); // Initialer Batterie-Check (Anzeige)
    initBatteryGuard(); // Startet die Intelligenz

    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     
    setInterval(checkUpdate, 300000);  
    setInterval(checkStatus, 60000);   // Aktualisiert nur die Anzeige %
}

function initVideoFallback() {
    let vid = document.getElementById('logo-video');
    let playPromise = vid.play();
    if (playPromise !== undefined) { playPromise.catch(error => { vid.style.display = 'none'; }); }
    setTimeout(() => { if(vid.paused || vid.readyState < 3) vid.style.display = 'none'; }, 1500);
}

/* --- TIME & SLEEP --- */
function runClock() {
    let now = new Date();
    let h = (now.getHours()<10?'0':'')+now.getHours();
    let m = (now.getMinutes()<10?'0':'')+now.getMinutes();
    let timeStr = h + ":" + m;
    
    document.getElementById('clock').innerText = timeStr;
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];

    if(now.getSeconds() === 0) checkAutoSleep(timeStr);
}

function checkAutoSleep(currentTime) {
    if(CONFIG.sleepFrom && currentTime === CONFIG.sleepFrom) {
        let ol = document.getElementById('sleep-overlay');
        if(ol.style.display !== 'block') { ol.style.display = 'block'; closeMenu(); }
    }
    if(CONFIG.sleepTo && currentTime === CONFIG.sleepTo) {
        document.getElementById('sleep-overlay').style.display = 'none';
    }
}

/* --- SMART BATTERY GUARD --- */
function checkStatus() {
    let net = document.getElementById('net-status');
    if(navigator.onLine) { net.innerText = "WLAN: OK"; net.style.color = "#0f0"; }
    else { net.innerText = "OFFLINE"; net.style.color = "#f00"; }
    
    if(navigator.getBattery) {
        navigator.getBattery().then(bat => { 
            // Hier nur Anzeige aktualisieren, Logik läuft im Guard Interval
            let pfeil = "";
            let trendElem = document.getElementById('bat-trend-icon'); 
            // Wenn wir schon ein Trend-Element haben (wird unten erzeugt), nichts tun
            // Der Textinhalt wird aktualisiert:
            let levelText = "BAT: " + Math.round(bat.level*100) + "%";
            
            // Wir hängen den Pfeil visuell an, falls Trend bekannt
            let trendHTML = "";
            let diff = 0;
            if(lastBatLevel !== null) {
                diff = bat.level - lastBatLevel;
                if(diff > 0.005) trendHTML = '<span class="bat-trend-up">↑</span>';
                else if(diff < -0.005) trendHTML = '<span class="bat-trend-down">↓</span>';
                else trendHTML = '<span class="bat-trend-eq">=</span>';
            }
            
            document.getElementById('bat-level').innerHTML = levelText + trendHTML;
        });
    }
}

function initBatteryGuard() {
    // Initialer Wert setzen
    if(navigator.getBattery) {
        navigator.getBattery().then(bat => { lastBatLevel = bat.level; });
    }

    // Check alle 30 Minuten (1800000 ms)
    setInterval(() => {
        if(navigator.getBattery) {
            navigator.getBattery().then(bat => {
                let current = bat.level;
                
                if(lastBatLevel !== null) {
                    if(current < lastBatLevel) {
                        // Akku ist gefallen!
                        batDropCounter++;
                    } else if (current > lastBatLevel) {
                        // Akku steigt -> Alles gut, Reset
                        batDropCounter = 0;
                        batteryCritical = false;
                        loadTicker(globalForecastCache); // Ticker Warnung entfernen falls da
                    } else {
                        // Gleich -> Auch gut (Erhaltung)
                        // Counter nicht resetten, aber auch nicht erhöhen
                    }
                }

                // ALARM LOGIK (Nach 1 Stunde sinken)
                if(batDropCounter >= 2) {
                    batteryCritical = true;
                    // Ticker sofort neu laden um Warnung zu zeigen
                    if(globalForecastCache) loadTicker(globalForecastCache);
                }

                lastBatLevel = current;
                checkStatus(); // Anzeige aktualisieren
            });
        }
    }, 1800000); // 30 Min
}

/* --- WETTER ENGINE --- */
let globalForecastCache = null; // Für Ticker-Refresh ohne API Call

function loadData() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city}&appid=${CONFIG.apiKey}&units=metric&lang=de`)
    .then(r => r.json())
    .then(current => {
        renderCurrent(current);
        return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${current.coord.lat}&lon=${current.coord.lon}&appid=${CONFIG.apiKey}&units=metric&lang=de`);
    })
    .then(r => r.json())
    .then(forecast => {
        globalForecastCache = forecast;
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
    
    let temp = Math.round(data.main.temp);
    document.getElementById('main-temp').innerText = temp + "°";
    
    // PREMIUM ICON: true -> Animiert
    document.getElementById('main-icon').innerHTML = getVectorIcon(data.weather[0].icon, true);
    
    let rain = data.rain ? "Regen" : "0% Regen";
    document.getElementById('rain-prob').innerText = rain;
    
    let feels = Math.round(data.main.feels_like);
    let feelsHTML = "";
    if(feels < temp) feelsHTML = `Gefühlt: <span class="feels-cold">${feels}° ↓</span>`;
    else if (feels > temp) feelsHTML = `Gefühlt: <span class="feels-hot">${feels}° ↑</span>`;
    else feelsHTML = `Gefühlt: <span class="feels-same">${feels}°</span>`;
    
    document.getElementById('feels-like').innerHTML = feelsHTML;
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
                    <div class="f-icon">${getVectorIcon(item.weather[0].icon, false)}</div>
                    <span class="f-temp">${Math.round(item.main.temp)}°</span>
                  </div>`;
    }
    document.getElementById('hourly-row').innerHTML = hHTML;

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
    const dropSvg = '<svg class="f-drop-small" viewBox="0 0 24 24"><path d="M12 2.6c-3.4 5.8-8.5 11.5-8.5 16 0 4.6 3.8 8.4 8.5 8.4s8.5-3.8 8.5-8.4c0-4.5-5.1-10.2-8.5-16z"/></svg>';

    keys.forEach(key => {
        let d = dailyMap[key];
        dHTML += `<div class="f-item">
                    <span class="f-head">${key}</span>
                    <div class="f-icon">${getVectorIcon(d.icon, false)}</div>
                    <div class="f-rain-row">
                        ${dropSvg}
                        <span class="f-rain-text">${Math.round(d.pop*100)}%</span>
                    </div>
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
    if(!localForecast) return;
    
    // 1. Kritische Batterie Warnung?
    let batteryAlert = "";
    if(batteryCritical) {
        batteryAlert = `<span class="t-warn-crit">+++ ACHTUNG: KRITISCHE ENTLADUNG! NETZTEIL PRÜFEN +++</span>`;
    }

    // 2. Wetter Warnungen
    let weatherAlert = "";
    for(let i=0; i<3; i++) {
        let id = localForecast.list[i].weather[0].id;
        if(id >= 200 && id < 300) weatherAlert = `<span class="t-alert">⚡ GEWITTER</span>`;
        else if(id >= 600 && id < 700) weatherAlert = `<span class="t-alert">❄ SCHNEEFALL</span>`;
        else if(id === 502 || id === 503 || id === 504) weatherAlert = `<span class="t-alert">🌧 STARKREGEN</span>`;
    }
    
    let tickerContent = batteryAlert + weatherAlert + `<span class="t-item">+++ AURA V${CONFIG.version} ONLINE +++</span>`;
    
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
            // SIMPLE ICON: false -> Statisch im Ticker
            tickerContent += `<div class="t-item">${data.name.toUpperCase()} <div class="t-icon">${getVectorIcon(data.weather[0].icon, false)}</div> <span class="t-time">${timeStr}</span> ${Math.round(data.main.temp)}°</div>`;
        }
    });
    document.getElementById('ticker-text').innerHTML = tickerContent;
}

/* --- VECTOR ICON ENGINE (PREMIUM VS SIMPLE) --- */
function getVectorIcon(code, isPremium) {
    let icon = code.replace('n','d'); 
    let isNight = code.includes('n');
    let svgContent = "";
    let cssClass = isPremium ? "icon-premium" : "icon-simple";
    let sunFill = isPremium ? "url(#gradSun)" : "#00eaff";
    
    const cloudPath = '<path class="svg-cloud" d="M7,19 L17,19 C19.2,19 21,17.2 21,15 C21,12.8 19.2,11 17,11 L17,10 C17,6.7 14.3,4 11,4 C7.7,4 5,6.7 5,10 C2.8,10 1,11.8 1,14 C1,16.2 2.8,19 5,19 Z" />';
    const cloudDark = '<path class="svg-cloud-dark" d="M7,19 L17,19 C19.2,19 21,17.2 21,15 C21,12.8 19.2,11 17,11 L17,10 C17,6.7 14.3,4 11,4 C7.7,4 5,6.7 5,10 C2.8,10 1,11.8 1,14 C1,16.2 2.8,19 5,19 Z" />';
    const sunObj = `<circle class="svg-sun" cx="12" cy="12" r="5" style="fill:${sunFill}"/><g class="svg-sun"><line x1="12" y1="1" x2="12" y2="4" stroke="#00eaff" stroke-width="2"/><line x1="12" y1="20" x2="12" y2="23" stroke="#00eaff" stroke-width="2"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3" stroke="#00eaff" stroke-width="2"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8" stroke="#00eaff" stroke-width="2"/><line x1="1" y1="12" x2="4" y2="12" stroke="#00eaff" stroke-width="2"/><line x1="20" y1="12" x2="23" y2="12" stroke="#00eaff" stroke-width="2"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7" stroke="#00eaff" stroke-width="2"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2" stroke="#00eaff" stroke-width="2"/></g>`;
    const moonObj = '<path class="svg-moon" d="M12,3 C10,3 8,4 7,6 C10,6 13,9 13,12 C13,15 10,18 7,18 C8,20 10,21 12,21 C17,21 21,17 21,12 C21,7 17,3 12,3 Z" fill="#00eaff"/>';
    const rainObj = '<line class="svg-rain" x1="8" y1="18" x2="8" y2="22" /><line class="svg-rain" x1="12" y1="18" x2="12" y2="22" style="animation-delay:0.2s" /><line class="svg-rain" x1="16" y1="18" x2="16" y2="22" style="animation-delay:0.4s"/>';
    const snowObj = '<circle class="svg-snow" cx="8" cy="20" r="1.5"/><circle class="svg-snow" cx="16" cy="20" r="1.5" style="animation-delay:1s"/><circle class="svg-snow" cx="12" cy="22" r="1.5" style="animation-delay:0.5s"/>';
    const boltObj = '<polygon class="svg-bolt" points="10,15 13,15 12,19 16,13 13,13 14,9" fill="#ff3333"/>';
    const mistObj = '<line class="svg-mist" x1="4" y1="10" x2="20" y2="10" /><line class="svg-mist" x1="4" y1="14" x2="20" y2="14" style="animation-delay:1s"/><line class="svg-mist" x1="4" y1="18" x2="20" y2="18" style="animation-delay:2s"/>';

    // AUFBAU LOGIK: Hintergrund (Sonne/Mond) zuerst, dann Vordergrund (Wolken)
    // Damit die Wolken ÜBER der Sonne driften können.
    if(code === '01d') svgContent = sunObj; 
    else if(code === '01n') svgContent = moonObj; 
    else if(code === '02d' || code === '02n') svgContent = (isNight ? moonObj : sunObj) + cloudPath; 
    else if(code === '03d' || code === '03n' || code === '04d' || code === '04n') svgContent = cloudPath + cloudDark; 
    else if(code === '09d' || code === '09n' || code === '10d' || code === '10n') svgContent = cloudPath + rainObj; 
    else if(code === '11d' || code === '11n') svgContent = cloudDark + boltObj; 
    else if(code === '13d' || code === '13n') svgContent = cloudPath + snowObj; 
    else if(code === '50d' || code === '50n') svgContent = mistObj; 
    else svgContent = sunObj; 

    return `<svg class="svg-icon ${cssClass}" viewBox="0 0 24 24">${svgContent}</svg>`;
}

/* --- HELFER --- */
function toggleSleep() {
    let ol = document.getElementById('sleep-overlay');
    if(ol.style.display === 'block') ol.style.display = 'none';
    else { ol.style.display = 'block'; closeMenu(); }
}
function checkUpdate() {
    fetch("version.json?t=" + Date.now()).then(r=>r.json()).then(d=>{ if(d.version > CONFIG.version) location.reload(true); });
}
function formatTime(d) { return (d.getHours()<10?'0':'')+d.getHours() + ":" + (d.getMinutes()<10?'0':'')+d.getMinutes(); }
function getMoonPhase(date) {
    let year = date.getFullYear(); let month = date.getMonth() + 1; let day = date.getDate();
    if (month < 3) { year--; month += 12; }
    let c = 365.25 * year; let e = 30.6 * month; let jd = c + e + day - 694039.09;
    jd /= 29.5305882; let b = parseInt(jd); jd -= b; b = Math.round(jd * 8); if (b >= 8) b = 0;
    return ['🌑 Neumond', '🌒 Zunehmend', '🌓 Halbmond', '🌔 Zunehmend', '🌕 Vollmond', '🌖 Abnehmend', '🌗 Halbmond', '🌘 Abnehmend'][b];
}
function openMenu() { document.getElementById('menu-modal').style.display = 'block'; }
function closeMenu() { document.getElementById('menu-modal').style.display = 'none'; }
function toggleAccordion(id) {
    let content = document.getElementById(id);
    let isVisible = content.style.display === "block";
    document.querySelectorAll('.acc-content').forEach(el => el.style.display = 'none');
    if(!isVisible) content.style.display = "block";
}
function closeAccordion(id) { document.getElementById(id).style.display = 'none'; }
function saveSettings() {
    let city = document.getElementById('inp-city-val').value;
    let tFrom = document.getElementById('inp-time-from').value;
    let tTo = document.getElementById('inp-time-to').value;
    if(city) { localStorage.setItem('aura_city', city); CONFIG.city = city; loadData(); }
    localStorage.setItem('aura_sleep_from', tFrom); CONFIG.sleepFrom = tFrom;
    localStorage.setItem('aura_sleep_to', tTo); CONFIG.sleepTo = tTo;
    closeMenu();
}