/* --- AURA V36.0 INTELLIGENCE --- */

const CONFIG = {
    version: 36.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    lastTemp: null,
    sleepStart: localStorage.getItem('aura_sleep_start') || '22:00',
    sleepEnd: localStorage.getItem('aura_sleep_end') || '06:00'
};

const ui = {
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    locationHeader: document.getElementById('location-header'),
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

/* --- 1. START --- */
async function startApp() {
    document.getElementById('start-overlay').style.display = 'none';

    // Wake Lock
    if ('wakeLock' in navigator) { try { await navigator.wakeLock.request('screen'); } catch (err) {} }

    // Logo Retter
    let vid = document.getElementById('logo-video');
    let playPromise = vid.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => { vid.classList.add('video-active'); }).catch(e => {});
    }
    
    // Background Audio Loop
    let bgVid = document.getElementById('wake-video-layer');
    if(bgVid) bgVid.play().catch(e => {});

    runClock();
    loadData(); 
    checkStatus();

    setInterval(runClock, 1000);
    setInterval(loadData, 600000); // 10 Min
    setInterval(checkUpdate, 300000); // 5 Min
    setInterval(checkStatus, 60000); // 1 Min
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
        buildHybridTicker(forecast, curr); // Übergebe auch aktuelles Wetter
    })
    .catch(e => {
        ui.ticker.innerText = "+++ VERBINDUNGSFEHLER +++";
        ui.ticker.classList.add('t-alert');
    });

    let now = new Date();
    ui.updateTime.innerText = "Stand: " + (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
}

function renderCurrent(data) {
    ui.locationHeader.innerText = data.name.toUpperCase();
    let t = Math.round(data.main.temp);
    let fl = Math.round(data.main.feels_like);
    
    ui.mainTemp.innerText = t + "°";
    
    // GEFÜHLT FARB-LOGIK
    ui.feelsLike.innerText = "Gefühlt: " + fl + "°";
    ui.feelsLike.className = ""; 
    if(fl < t) ui.feelsLike.classList.add('feel-colder'); 
    else if(fl > t) ui.feelsLike.classList.add('feel-warmer'); 
    else ui.feelsLike.classList.add('feel-same'); 

    ui.mainIcon.src = data.weather[0].icon + ".gif";

    ui.desc.innerText = data.weather[0].description;
    ui.desc.className = ''; 
    if (CONFIG.lastTemp !== null) {
        if (t > CONFIG.lastTemp) ui.desc.classList.add('trend-up');
        else if (t < CONFIG.lastTemp) ui.desc.classList.add('trend-down');
        else ui.desc.classList.add('trend-same');
    }
    CONFIG.lastTemp = t;

    let sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
    let ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
    ui.sunrise.innerText = formatTime(sr);
    ui.sunset.innerText = formatTime(ss);
}

function renderForecast(data) {
    let popNow = Math.round(data.list[0].pop * 100);
    ui.rainProb.innerText = popNow + "% Regen";
    ui.moon.innerText = getMoonPhaseIcon(new Date());

    // STÜNDLICH (Format "13 Uhr")
    let hHTML = "";
    for(let i=0; i<5; i++) {
        let item = data.list[i];
        let hour = new Date(item.dt*1000).getHours();
        hHTML += `
            <div class="f-item">
                <div class="f-head">${hour} Uhr</div>
                <img src="${item.weather[0].icon}.gif" class="f-icon">
                <div class="f-temp-box">${Math.round(item.main.temp)}°</div>
            </div>`;
    }
    ui.hourly.innerHTML = hHTML;

    // TÄGLICH (Mit Regenwahrscheinlichkeit)
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
            let pop = Math.round(item.pop * 100); 

            dHTML += `
                <div class="f-item">
                    <div class="f-head">${dayName}</div>
                    <img src="${item.weather[0].icon}.gif" class="f-icon">
                    <div class="pop-daily">☂ ${pop}%</div>
                    <div class="f-temp-box">
                        <span class="val-min">${min}°</span><span style="font-size:0.4em;color:#333">|</span><span class="val-max">${max}°</span>
                    </div>
                </div>`;
        }
    });
    ui.daily.innerHTML = dHTML;
}

