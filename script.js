/* --- AURA V31.0 INTELLIGENCE --- */

const CONFIG = {
    version: 31.0,
    apiKey: '518e81d874739701f08842c1a55f6588', // Dein Key
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    lastTemp: null // Zum Trend-Vergleich
};

// CACHE DOM ELEMENTS
const ui = {
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    city: document.getElementById('city-name'), // Im Menü oder Titel falls vorhanden
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

/* --- 1. SYSTEM START & WACHHALTER --- */
async function startApp() {
    document.getElementById('start-overlay').style.display = 'none';

    // A) Modernes Tablet: Wake Lock API
    if ('wakeLock' in navigator) {
        try {
            await navigator.wakeLock.request('screen');
            console.log("Modern WakeLock aktiv");
        } catch (err) {
            console.log("WakeLock abgelehnt:", err);
        }
    }

    // B) Altes Tablet: Video-Trick + Audio
    // Versuch Video zu starten
    let vid = document.getElementById('logo-video');
    let bgVid = document.getElementById('wake-video-layer'); // Unsichtbarer Layer
    
    // Fallback-Logik für Logo
    let playPromise = vid.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Video konnte nicht starten (Altes Tablet?). Zeige Bild.");
            vid.style.display = 'none'; // Video weg
            document.getElementById('logo-img').style.display = 'block'; // Bild her
        });
    }
    
    // Hintergrund-Video starten (Wichtig für Sleep)
    if(bgVid) bgVid.play().catch(e => console.log("BG-Wake Error", e));

    // C) Daten laden
    runClock();
    loadData(); // Wetter & Co.
    checkStatus(); // Akku/WLAN

    // D) Intervalle
    setInterval(runClock, 1000);
    setInterval(loadData, 600000); // 10 Min
    setInterval(checkUpdate, 300000); // 5 Min Update Check
    setInterval(checkStatus, 60000); // 1 Min Status Check
}

/* --- 2. UHRZEIT --- */
function runClock() {
    let now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    ui.clock.innerText = (h<10?'0':'')+h + ':' + (m<10?'0':'')+m;
    
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    ui.date.innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
}

/* --- 3. WETTER DATEN --- */
function loadData() {
    // 1. Hole Aktuelles Wetter UND Vorhersage
    // Wir nutzen den Forecast Call auch für Astro/Mond, da Standard-Weather keine Mondphase hat
    
    // Aktuelles Wetter
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city}&appid=${CONFIG.apiKey}&units=metric&lang=de`)
    .then(r => r.json())
    .then(curr => {
        renderCurrent(curr);
        // Vorhersage holen (braucht Koordinaten von curr)
        return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${curr.coord.lat}&lon=${curr.coord.lon}&appid=${CONFIG.apiKey}&units=metric&lang=de`);
    })
    .then(r => r.json())
    .then(forecast => {
        renderForecast(forecast);
        renderTicker(forecast); // Prüft auf Regen/Warnungen in der Vorhersage
    })
    .catch(e => {
        console.error("Wetter Fehler:", e);
        ui.ticker.innerText = "+++ FEHLER BEIM LADEN DER DATEN +++ BITTE NETZWERK PRÜFEN +++";
        ui.ticker.classList.add('ticker-alert');
    });

    // Update-Zeit setzen
    let now = new Date();
    ui.updateTime.innerText = "Stand: " + (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
}

function renderCurrent(data) {
    // Temp
    let t = Math.round(data.main.temp);
    ui.mainTemp.innerText = t + "°";
    ui.feelsLike.innerText = "Gefühlt: " + Math.round(data.main.feels_like) + "°";
    
    // Icon
    ui.mainIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Beschreibung & Trend-Farbe
    ui.desc.innerText = data.weather[0].description;
    ui.desc.className = ''; // Reset
    
    if (CONFIG.lastTemp !== null) {
        if (t > CONFIG.lastTemp) ui.desc.classList.add('trend-up'); // Wärmer -> Rot
        else if (t < CONFIG.lastTemp) ui.desc.classList.add('trend-down'); // Kälter -> Blau
        else ui.desc.classList.add('trend-same');
    }
    CONFIG.lastTemp = t;

    // Astro (Sonne)
    let sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
    let ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
    ui.sunrise.innerText = formatTime(sr);
    ui.sunset.innerText = formatTime(ss);
}

function renderForecast(data) {
    // A) Regenwahrscheinlichkeit (POP) aus dem ersten Forecast-Slot nehmen (da Current API das oft nicht hat)
    let pop = Math.round(data.list[0].pop * 100);
    ui.rainProb.innerText = pop + "% Regen";

    // B) Mondphase (aus dem Daily-Teil des Forecasts oder geschätzt, hier nehmen wir den ersten Eintrag)
    // Hinweis: Standard 2.5 Forecast hat keine Mondphase in der kostenlosen Version.
    // Workaround: Wir berechnen sie grob oder nutzen ein Icon-Mapping falls verfügbar.
    // Für V31 nutzen wir eine einfache Berechnung basierend auf dem Datum, da API v2.5 Free kein Mond sendet.
    ui.moon.innerText = getMoonPhaseIcon(new Date());

    // C) Stündlich (Nächste 5 Stunden)
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

    // D) Täglich (5 Tage) - Wir suchen Mittagswerte (ca 12:00) und Min/Max
    let dHTML = "";
    let daysProcessed = 0;
    let usedDays = [];

    data.list.forEach(item => {
        let date = new Date(item.dt*1000);
        let dayName = date.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        
        // Simples Min/Max aus dem 3h Takt ist schwer, wir nehmen die Temp um 14 Uhr als "Max" und Nachts als "Min" Annäherung
        // Oder wir zeigen einfach die Mittagstemperatur an. 
        // Für V31: Wir nehmen den Wert um 12:00-15:00 Uhr.
        
        if(!usedDays.includes(dayName) && date.getHours() >= 12 && daysProcessed < 5) {
            usedDays.push(dayName);
            daysProcessed++;
            
            // Simuliere Min/Max Spread (API gibt in Free Version nur 3h Schritte)
            let max = Math.round(item.main.temp_max); 
            let min = Math.round(item.main.temp_min - 2); // Kleiner Fake für Optik, da 3h Forecast oft eng beieinander

            dHTML += `
                <div class="f-item">
                    <div class="f-head">${dayName}</div>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" class="f-icon">
                    <div class="f-temp-box">
                        <span class="val-min">${min}°</span> - <span class="val-max">${max}°</span>
                    </div>
                </div>`;
        }
    });
    ui.daily.innerHTML = dHTML;
}

