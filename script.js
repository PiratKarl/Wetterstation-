/* --- AURA V39.0 FINAL REPAIR --- */

const CONFIG = {
    version: 39.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    sleepStart: localStorage.getItem('aura_sleep_start') || '22:00',
    sleepEnd: localStorage.getItem('aura_sleep_end') || '06:00',
    isAutoRestart: localStorage.getItem('aura_restarted') === 'true'
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
    ticker: document.getElementById('ticker-text'),
    hourly: document.getElementById('hourly-row'),
    daily: document.getElementById('daily-row'),
    wifi: document.getElementById('net-status'),
    battery: document.getElementById('bat-level'),
    updateTime: document.getElementById('last-update')
};

// AUTO-START LOGIK NACH UPDATE
window.onload = () => {
    if (CONFIG.isAutoRestart) {
        localStorage.removeItem('aura_restarted');
        document.getElementById('auto-start-msg').style.display = 'block';
        document.getElementById('manual-start-btn').innerText = "STARTET AUTOMATISCH...";
        setTimeout(startApp, 3000);
    }
};

async function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    
    // Logo Video & Wachhalter starten (Muted für Auto-Start Erlaubnis)
    let vid = document.getElementById('logo-video');
    if (vid) { vid.play().then(_ => vid.classList.add('video-active')).catch(e => {}); }
    let bgVid = document.getElementById('wake-video-layer');
    if (bgVid) bgVid.play().catch(e => {});

    runClock();
    loadData(); 
    checkStatus();

    setInterval(runClock, 1000);
    setInterval(loadData, 600000); 
    setInterval(checkUpdate, 300000); 
    setInterval(checkStatus, 60000); 
}

function runClock() {
    let now = new Date();
    let h = now.getHours(); let m = now.getMinutes();
    let timeStr = (h<10?'0':'')+h + ':' + (m<10?'0':'')+m;
    ui.clock.innerText = timeStr;
    
    // Datum
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    ui.date.innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];

    // SLEEP-CHECK
    checkSleepMode(timeStr);
}

function checkSleepMode(currentTime) {
    if (currentTime === CONFIG.sleepStart) {
        document.body.style.opacity = "0.05"; // Fast schwarz
        document.body.style.backgroundColor = "#000";
    } else if (currentTime === CONFIG.sleepEnd) {
        document.body.style.opacity = "1";
    }
}

function loadData() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city}&appid=${CONFIG.apiKey}&units=metric&lang=de`)
    .then(r => r.json())
    .then(currentWeather => {
        renderCurrent(currentWeather);
        return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${currentWeather.coord.lat}&lon=${currentWeather.coord.lon}&appid=${CONFIG.apiKey}&units=metric&lang=de`)
        .then(r => r.json())
        .then(forecastData => {
            renderForecast(forecastData);
            buildHybridTicker(forecastData, currentWeather);
        });
    })
    .catch(e => {
        ui.ticker.innerHTML = '<span class="t-alert">+++ VERBINDUNGSFEHLER ZUM SERVER +++</span>';
    });

    let now = new Date();
    ui.updateTime.innerText = "Stand: " + (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
}

function renderCurrent(data) {
    ui.locationHeader.innerText = data.name.toUpperCase();
    let t = Math.round(data.main.temp);
    let fl = Math.round(data.main.feels_like);
    ui.mainTemp.innerText = t + "°";
    
    ui.feelsLike.innerText = "Gefühlt: " + fl + "°";
    ui.feelsLike.className = (fl < t) ? 'feel-colder' : (fl > t ? 'feel-warmer' : '');

    ui.mainIcon.src = data.weather[0].icon + ".gif";
    ui.desc.innerText = data.weather[0].description;

    document.getElementById('sunrise').innerText = formatTime(new Date((data.sys.sunrise + data.timezone - 3600) * 1000));
    document.getElementById('sunset').innerText = formatTime(new Date((data.sys.sunset + data.timezone - 3600) * 1000));
}

