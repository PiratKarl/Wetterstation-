/* --- AURA V40.0 FINAL SCRIPT --- */

const CONFIG = {
    version: 40.0,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    isAutoRestart: localStorage.getItem('aura_restarted') === 'true'
};

// VOLLBILD-FUNKTION (Aggressiv)
function enterFullscreen() {
    const doc = window.document;
    const docEl = doc.documentElement;
    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    
    if (requestFullScreen) {
        requestFullScreen.call(docEl).catch(err => {
            console.log("Vollbild blockiert - Interaktion erforderlich");
        });
    }
}

window.onload = () => {
    if (CONFIG.isAutoRestart) {
        localStorage.removeItem('aura_restarted');
        document.getElementById('auto-start-msg').style.display = 'block';
        setTimeout(startApp, 3000);
    }
};

async function startApp() {
    enterFullscreen(); // Versuch Vollbild beim Start
    document.getElementById('start-overlay').style.display = 'none';
    
    let vid = document.getElementById('logo-video');
    if (vid) { vid.play().then(() => vid.style.opacity = "1").catch(() => {}); }
    
    let bgVid = document.getElementById('wake-video-layer');
    if (bgVid) bgVid.play().catch(() => {});

    runClock();
    loadData();
    setInterval(runClock, 1000);
    setInterval(loadData, 600000);
    setInterval(checkUpdate, 300000);
}

function runClock() {
    let now = new Date();
    let h = now.getHours(); let m = now.getMinutes();
    document.getElementById('clock').innerText = (h<10?'0':'')+h + ':' + (m<10?'0':'')+m;
    
    let days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    let months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
}

function loadData() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.city}&appid=${CONFIG.apiKey}&units=metric&lang=de`)
    .then(r => r.json())
    .then(data => {
        renderCurrent(data);
        return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${CONFIG.apiKey}&units=metric&lang=de`);
    })
    .then(r => r.json())
    .then(forecast => {
        renderForecast(forecast);
        updateTicker(forecast);
    })
    .catch(() => {
        document.getElementById('ticker-text').innerText = "+++ VERBINDUNGSFEHLER +++";
    });
}

function renderCurrent(data) {
    document.getElementById('main-temp').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('main-icon').src = data.weather[0].icon + ".gif";
    document.getElementById('rain-prob').innerText = (data.rain ? "Regen" : "0% Regen");
    document.getElementById('feels-like').innerText = "Gefühlt: " + Math.round(data.main.feels_like) + "°";
    document.getElementById('desc-text').innerText = data.weather[0].description.toUpperCase();
}

function renderForecast(data) {
    let hHTML = "";
    for(let i=0; i<5; i++) {
        let item = data.list[i];
        hHTML += `<div class="f-item"><div class="f-head">${new Date(item.dt*1000).getHours()} Uhr</div><img src="${item.weather[0].icon}.gif" class="f-icon"><div>${Math.round(item.main.temp)}°</div></div>`;
    }
    document.getElementById('hourly-row').innerHTML = hHTML;
}

function checkUpdate() {
    fetch("version.json?t=" + Date.now()).then(r => r.json()).then(d => {
        if(d.version > CONFIG.version) {
            localStorage.setItem('aura_restarted', 'true');
            location.reload(true);
        }
    });
}

function openMenu() { document.getElementById('menu-modal').style.display = 'block'; }
function closeMenu() { 
    document.getElementById('menu-modal').style.display = 'none'; 
    enterFullscreen(); // Erneuter Versuch beim Schließen des Menüs
}

function toggleAccordion(id) {
    let content = document.getElementById(id);
    content.classList.toggle('acc-show');
}