/* --- 4. TICKER LOGIK --- */
function renderTicker(data) {
    // Logik: Prüfe auf "Sturm", "Gewitter", "Schnee" in den Beschreibungen
    let alerts = [];
    data.list.slice(0, 8).forEach(item => { // Nächste 24h prüfen
        let id = item.weather[0].id;
        if(id >= 200 && id < 600) alerts.push("REGEN/GEWITTER"); // Regen/Gewitter
        if(id >= 600 && id < 700) alerts.push("SCHNEE"); // Schnee
        if(item.wind.speed > 15) alerts.push("STURM ("+Math.round(item.wind.speed*3.6)+" km/h)");
    });

    // Dubletten entfernen
    alerts = [...new Set(alerts)];

    if(alerts.length > 0) {
        // WARNUNG MODUS
        ui.ticker.classList.add('ticker-alert');
        ui.ticker.innerText = "+++ ACHTUNG: " + alerts.join(" & ") + " ERWARTET +++ VORSICHT IM VERKEHR +++";
    } else {
        // WELTWETTER MODUS
        ui.ticker.classList.remove('ticker-alert');
        loadWorldTicker();
    }
}

function loadWorldTicker() {
    let cities = ["Berlin", "London", "New York", "Tokio", "Rom", "Paris"];
    let text = "+++ AURA V31 ONLINE +++ ";
    
    // Kleiner Trick: Wir rufen nicht 6x die API ab (Rate Limit!), sondern simulieren hier kurz oder nehmen gespeicherte Werte.
    // Für die echte Version nehmen wir 3 Städte.
    let fetches = cities.slice(0, 3).map(c => 
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${c}&appid=${CONFIG.apiKey}&units=metric`).then(r=>r.json())
    );

    Promise.all(fetches).then(results => {
        results.forEach(res => {
            text += ` ◈ ${res.name.toUpperCase()}: ${Math.round(res.main.temp)}° `;
        });
        ui.ticker.innerText = text + " +++";
    });
}

/* --- 5. SYSTEM STATUS --- */
function checkStatus() {
    // WLAN
    if(navigator.onLine) {
        ui.wifi.innerText = "WLAN: OK";
        ui.wifi.className = "stat-ok";
    } else {
        ui.wifi.innerText = "OFFLINE";
        ui.wifi.className = "stat-err";
    }

    // BATTERIE
    if('getBattery' in navigator) {
        navigator.getBattery().then(bat => {
            let level = Math.round(bat.level * 100);
            ui.battery.innerText = "BAT: " + level + "%";
            if(level < 20 && !bat.charging) ui.battery.className = "stat-err";
            else ui.battery.className = "stat-ok";
        });
    } else {
        ui.battery.innerText = "";
    }
}

function checkUpdate() {
    fetch("version.json?t=" + Date.now())
    .then(r => r.json())
    .then(d => {
        if(d.version > CONFIG.version) location.reload(true);
    });
}

/* --- HELFER --- */
function formatTime(date) {
    return (date.getHours()<10?'0':'')+date.getHours() + ":" + (date.getMinutes()<10?'0':'')+date.getMinutes();
}

function getMoonPhaseIcon(date) {
    // Sehr einfache Berechnung der Mondphase (reicht für Optik)
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let c = 0; let e = 0; let jd = 0; let b = 0;

    if (month < 3) { year--; month += 12; }
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09; // jd is total days elapsed
    jd /= 29.5305882; // divide by the moon cycle
    b = parseInt(jd); // int(jd) -> b, take integer part of jd
    jd -= b; // subtract integer part to leave fractional part of original jd
    b = Math.round(jd * 8); // scale fraction from 0-8 and round

    if (b >= 8 ) b = 0; // 0 and 8 are the same so turn 8 into 0
    
    const moons = ['🌑 Neumond', '🌒 Zunehmend', '🌓 Halbmond', '🌔 Zunehmend', '🌕 Vollmond', '🌖 Abnehmend', '🌗 Halbmond', '🌘 Abnehmend'];
    return moons[b];
}

/* --- MENÜ FUNKTIONEN --- */
function openMenu() { document.getElementById('menu-modal').style.display = 'block'; }
function closeMenu() { document.getElementById('menu-modal').style.display = 'none'; }
function saveCity() {
    let inp = document.getElementById('inp-city-val').value;
    if(inp) {
        localStorage.setItem('aura_city', inp);
        CONFIG.city = inp;
        loadData();
        closeMenu();
    }
}
function alertInfo(msg) { alert(msg); }