function renderForecast(data) {
    ui.rainProb.innerText = Math.round(data.list[0].pop * 100) + "% Regen";
    
    // Stunden-Leiste
    let hHTML = "";
    for(let i=0; i<5; i++) {
        let item = data.list[i];
        hHTML += `<div class="f-item"><div class="f-head">${new Date(item.dt*1000).getHours()}h</div><img src="${item.weather[0].icon}.gif" class="f-icon"><div>${Math.round(item.main.temp)}°</div></div>`;
    }
    ui.hourly.innerHTML = hHTML;

    // Tage-Leiste
    let dHTML = ""; let used = []; let count = 0;
    data.list.forEach(item => {
        let d = new Date(item.dt*1000);
        let name = d.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        if(!used.includes(name) && d.getHours() >= 12 && count < 5) {
            used.push(name); count++;
            dHTML += `<div class="f-item"><div class="f-head">${name}</div><img src="${item.weather[0].icon}.gif" class="f-icon"><div class="pop-daily">☂${Math.round(item.pop*100)}%</div><div>${Math.round(item.main.temp)}°</div></div>`;
        }
    });
    ui.daily.innerHTML = dHTML;
}

function buildHybridTicker(forecastData, currentData) {
    let tickerHTML = `<span class="t-city">AURA V${CONFIG.version} ONLINE</span> <span class="t-sep">+++</span> `;
    
    // Weltstädte mit lokalen GIF-Pfaden
    let cities = ["Berlin", "London", "Paris", "New York", "Tokyo"];
    let requests = cities.map(c => fetch(`https://api.openweathermap.org/data/2.5/weather?q=${c}&appid=${CONFIG.apiKey}&units=metric`).then(r => r.json()).catch(e => null));

    Promise.all(requests).then(results => {
        results.forEach(res => {
            if(res && res.main) {
                // Hier der Fix: Lokale GIFs auch im Ticker nutzen
                tickerHTML += `<img src="${res.weather[0].icon}.gif" class="t-icon"><span class="t-city">${res.name.toUpperCase()}: ${Math.round(res.main.temp)}°</span><span class="t-sep">+++</span>`;
            }
        });
        ui.ticker.innerHTML = tickerHTML;
    });
}

function checkStatus() {
    ui.wifi.innerText = navigator.onLine ? "WLAN: OK" : "OFFLINE";
    ui.wifi.className = navigator.onLine ? "stat-ok" : "stat-err";
    if('getBattery' in navigator) {
        navigator.getBattery().then(bat => { ui.battery.innerText = "BAT: " + Math.round(bat.level * 100) + "%"; });
    }
}

function checkUpdate() { 
    fetch("version.json?t=" + Date.now()).then(r => r.json()).then(d => { 
        if(d.version > CONFIG.version) {
            localStorage.setItem('aura_restarted', 'true');
            location.reload(true); 
        }
    }); 
}

function formatTime(d) { return (d.getHours()<10?'0':'')+d.getHours() + ":" + (d.getMinutes()<10?'0':'')+d.getMinutes(); }

function toggleAccordion(id) {
    let content = document.getElementById(id);
    let isVisible = content.classList.contains('acc-show');
    document.querySelectorAll('.acc-content').forEach(el => el.classList.remove('acc-show'));
    if(!isVisible) content.classList.add('acc-show');
}

function openMenu() { document.getElementById('menu-modal').style.display = 'block'; }
function closeMenu() { document.getElementById('menu-modal').style.display = 'none'; }

function saveSettings() {
    let city = document.getElementById('inp-city-val').value;
    let sStart = document.getElementById('inp-sleep-start').value;
    let sEnd = document.getElementById('inp-sleep-end').value;
    
    if(city) { localStorage.setItem('aura_city', city); CONFIG.city = city; }
    if(sStart) { localStorage.setItem('aura_sleep_start', sStart); CONFIG.sleepStart = sStart; }
    if(sEnd) { localStorage.setItem('aura_sleep_end', sEnd); CONFIG.sleepEnd = sEnd; }
    
    loadData();
    closeMenu();
}