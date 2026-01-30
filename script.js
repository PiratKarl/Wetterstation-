/* --- AURA V32.0 INTELLIGENCE --- */

const CONFIG = {
    version: 32.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    lastTemp: null,
    // Sleep Timer Defaults (noch ohne harte Funktion, nur Speicherung)
    sleepStart: localStorage.getItem('aura_sleep_start') || '22:00',
    sleepEnd: localStorage.getItem('aura_sleep_end') || '06:00'
};

// UI Element Cache
const ui = {
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    locationHeader: document.getElementById('location-header'), // NEU
    mainIcon: document.getElementById('main-icon'),
    mainTemp: document.getElementById('main-temp'),
    feelsLike: document.getElementById('feels-like'),
    rainProb: document.getElementById('rain-prob'),
    desc: document.getElementById('desc-text'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    moon: document.getElementById('moon-phase'),
    battery: document.getElementById('bat-level'),
    wifi: document.getElementById('net-status'),
    updateTime: document.getElementById('last-update'),
    ticker: document.getElementById('ticker-text'),
    hourly: document.getElementById('hourly-row'),
    daily: document.getElementById('daily-row')
};

/* --- 1. SYSTEM START & LOGO RETTER --- */
async function startApp() {
    document.getElementById('start-overlay').style.display = 'none';

    // A) Modernes Tablet: Wake Lock
    if ('wakeLock' in navigator) {
        try { await navigator.wakeLock.request('screen'); } catch (err) {}
    }

    // B) Logo Logik (Retter für altes Tablet)
    // Strategie: Bild ist an. Wir versuchen Video zu starten. Wenn es klappt -> Video einblenden.
    let vid = document.getElementById('logo-video');
    let playPromise = vid.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Video läuft! Wir machen es sichtbar.
            console.log("Video läuft -> Blende über Bild.");
            vid.classList.add('video-active');
        }).catch(error => {
            // Video fail -> Wir tun NICHTS. Das Bild ist ja schon da.
            console.log("Video fail (Altes Tablet) -> Bleibe beim Bild.");
        });
    }

    // C) Hintergrund Wachhalter (nur Audio/Loop Versuch)
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) bgVid.play().catch(e => {});

    // D) Start Routine
    runClock();
    loadData();
    checkStatus();

    // Intervalle
    setInterval(runClock, 1000);
    setInterval(loadData, 600000); // 10 Min Wetter
    setInterval(checkUpdate, 300000); // 5 Min Version
    setInterval(checkStatus, 60000); // 1 Min Status
}

/* --- 2. UHRZEIT --- */
function runClock() {
    let now = new Date();
    let h = now.getHours(); let m = now.getMinutes();
    ui.clock.innerText = (h<10?'0':'')+h + ':' + (m<10?'0':'')+m;
    
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    ui.date.innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
}

/* --- 3. WETTER DATEN --- */
function loadData() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city}&appid=${CONFIG.apiKey}&units=metric&lang=de`)
    .then(r => r.json())
    .then(curr => {
        renderCurrent(curr);
        return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${curr.coord.lat}&lon=${curr.coord.lon}&appid=${CONFIG.apiKey}&units=metric&lang=de`);
    })
    .then(r => r.json())
    .then(forecast => {
        renderForecast(forecast);
        renderTicker(forecast);
    })
    .catch(e => {
        console.error(e);
        ui.ticker.innerText = "+++ DATEN-FEHLER +++";
        ui.ticker.classList.add('ticker-alert');
    });

    let now = new Date();
    ui.updateTime.innerText = "Stand: " + (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
}

function renderCurrent(data) {
    // HEADER (Stadtname oben)
    ui.locationHeader.innerText = data.name.toUpperCase();

    // TEMP
    let t = Math.round(data.main.temp);
    ui.mainTemp.innerText = t + "°";
    ui.feelsLike.innerText = "Gefühlt: " + Math.round(data.main.feels_like) + "°";
    ui.mainIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Trend-Farbe
    ui.desc.innerText = data.weather[0].description;
    ui.desc.className = ''; 
    if (CONFIG.lastTemp !== null) {
        if (t > CONFIG.lastTemp) ui.desc.classList.add('trend-up');
        else if (t < CONFIG.lastTemp) ui.desc.classList.add('trend-down');
        else ui.desc.classList.add('trend-same');
    }
    CONFIG.lastTemp = t;

    // Astro
    let sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
    let ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
    ui.sunrise.innerText = formatTime(sr);
    ui.sunset.innerText = formatTime(ss);
}

function renderForecast(data) {
    // Regenwahrscheinlichkeit
    let pop = Math.round(data.list[0].pop * 100);
    ui.rainProb.innerText = pop + "% Regen";
    
    // Mond
    ui.moon.innerText = getMoonPhaseIcon(new Date());

    // Stündlich (5 Werte)
    let hHTML = "";
    for(let i=0; i<5; i++) {
        let item = data.list[i];
        let hour = new Date(item.dt*1000).getHours();
        hHTML += `
            <div class="f-item">
                <div class="f-head">${hour} Uhr</div>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" class="f-icon">
                <div class="f-temp-box">${Math.round(item.main.temp)}°</div>
            </div>`;
    }
    ui.hourly.innerHTML = hHTML;

    // Täglich (5 Werte)
    let dHTML = "";
    let usedDays = [];
    let count = 0;
    data.list.forEach(item => {
        let date = new Date(item.dt*1000);
        let dayName = date.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        if(!usedDays.includes(dayName) && date.getHours() >= 12 && count < 5) {
            usedDays.push(dayName);
            count++;
            let max = Math.round(item.main.temp_max);
            let min = Math.round(item.main.temp_min - 2); 
            dHTML += `
                <div class="f-item">
                    <div class="f-head">${dayName}</div>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" class="f-icon">
                    <div class="f-temp-box">
                        <span class="val-min">${min}°</span> <span style="font-size:0.5em;color:#444">|</span> <span class="val-max">${max}°</span>
                    </div>
                </div>`;
        }
    });
    ui.daily.innerHTML = dHTML;
}

