/* --- AURA V61.0 (PERFECT CENTER ENGINE) --- */

const CONFIG = {
    version: 61.0,
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

// VARIABLEN
let lastBatLevel = null;
let batDropCounter = 0;
let batteryCritical = false;
let lastPressure = parseFloat(localStorage.getItem('aura_last_press')) || 0;
let globalForecastCache = null; 

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
    checkStatus(); 
    initBatteryGuard(); 

    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     // 10 Min Update
    setInterval(checkUpdate, 300000);  // 5 Min Version Check
    setInterval(checkStatus, 60000);   // 1 Min Akku Check
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
            let levelText = "BAT: " + Math.round(bat.level*100) + "%";
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
    if(navigator.getBattery) {
        navigator.getBattery().then(bat => { lastBatLevel = bat.level; });
    }
    setInterval(() => {
        if(navigator.getBattery) {
            navigator.getBattery().then(bat => {
                let current = bat.level;
                if(lastBatLevel !== null) {
                    if(current < lastBatLevel) batDropCounter++;
                    else if (current > lastBatLevel) {
                        batDropCounter = 0;
                        batteryCritical = false;
                        loadTicker(globalForecastCache); 
                    }
                }
                if(batDropCounter >= 2) {
                    batteryCritical = true;
                    if(globalForecastCache) loadTicker(globalForecastCache);
                }
                lastBatLevel = current;
                checkStatus();
            });
        }
    }, 1800000); 
}

/* --- WETTER ENGINE --- */
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
    
    // ICON ENGINE (V61)
    document.getElementById('main-icon').innerHTML = getVectorIcon(data.weather[0].icon, true);
    
    // REGEN (V61 Logik für Mitte)
    let rainProb = "0%";
    if(globalForecastCache && globalForecastCache.list && globalForecastCache.list[0]) {
       rainProb = Math.round(globalForecastCache.list[0].pop * 100) + "%";
    } else if (data.rain) {
       rainProb = "Regen";
    }
    document.getElementById('rain-val').innerText = rainProb;
    
    // COCKPIT DATEN (Jetzt im Side-Stack)
    // 1. Gefühlt
    let feels = Math.round(data.main.feels_like);
    document.getElementById('val-feels').innerText = feels + "°";

    // 2. Wind
    let speed = Math.round(data.wind.speed * 3.6);
    let deg = data.wind.deg;
    let dirs = ['N','NO','O','SO','S','SW','W','NW'];
    let dirStr = dirs[Math.round(deg/45)%8];
    document.getElementById('val-wind').innerHTML = `${speed} <span class="info-unit">km/h</span> <span style="font-size:0.5em; color:#00eaff">${dirStr}</span>`;
    
    // Wind Pfeil Rotation (SVG im Side-Stack)
    document.getElementById('icon-wind').style.transform = `rotate(${deg}deg)`;

    // 3. Druck (mit Tendenz)
    let press = data.main.pressure;
    let pressTrend = "→";
    let pressColor = "#fff";
    if(lastPressure > 0) {
        if(press > lastPressure) { pressTrend = "↗"; pressColor = "#00eaff"; }
        else if(press < lastPressure) { pressTrend = "↘"; pressColor = "#ff3333"; }
    }
    if(press !== lastPressure) {
        localStorage.setItem('aura_last_press', press);
        lastPressure = press;
    }
    document.getElementById('val-press').innerHTML = `${press} <span class="info-unit">hPa</span> <span style="color:${pressColor}; font-size:0.8em; margin-left:5px;">${pressTrend}</span>`;

    // 4. Sicht
    let vis = (data.visibility / 1000).toFixed(1);
    if(vis > 30) vis = ">10"; 
    document.getElementById('val-vis').innerHTML = `${vis} <span class="info-unit">km</span>`;

    // Astro
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
    
    let batteryAlert = "";
    if(batteryCritical) {
        batteryAlert = `<span class="t-warn-crit">+++ ACHTUNG: KRITISCHE ENTLADUNG! NETZTEIL PRÜFEN +++</span>`;
    }

    let dwdAlert = "";
    let now = new Date();
    let validUntil = new Date(localForecast.list[1].dt * 1000); 
    let validUntilStr = (validUntil.getHours()<10?'0':'')+validUntil.getHours() + ":" + (validUntil.getMinutes()<10?'0':'')+validUntil.getMinutes();
    let validFromStr = (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();

    let weatherId = localForecast.list[0].weather[0].id; 
    let warningText = "";
    let severityClass = "";

    if(weatherId >= 200 && weatherId < 300) { warningText = "GEWITTER / STURMBÖEN"; severityClass = "dwd-warn-red"; }
    else if(weatherId >= 600 && weatherId < 700) { warningText = "SCHNEEFALL / GLÄTTE"; severityClass = "dwd-warn-red"; }
    else if(weatherId === 502 || weatherId === 503 || weatherId === 504) { warningText = "STARKREGEN"; severityClass = "dwd-warn-red"; }
    else if(weatherId >= 500 && weatherId < 600) { warningText = "REGEN"; severityClass = "dwd-warn-yellow"; }
    else if(weatherId >= 300 && weatherId < 400) { warningText = "SPRÜHREGEN"; severityClass = "dwd-warn-yellow"; }
    else if(weatherId === 741) { warningText = "NEBEL (SICHT < 150M)"; severityClass = "dwd-warn-yellow"; }

    if(warningText !== "") {
        dwdAlert = `<span class="${severityClass}">
            Der Deutsche Wetterdienst "DWD" gibt folgende Unwetterwarnung raus: ${warningText}. 
            Gültig von ${validFromStr} Uhr bis voraussichtlich ${validUntilStr} Uhr.
        </span>`;
    }

    let tickerContent = batteryAlert + dwdAlert + `<span class="t-item">+++ AURA V${CONFIG.version} PERFECT CENTER +++</span>`;
    
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
            tickerContent += `<div class="t-item">${data.name.toUpperCase()} <div class="t-icon">${getVectorIcon(data.weather[0].icon, false)}</div> <span class="t-time">${timeStr}</span> ${Math.round(data.main.temp)}°</div>`;
        }
    });
    document.getElementById('ticker-text').innerHTML = tickerContent;
}

