/* --- AURA V43.0 (RESTORED STABLE LOGIC) --- */

const CONFIG = {
    version: 43.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig'
};

/* --- SYSTEM START --- */
function startApp() {
    // 1. Overlay entfernen
    document.getElementById('start-overlay').style.display = 'none';
    
    // 2. Vollbild versuchen (Sanft, ohne Zwang)
    let el = document.documentElement;
    if(el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
    
    // 3. Videos starten (Wichtig für Logo)
    let logoVid = document.getElementById('logo-video');
    if(logoVid) { logoVid.play().catch(e=>{}); }
    
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) { bgVid.play().catch(e=>{}); }

    // 4. Daten laden
    runClock();
    loadData();

    // 5. Intervalle setzen
    setInterval(runClock, 1000);       // Uhr jede Sekunde
    setInterval(loadData, 600000);     // Wetter alle 10 Min
    setInterval(checkUpdate, 300000);  // Updates alle 5 Min
    setInterval(checkStatus, 60000);   // Status jede Minute
}

/* --- UHRZEIT --- */
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
        updateTicker(forecast); // Robuster Ticker
    })
    .catch(e => {
        document.getElementById('ticker-text').innerText = "+++ WETTERDIENST NICHT ERREICHBAR +++";
    });
    
    // Update-Zeitstempel
    let now = new Date();
    let timeStr = (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
    // (Optionaler Log, falls benötigt)
}

function renderCurrent(data) {
    document.getElementById('location-header').innerText = data.name.toUpperCase();
    document.getElementById('main-temp').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('main-icon').src = data.weather[0].icon + ".gif";
    
    // Regenwahrscheinlichkeit (Fallback, da Current API das oft nicht hat, sonst 0)
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
    // Regen-Wahrscheinlichkeit aus Vorhersage ziehen (genauer)
    let pop = Math.round(data.list[0].pop * 100);
    document.getElementById('rain-prob').innerText = pop + "% Regen";
    
    // Mondphase berechnen
    document.getElementById('moon-phase').innerText = getMoonPhase(new Date());

    // Stunden-Ansicht
    let hHTML = "";
    for(let i=0; i<5; i++) {
        let item = data.list[i];
        let h = new Date(item.dt*1000).getHours();
        hHTML += `<div class="f-item"><span class="f-head">${h}h</span><img src="${item.weather[0].icon}.gif" class="f-icon"><span class="f-temp">${Math.round(item.main.temp)}°</span></div>`;
    }
    document.getElementById('hourly-row').innerHTML = hHTML;

    // Tages-Ansicht
    let dHTML = "";
    let usedDays = [];
    let count = 0;
    data.list.forEach(item => {
        let d = new Date(item.dt*1000);
        let dayName = d.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        if(!usedDays.includes(dayName) && d.getHours() >= 12 && count < 5) {
            usedDays.push(dayName);
            count++;
            dHTML += `<div class="f-item"><span class="f-head">${dayName}</span><img src="${item.weather[0].icon}.gif" class="f-icon"><span class="f-temp">${Math.round(item.main.temp)}°</span></div>`;
        }
    });
    document.getElementById('daily-row').innerHTML = dHTML;
}

/* --- TICKER (Stabilisiert) --- */
function updateTicker(data) {
    // Zeigt einfach nur Systemstatus und eine Vorhersage-Warnung an, keine externen Abfragen die blockieren könnten
    let text = "+++ AURA V" + CONFIG.version + " ONLINE +++ ";
    
    // Prüfen auf Regen/Schnee in den nächsten Stunden
    let alertText = "";
    for(let i=0; i<3; i++) {
        let id = data.list[i].weather[0].id;
        if(id >= 200 && id < 300) alertText = "ACHTUNG: GEWITTER IM ANMARSCH";
        else if(id >= 600 && id < 700) alertText = "ACHTUNG: SCHNEEFALL ERWARTET";
    }
    
    if(alertText !== "") {
        document.getElementById('ticker-text').innerText = "+++ " + alertText + " +++ " + text;
        document.getElementById('ticker-text').style.color = "#ff3333"; // Rot bei Warnung
    } else {
        document.getElementById('ticker-text').innerText = text + "BRAUNSCHWEIG WETTER STABIL +++";
        document.getElementById('ticker-text').style.color = "#00eaff";
    }
}

/* --- MENÜ & STATUS --- */
function checkStatus() {
    // WLAN
    let net = document.getElementById('net-status');
    if(navigator.onLine) { net.innerText = "WLAN: OK"; net.style.color = "#0f0"; }
    else { net.innerText = "OFFLINE"; net.style.color = "#f00"; }
    
    // Batterie
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
    // Alle schließen
    document.querySelectorAll('.acc-content').forEach(el => el.style.display = 'none');
    // Gewähltes öffnen, wenn es zu war
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