/* --- 4. HYBRID TICKER (ZEIT-SCANNER LOGIK) --- */
function buildHybridTicker(forecastData, currentData) {
    let tickerHTML = "";
    let alerts = [];
    let severe = false; 

    // Helper: Prüft ob Wetter-ID "schlimm" ist
    function isBad(id, wind) {
        if(id >= 200 && id < 300) return "GEWITTER"; // Rot
        if(id >= 600 && id < 700) return "SCHNEE";   // Rot
        if(wind > 15) return "STURM ("+Math.round(wind*3.6)+" km/h)"; // Rot
        return null;
    }

    // 1. Check AKTUELLES Wetter
    let badCurrent = isBad(currentData.weather[0].id, currentData.wind.speed);
    if(badCurrent) {
        alerts.push(`${badCurrent} (AKTUELL)`);
        severe = true;
    }

    // 2. Check ZUKUNFT (Nächste 12h)
    // Wir suchen das ERSTE Auftreten eines Unwetters
    let futureWarning = null;
    for(let i=0; i<4; i++) { // nächste 4 Einträge = 12h
        let item = forecastData.list[i];
        let badFuture = isBad(item.weather[0].id, item.wind.speed);
        
        if(badFuture && !severe) { // Nur wenn nicht eh schon aktuell Alarm ist
            let time = new Date(item.dt*1000);
            let timeStr = (time.getHours()<10?'0':'')+time.getHours() + ":00 UHR";
            futureWarning = `${badFuture} (ERWARTET AB ${timeStr})`;
            severe = true;
            break; // Erste Warnung reicht
        }
    }
    if(futureWarning) alerts.push(futureWarning);

    // 3. Check REGEN (Gelb) - Nur wenn kein Rot-Alarm
    if(!severe) {
        // Aktuell Regen?
        if(currentData.weather[0].id >= 300 && currentData.weather[0].id < 600) {
            alerts.push("REGEN (AKTUELL)");
        } else {
            // Kommt Regen?
            for(let i=0; i<3; i++) {
                let id = forecastData.list[i].weather[0].id;
                if(id >= 300 && id < 600) {
                    let time = new Date(forecastData.list[i].dt*1000);
                    let timeStr = (time.getHours()<10?'0':'')+time.getHours() + ":00 UHR";
                    alerts.push(`REGEN (AB ${timeStr})`);
                    break;
                }
            }
        }
    }
    
    // HTML BAUEN
    if(alerts.length > 0) {
        let cssClass = severe ? "t-alert" : "t-warn"; 
        let symbol = severe ? "⚠" : "☂";
        // Entferne Duplikate falls Logik doppelt greift
        let uniqueAlerts = [...new Set(alerts)];
        tickerHTML += `<span class="${cssClass}">${symbol} ACHTUNG: ${uniqueAlerts.join(" & ")} ${symbol}</span> <span class="t-sep">+++</span> `;
    } else {
        tickerHTML += `<span class="t-city">AURA SYSTEM V${CONFIG.version} ONLINE</span> <span class="t-sep">+++</span> `;
    }

    loadWorldCities(tickerHTML);
}

function loadWorldCities(prefixHTML) {
    let cities = ["Berlin", "London", "Paris", "Madrid", "Rome", "Moscow", "Istanbul", 
                  "New York", "Los Angeles", "Toronto", "Mexico City", 
                  "Rio de Janeiro", "Buenos Aires", 
                  "Tokyo", "Beijing", "Singapore", "Bangkok", "Dubai", "Mumbai", "Hong Kong", "Seoul", 
                  "Cairo", "Cape Town", "Sydney", "Auckland"];

    let requests = cities.map(c => 
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${c}&appid=${CONFIG.apiKey}&units=metric`)
        .then(r => r.json()).catch(e => null)
    );

    Promise.all(requests).then(results => {
        let worldHTML = "";
        results.forEach(res => {
            if(res) {
                let utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                let cityDate = new Date(utc + (1000 * res.timezone));
                let timeStr = (cityDate.getHours()<10?'0':'')+cityDate.getHours() + ":" + (cityDate.getMinutes()<10?'0':'')+cityDate.getMinutes();
                worldHTML += `
                    <img src="https://openweathermap.org/img/wn/${res.weather[0].icon}.png" class="t-icon">
                    <span class="t-city">${res.name.toUpperCase()}: ${Math.round(res.main.temp)}°</span>
                    <span class="t-time">${timeStr}</span>
                    <span class="t-sep">+++</span>`;
            }
        });
        ui.ticker.innerHTML = prefixHTML + worldHTML;
    });
}

/* --- 5. SYSTEM --- */
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

/* --- 6. MENÜ --- */
function openMenu() { 
    document.getElementById('menu-modal').style.display = 'block'; 
    document.getElementById('inp-city-val').value = CONFIG.city;
    document.getElementById('inp-sleep-start').value = CONFIG.sleepStart;
    document.getElementById('inp-sleep-end').value = CONFIG.sleepEnd;
}
function closeMenu() { 
    document.getElementById('menu-modal').style.display = 'none';
    document.documentElement.requestFullscreen().catch(e=>{});
}
function toggleAccordion(id) {
    let content = document.getElementById(id);
    let isVisible = content.classList.contains('acc-show');
    document.querySelectorAll('.acc-content').forEach(el => el.classList.remove('acc-show'));
    if(!isVisible) content.classList.add('acc-show');
}
function saveSettings() {
    let cityInp = document.getElementById('inp-city-val').value;
    if(cityInp) { localStorage.setItem('aura_city', cityInp); CONFIG.city = cityInp; loadData(); }
    let sS = document.getElementById('inp-sleep-start').value;
    let sE = document.getElementById('inp-sleep-end').value;
    localStorage.setItem('aura_sleep_start', sS); localStorage.setItem('aura_sleep_end', sE);
    CONFIG.sleepStart = sS; CONFIG.sleepEnd = sE;
    closeMenu();
}