function getVectorIcon(code, isPremium) {
    let icon = code.replace('n','d'); 
    let isNight = code.includes('n');
    let svgContent = "";
    let cssClass = isPremium ? "icon-premium" : "icon-simple";
    
    let sunFill = isPremium ? "url(#gradSun)" : "#00eaff";
    let cloudFill = isPremium ? "url(#gradCloud)" : "#fff";
    let moonFill = isPremium ? "url(#gradMoon)" : "#00eaff";

    const cloudPath = `<path class="svg-cloud" d="M7,19 L17,19 C19.2,19 21,17.2 21,15 C21,12.8 19.2,11 17,11 L17,10 C17,6.7 14.3,4 11,4 C7.7,4 5,6.7 5,10 C2.8,10 1,11.8 1,14 C1,16.2 2.8,19 5,19 Z" fill="${cloudFill}" />`;
    const cloudDark = '<path class="svg-cloud-dark" d="M7,19 L17,19 C19.2,19 21,17.2 21,15 C21,12.8 19.2,11 17,11 L17,10 C17,6.7 14.3,4 11,4 C7.7,4 5,6.7 5,10 C2.8,10 1,11.8 1,14 C1,16.2 2.8,19 5,19 Z" />';
    
    const sunObj = `<circle class="svg-sun" cx="12" cy="12" r="5" style="fill:${sunFill}"/><g class="svg-sun" style="stroke:${isPremium ? '#ff9900':'#00eaff'}; stroke-width:2"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g>`;
    
    const moonObj = `<path class="svg-moon" d="M12,3 C10,3 8,4 7,6 C10,6 13,9 13,12 C13,15 10,18 7,18 C8,20 10,21 12,21 C17,21 21,17 21,12 C21,7 17,3 12,3 Z" fill="${moonFill}"/>`;
    
    const rainObj = '<line class="svg-rain" x1="8" y1="18" x2="8" y2="22" /><line class="svg-rain" x1="12" y1="18" x2="12" y2="22" style="animation-delay:0.2s" /><line class="svg-rain" x1="16" y1="18" x2="16" y2="22" style="animation-delay:0.4s"/>';
    const snowObj = '<circle class="svg-snow" cx="8" cy="20" r="1.5"/><circle class="svg-snow" cx="16" cy="20" r="1.5" style="animation-delay:1s"/><circle class="svg-snow" cx="12" cy="22" r="1.5" style="animation-delay:0.5s"/>';
    const boltObj = '<polygon class="svg-bolt" points="10,15 13,15 12,19 16,13 13,13 14,9" fill="#ff3333"/>';
    const mistObj = '<line class="svg-mist" x1="4" y1="10" x2="20" y2="10" /><line class="svg-mist" x1="4" y1="14" x2="20" y2="14" style="animation-delay:1s"/><line class="svg-mist" x1="4" y1="18" x2="20" y2="18" style="animation-delay:2s"/>';

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