/* --- 4. TICKER --- */
function renderTicker(data) {
    let alerts = [];
    data.list.slice(0, 8).forEach(item => {
        let id = item.weather[0].id;
        if(id >= 200 && id < 600) alerts.push("REGEN/GEWITTER");
        if(id >= 600 && id < 700) alerts.push("SCHNEE");
        if(item.wind.speed > 15) alerts.push("STURM");
    });
    alerts = [...new Set(alerts)];

    if(alerts.length > 0) {
        ui.ticker.classList.add('ticker-alert');
        ui.ticker.innerText = "+++ WARNUNG: " + alerts.join(" & ") + " +++";
    } else {
        ui.ticker.classList.remove('ticker-alert');
        loadWorldTicker();
    }
}
function loadWorldTicker() {
    let cities = ["Berlin", "London", "New York", "Tokio"];
    let text = "+++ AURA V32 ONLINE +++ ";
    let fetches = cities.map(c => fetch(`https://api.openweathermap.org/data/2.5/weather?q=${c}&appid=${CONFIG.apiKey}&units=metric`).then(r=>r.json()));
    Promise.all(fetches).then(results => {
        results.forEach(res => { text += ` ◈ ${res.name.toUpperCase()}: ${Math.round(res.main.temp)}° `; });
        ui.ticker.innerText = text + " +++";
    });
}

/* --- 5. SYSTEM & HELFER --- */
function checkStatus() {
    if(navigator.onLine) { ui.wifi.innerText = "WLAN: OK"; ui.wifi.className = "stat-ok"; }
    else { ui.wifi.innerText = "OFFLINE"; ui.wifi.className = "stat-err"; }

    if('getBattery' in navigator) {
        navigator.getBattery().then(bat => {
            let level = Math.round(bat.level * 100);
            ui.battery.innerText = "BAT: " + level + "%";
            if(level < 20 && !bat.charging) ui.battery.className = "stat-err"; else ui.battery.className = "stat-ok";
        });
    }
}
function checkUpdate() {
    fetch("version.json?t=" + Date.now()).then(r => r.json()).then(d => {
        if(d.version > CONFIG.version) location.reload(true);
    });
}
function formatTime(d) { return (d.getHours()<10?'0':'')+d.getHours() + ":" + (d.getMinutes()<10?'0':'')+d.getMinutes(); }
function getMoonPhaseIcon(date) {
    let year = date.getFullYear(); let month = date.getMonth()+1; let day = date.getDate();
    if(month<3){year--;month+=12;} ++month;
    let c=365.25*year; let e=30.6*month;
    let jd=c+e+day-694039.09; jd/=29.5305882; 
    let b=parseInt(jd); jd-=b; b=Math.round(jd*8); if(b>=8)b=0;
    const moons = ['🌑 Neumond','🌒 Zunehmend','🌓 Halbmond','🌔 Zunehmend','🌕 Vollmond','🌖 Abnehmend','🌗 Halbmond','🌘 Abnehmend'];
    return moons[b];
}

/* --- 6. NEUES MENÜ LOGIK (AKKORDEON) --- */
function openMenu() { 
    document.getElementById('menu-modal').style.display = 'block'; 
    // Fülle Inputs mit gespeicherten Werten
    document.getElementById('inp-city-val').value = CONFIG.city;
    document.getElementById('inp-sleep-start').value = CONFIG.sleepStart;
    document.getElementById('inp-sleep-end').value = CONFIG.sleepEnd;
}
function closeMenu() { document.getElementById('menu-modal').style.display = 'none'; }

// Diese Funktion klappt die Bereiche auf und zu
function toggleAccordion(id) {
    let content = document.getElementById(id);
    let isVisible = content.classList.contains('acc-show');
    
    // Erstmal alle zumachen (damit immer nur einer offen ist)
    let all = document.querySelectorAll('.acc-content');
    all.forEach(el => el.classList.remove('acc-show'));
    
    // Wenn es zu war, mach DIESES auf
    if(!isVisible) {
        content.classList.add('acc-show');
    }
}

function saveSettings() {
    let cityInp = document.getElementById('inp-city-val').value;
    let sleepS = document.getElementById('inp-sleep-start').value;
    let sleepE = document.getElementById('inp-sleep-end').value;

    if(cityInp) {
        localStorage.setItem('aura_city', cityInp);
        CONFIG.city = cityInp;
        loadData();
    }
    // Speichere Sleep Zeiten
    localStorage.setItem('aura_sleep_start', sleepS);
    localStorage.setItem('aura_sleep_end', sleepE);
    CONFIG.sleepStart = sleepS;
    CONFIG.sleepEnd = sleepE;

    alert("Einstellungen gespeichert!");
    closeMenu();
}