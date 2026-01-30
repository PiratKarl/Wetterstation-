/* --- AURA V43.0 (STABLE LOGIC) --- */

const CONFIG = {
    version: 43.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig'
};

/* --- SYSTEM START --- */
function startApp() {
    // 1. Overlay ausblenden
    document.getElementById('start-overlay').style.display = 'none';
    
    // 2. Vollbild (Sanft)
    let el = document.documentElement;
    if(el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
    
    // 3. Videos starten
    let logoVid = document.getElementById('logo-video');
    if(logoVid) { logoVid.play().catch(e=>{}); }
    
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) { bgVid.play().catch(e=>{}); }

    // 4. Daten laden
    runClock();
    loadData();

    // 5. Intervalle starten
    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     // 10 Min
    setInterval(checkUpdate, 300000);  // 5 Min
    setInterval(checkStatus, 60000);   // 1 Min
}

/* --- UHR & DATUM --- */
function runClock() {
    let now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    let timeStr = (h<10?'0':'')+h + ':' + (m<10?'0':'')+m;
    document.getElementById('clock').innerText = timeStr;
    
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    let dateStr = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
    document.getElementById('date').innerText = dateStr;
}

/* --- WETTER DATEN --- */
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
        updateTicker(forecast);
    })
    .catch(e => {
        document.getElementById('ticker-text').innerText = "+++ WETTERDIENST NICHT ERREICHBAR +++";
    });
}

function renderCurrent(data) {
    document.getElementById('location-header').innerText = data.name.toUpperCase();
    document.getElementById('main-temp').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('main-icon').src = data.weather[0].icon + ".gif";
    
    // Einfache Regenanzeige
    let rain = data.rain ? "Regen" : "0% Regen";
    document.getElementById('rain-prob').innerText = rain;
    
    document.getElementById('feels-like').innerText = "Gefühlt: " + Math.round(data.main.feels_like) + "°";
    document.getElementById('desc-text').innerText = data.weather[0].description.toUpperCase();

    // Astro-Daten
    let sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
    let ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
    document.getElementById('sunrise').innerText = formatTime(sr);
    document.getElementById('sunset').innerText = formatTime(ss);
}

function renderForecast(data) {
    // 1. Regenwahrscheinlichkeit (genauer aus Vorhersage)
    if(data.list[0].pop > 0) {
        document.getElementById('rain-prob').innerText = Math.round(data.list[0].pop * 100) + "% Regen";
    }

    // 2. Mondphase
    document.getElementById('moon-phase').innerText = getMoonPhase(new Date());

    // 3. Stunden-Ansicht (nächste 5 Einträge)
    let hHTML = "";
    for(let i=0; i<5; i++) {
        let item = data.list[i];
        let h = new Date(item.dt*1000).getHours();
        hHTML += `<div class="f-item"><span class="f-head">${h}h</span><img src="${item.weather[0].icon}.gif" class="f-icon"><span class="f-temp">${Math.round(item.main.temp)}°</span></div>`;
    }
    document.getElementById('hourly-row').innerHTML = hHTML;

    // 4. Tages-Ansicht (Mittags-Werte der nächsten Tage)
    let dHTML = "";
    let usedDays = [];
    let count = 0;
    data.list.forEach(item => {
        let d = new Date(item.dt*1000);
        let dayName = d.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        // Nimm Wetter um ca. 12:00-15:00 Uhr, nur einmal pro Tag
        if(!usedDays.includes(dayName) && d.getHours() >= 12 && count < 5) {
            usedDays.push(dayName);
            count++;
            dHTML += `<div class="f-item"><span class="f-head">${dayName}</span><img src="${item.weather[0].icon}.gif" class="f-icon"><span class="f-temp">${Math.round(item.main.temp)}°</span></div>`;
        }
    });
    document.getElementById('daily-row').innerHTML = dHTML;
}

/* --- TICKER --- */
function updateTicker(data) {
    let baseText = "+++ AURA V" + CONFIG.version + " ONLINE +++ ";
    let alertText = "";
    
    // Einfache Prüfung auf Schnee/Gewitter in der Zukunft
    for(let i=0; i<4; i++) {
        let id = data.list[i].weather[0].id;
        if(id >= 200 && id < 300) alertText = "ACHTUNG: GEWITTER MÖGLICH";
        if(id >= 600 && id < 700) alertText = "ACHTUNG: SCHNEEFALL MÖGLICH";
    }
    
    if(alertText !== "") {
        document.getElementById('ticker-text').innerText = "+++ " + alertText + " +++ " + baseText;
        document.getElementById('ticker-text').style.color = "#ff3333";
    } else {
        document.getElementById('ticker-text').innerText = baseText + CONFIG.city.toUpperCase() + " WETTER STABIL +++";
        document.getElementById('ticker-text').style.color = "#00eaff";
    }
}

/* --- HILFSFUNKTIONEN --- */
function checkStatus() {
    // WLAN Check
    let net = document.getElementById('net-status');
    if(navigator.onLine) { net.innerText = "WLAN: OK"; net.style.color = "#0f0"; }
    else { net.innerText = "OFFLINE"; net.style.color = "#f00"; }
    
    // Batterie Check
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

/* --- MENÜ STEUERUNG --- */
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