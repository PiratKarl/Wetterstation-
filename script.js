/* --- AURA V83.6 (FULL INTEGRITY) --- */

var CONFIG = {
    version: 83.6,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    sleepFrom: localStorage.getItem('aura_sleep_from') || '',
    sleepTo: localStorage.getItem('aura_sleep_to') || '',
    tickerMode: localStorage.getItem('aura_ticker_mode') || 'world',
    shellyIP: localStorage.getItem('aura_shelly_ip') || ''
};

/* --- DATENBANKEN --- */
var WORLD_CITIES = [
    {n:"Berlin",f:"🇩🇪"}, {n:"London",f:"🇬🇧"}, {n:"New York",f:"🇺🇸"}, {n:"Tokyo",f:"🇯🇵"}, {n:"Sydney",f:"🇦🇺"},
    {n:"Paris",f:"🇫🇷"}, {n:"Moskau",f:"🇷🇺"}, {n:"Beijing",f:"🇨🇳"}, {n:"Dubai",f:"🇦🇪"}, {n:"Los Angeles",f:"🇺🇸"},
    {n:"Rio",f:"🇧🇷"}, {n:"Kapstadt",f:"🇿🇦"}, {n:"Singapur",f:"🇸🇬"}, {n:"Bangkok",f:"🇹🇭"}, {n:"Mumbai",f:"🇮🇳"},
    {n:"Istanbul",f:"🇹🇷"}, {n:"Rom",f:"🇮🇹"}, {n:"Madrid",f:"🇪🇸"}, {n:"Toronto",f:"🇨🇦"}, {n:"Mexiko-Stadt",f:"🇲🇽"},
    {n:"Kairo",f:"🇪🇬"}, {n:"Seoul",f:"🇰🇷"}, {n:"Hong Kong",f:"🇭🇰"}, {n:"Chicago",f:"🇺🇸"}, {n:"Athen",f:"🇬🇷"}
];

var SNOW_LOCATIONS = [
    { name: "WINTERBERG", flag: "🇩🇪", lat: 51.19, lon: 8.53 }, { name: "FELDBERG", flag: "🇩🇪", lat: 47.86, lon: 8.00 },
    { name: "ZUGSPITZE", flag: "🇩🇪", lat: 47.42, lon: 10.98 }, { name: "OBERSTDORF", flag: "🇩🇪", lat: 47.41, lon: 10.28 },
    { name: "BROCKEN", flag: "🇩🇪", lat: 51.80, lon: 10.61 }, { name: "GARMISCH", flag: "🇩🇪", lat: 47.49, lon: 11.09 },
    { name: "WILLINGEN", flag: "🇩🇪", lat: 51.29, lon: 8.61 }, { name: "FICHTELBERG", flag: "🇩🇪", lat: 50.42, lon: 12.95 },
    { name: "KITZBÜHEL", flag: "🇦🇹", lat: 47.44, lon: 12.39 }, { name: "ISCHGL", flag: "🇦🇹", lat: 47.01, lon: 10.29 },
    { name: "SÖLDEN", flag: "🇦🇹", lat: 46.97, lon: 11.01 }, { name: "MAYRHOFEN", flag: "🇦🇹", lat: 47.16, lon: 11.86 },
    { name: "ST. ANTON", flag: "🇦🇹", lat: 47.13, lon: 10.27 }, { name: "SAALBACH", flag: "🇦🇹", lat: 47.39, lon: 12.64 },
    { name: "OBERTAUERN", flag: "🇦🇹", lat: 47.24, lon: 13.55 }, { name: "SCHLADMING", flag: "🇦🇹", lat: 47.39, lon: 13.68 },
    { name: "ZERMATT", flag: "🇨🇭", lat: 46.02, lon: 7.75 }, { name: "ST. MORITZ", flag: "🇨🇭", lat: 46.50, lon: 9.84 },
    { name: "DAVOS", flag: "🇨🇭", lat: 46.80, lon: 9.83 }, { name: "LAAX", flag: "🇨🇭", lat: 46.82, lon: 9.26 },
    { name: "SAAS-FEE", flag: "🇨🇭", lat: 46.10, lon: 7.92 }, { name: "GRINDELWALD", flag: "🇨🇭", lat: 46.62, lon: 8.04 },
    { name: "GRÖDEN", flag: "🇮🇹", lat: 46.55, lon: 11.72 }, { name: "CORTINA", flag: "🇮🇹", lat: 46.54, lon: 12.13 },
    { name: "LIVIGNO", flag: "🇮🇹", lat: 46.53, lon: 10.13 }, { name: "CHAMONIX", flag: "🇫🇷", lat: 45.92, lon: 6.87 },
    { name: "VAL THORENS", flag: "🇫🇷", lat: 45.29, lon: 6.58 },
    { name: "ASPEN", flag: "🇺🇸", lat: 39.19, lon: -106.81 }, { name: "VAIL", flag: "🇺🇸", lat: 39.64, lon: -106.37 },
    { name: "WHISTLER", flag: "🇨🇦", lat: 50.11, lon: -122.95 }, { name: "BANFF", flag: "🇨🇦", lat: 51.17, lon: -115.57 },
    { name: "NISEKO", flag: "🇯🇵", lat: 42.80, lon: 140.68 }, { name: "TRYSIL", flag: "🇳🇴", lat: 61.31, lon: 12.26 },
    { name: "ÅRE", flag: "🇸🇪", lat: 63.39, lon: 13.07 }
];

var SUMMER_LOCATIONS = [
    { name: "DJERBA", flag: "🇹🇳", lat: 33.80, lon: 10.88 }, { name: "HAMMAMET", flag: "🇹🇳", lat: 36.40, lon: 10.61 },
    { name: "HURGHADA", flag: "🇪🇬", lat: 27.25, lon: 33.81 }, { name: "AGADIR", flag: "🇲🇦", lat: 30.42, lon: -9.59 },
    { name: "ANTALYA", flag: "🇹🇷", lat: 36.88, lon: 30.70 },
    { name: "BORACAY", flag: "🇵🇭", lat: 11.96, lon: 121.92 }, { name: "PALAWAN", flag: "🇵🇭", lat: 9.83, lon: 118.73 },
    { name: "PHUKET", flag: "🇹🇭", lat: 7.88, lon: 98.39 }, { name: "KOH SAMUI", flag: "🇹🇭", lat: 9.51, lon: 100.05 },
    { name: "BALI", flag: "🇮🇩", lat: -8.40, lon: 115.18 }, { name: "MALEDIVEN", flag: "🇲🇻", lat: 3.20, lon: 73.22 },
    { name: "DUBAI", flag: "🇦🇪", lat: 25.20, lon: 55.27 }, { name: "BENTOTA", flag: "🇱🇰", lat: 6.42, lon: 79.99 },
    { name: "PUNTA CANA", flag: "🇩🇴", lat: 18.58, lon: -68.40 }, { name: "VARADERO", flag: "🇨🇺", lat: 23.15, lon: -81.24 },
    { name: "CANCUN", flag: "🇲🇽", lat: 21.16, lon: -86.85 }, { name: "MIAMI", flag: "🇺🇸", lat: 25.76, lon: -80.19 },
    { name: "WAIKIKI", flag: "🇺🇸", lat: 21.27, lon: -157.82 },
    { name: "MALLORCA", flag: "🇪🇸", lat: 39.57, lon: 2.65 }, { name: "IBIZA", flag: "🇪🇸", lat: 38.91, lon: 1.43 },
    { name: "FUERTEVENTURA", flag: "🇪🇸", lat: 28.35, lon: -14.05 }, { name: "GRAN CANARIA", flag: "🇪🇸", lat: 27.92, lon: 15.55 },
    { name: "ALGARVE", flag: "🇵🇹", lat: 37.01, lon: -7.93 }, { name: "NIZZA", flag: "🇫🇷", lat: 43.70, lon: 7.26 },
    { name: "RIMINI", flag: "🇮🇹", lat: 44.06, lon: 12.56 }, { name: "DUBROVNIK", flag: "🇭🇷", lat: 42.65, lon: 18.09 },
    { name: "KRETA", flag: "🇬🇷", lat: 35.33, lon: 25.14 }, { name: "RHODOS", flag: "🇬🇷", lat: 36.43, lon: 28.22 },
    { name: "SYLT", flag: "🇩🇪", lat: 54.91, lon: 8.31 }, { name: "RÜGEN", flag: "🇩🇪", lat: 54.40, lon: 13.62 },
    { name: "NORDERNEY", flag: "🇩🇪", lat: 53.70, lon: 7.15 }, { name: "TIMMENDORF", flag: "🇩🇪", lat: 54.00, lon: 10.78 },
    { name: "ST. PETER", flag: "🇩🇪", lat: 54.30, lon: 8.63 }, { name: "USEDOM", flag: "🇩🇪", lat: 53.96, lon: 14.05 },
    { name: "SCHEVENINGEN", flag: "🇳🇱", lat: 52.11, lon: 4.28 }
];

var lastBatLevel = null;
var batDropCounter = 0;
var batteryCritical = false;
var lastPressure = parseFloat(localStorage.getItem('aura_last_press')) || 0;
var globalForecastCache = null; 

/* --- START --- */
function startApp() {
    var overlay = document.getElementById('start-overlay');
    if(overlay) overlay.style.display = 'none';
    
    var el = document.documentElement;
    if(el.requestFullscreen) { el.requestFullscreen().catch(function(e){}); } 
    else if(el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
    
    var bgVid = document.getElementById('wake-video-layer');
    if(bgVid) { bgVid.play().catch(function(e){}); }

    initVideoFallback();
    initMenuValues(); 

    runClock(); 
    loadData(); 
    updateShelly(); 
    checkStatus(); 
    initBatteryGuard(); 

    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     
    setInterval(updateShelly, 60000);  
    setInterval(checkStatus, 60000);   
}

function initVideoFallback() {
    var vid = document.getElementById('logo-video');
    if(!vid) return;
    vid.play().catch(function(error) { vid.style.display = 'none'; }); 
}

function initMenuValues() {
    var cityInp = document.getElementById('inp-city-val'); if(cityInp) cityInp.value = CONFIG.city;
    var tFrom = document.getElementById('inp-time-from'); if(tFrom) tFrom.value = CONFIG.sleepFrom;
    var tTo = document.getElementById('inp-time-to'); if(tTo) tTo.value = CONFIG.sleepTo;
    var tMode = document.getElementById('inp-ticker-mode'); if(tMode) tMode.value = CONFIG.tickerMode;
    var sIP = document.getElementById('inp-shelly-ip'); if(sIP) sIP.value = CONFIG.shellyIP;
}

function saveSettings() {
    var city = document.getElementById('inp-city-val').value;
    var tFrom = document.getElementById('inp-time-from').value;
    var tTo = document.getElementById('inp-time-to').value;
    var tMode = document.getElementById('inp-ticker-mode').value;
    var sIP = document.getElementById('inp-shelly-ip').value;
    
    if(city) { localStorage.setItem('aura_city', city); CONFIG.city = city; }
    localStorage.setItem('aura_sleep_from', tFrom); CONFIG.sleepFrom = tFrom;
    localStorage.setItem('aura_sleep_to', tTo); CONFIG.sleepTo = tTo;
    localStorage.setItem('aura_ticker_mode', tMode); CONFIG.tickerMode = tMode;
    localStorage.setItem('aura_shelly_ip', sIP); CONFIG.shellyIP = sIP;
    
    closeMenu(); 
    loadData();
    updateShelly(); 
}

/* --- SHELLY ENGINE (FAIL-SAFE) --- */
function updateShelly() {
    var ip = CONFIG.shellyIP;
    var display = document.getElementById('shelly-display');
    
    if(!ip || ip.trim() === "") {
        if(display) display.style.display = 'none';
        return;
    }

    if(display) display.style.display = 'block';
    
    var xhr = new XMLHttpRequest();
    // RPC Endpoint für Gen3 Shelly Geräte
    xhr.open('GET', 'http://' + ip + '/rpc/HT.GetStatus', true);
    xhr.timeout = 5000; 

    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                var temp = data['temperature:0'].tC.toFixed(1);
                var hum = data['humidity:0'].rh.toFixed(0);
                
                document.getElementById('shelly-temp').innerText = temp + "°C";
                document.getElementById('shelly-hum').innerText = hum + "%";
            } catch(e) { console.log("Shelly Parse Error"); }
        }
    };
    
    // Fehler ignorieren, damit die App weiterläuft
    xhr.onerror = function() { console.log("Shelly unreachable (CORS/Offline)"); };
    
    xhr.send();
}

/* --- WETTER ENGINE (ROBUST) --- */
function loadData() {
    showLoader();
    var cb = Date.now(); 
    var urlCurrent = 'https://api.openweathermap.org/data/2.5/weather?q=' + CONFIG.city + '&appid=' + CONFIG.apiKey + '&units=metric&lang=de&_t=' + cb;
    
    // Schritt 1: Hauptwetter laden
    fetch(urlCurrent)
    .then(function(r) { return r.json(); })
    .then(function(current) {
        renderCurrent(current);
        loadRealDWD(current.coord.lat, current.coord.lon);
        var urlForecast = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + current.coord.lat + '&lon=' + current.coord.lon + '&appid=' + CONFIG.apiKey + '&units=metric&lang=de&_t=' + cb;
        return fetch(urlForecast);
    })
    .then(function(r) { return r.json(); })
    .then(function(forecast) {
        globalForecastCache = forecast;
        renderForecast(forecast);
        // Ticker laden, Fehler abfangen
        loadTicker().catch(function(e){ console.log("Ticker Skip"); }); 
    })
    .then(function() { hideLoader(); })
    .catch(function(e) {
        console.error("Main Weather Error:", e);
        // Nur wenn das Hauptwetter fehlt, zeigen wir OFFLINE
        document.getElementById('ticker-text').innerHTML = '<span class="t-alert">+++ OFFLINE +++</span>';
        hideLoader();
    });
    
    var now = new Date();
    var ts = (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
    document.getElementById('last-update').innerText = "Sync: " + ts;
}

function loadTicker() {
    var tickerContent = "+++ AURA WETTERSTATION V83.6 +++ ";
    
    // Begrenzung um API-Fehler zu vermeiden
    var SAFE_CITIES = WORLD_CITIES.slice(0, 10); 
    
    var requests = SAFE_CITIES.map(function(city) { 
        return fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city.n + '&appid=' + CONFIG.apiKey + '&units=metric')
        .then(function(r){ return r.json(); })
        .then(function(d){ d.flag = city.f; return d; })
        .catch(function(){ return null; });
    });

    return Promise.all(requests).then(function(results) {
        var valid = 0;
        results.forEach(function(item) {
            if(item && item.main) {
                tickerContent += '<div class="t-item">' + item.flag + ' ' + item.name.toUpperCase() + ' ' + Math.round(item.main.temp) + '°</div>';
                valid++;
            }
        });
        if(valid > 0) document.getElementById('ticker-text').innerHTML = tickerContent;
    });
}

/* --- RENDER & HELPER --- */
function loadRealDWD(lat, lon) {
    var monitor = document.getElementById('dwd-monitor');
    var txt = document.getElementById('dwd-text');
    var time = document.getElementById('dwd-valid');
    if(!monitor) return;
    monitor.style.display = 'none'; 
    fetch('https://api.brightsky.dev/alerts?lat=' + lat + '&lon=' + lon).then(function(r) { return r.json(); }).then(function(data) {
        if(data && data.alerts && data.alerts.length > 0) {
            monitor.style.display = 'flex';
            var alerts = data.alerts;
            alerts.sort(function(a, b) { var sev = { 'minor': 1, 'moderate': 2, 'severe': 3, 'extreme': 4 }; return sev[b.severity] - sev[a.severity]; });
            var topAlert = alerts[0];
            monitor.className = '';
            if(topAlert.severity == 'extreme') monitor.classList.add('warn-red');
            else if(topAlert.severity == 'severe') monitor.classList.add('warn-orange');
            else if(topAlert.severity == 'moderate') monitor.classList.add('warn-yellow');
            else monitor.classList.add('warn-cyan'); 
            txt.innerText = (topAlert.headline_de || topAlert.event_de || "WARNUNG").toUpperCase();
            var end = new Date(topAlert.expires);
            time.innerText = "Bis: " + (end.getHours()<10?'0':'') + end.getHours() + ":" + (end.getMinutes()<10?'0':'') + end.getMinutes() + " Uhr";
            time.style.display = "block";
        }
    }).catch(function(e) {});
}

function renderCurrent(data) {
    document.getElementById('location-header').innerText = data.name.toUpperCase();
    document.getElementById('main-temp').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('main-icon').innerHTML = getVectorIcon(data.weather[0].icon, true);
    var rainProb = "0%";
    if(globalForecastCache && globalForecastCache.list && globalForecastCache.list[0]) rainProb = Math.round(globalForecastCache.list[0].pop * 100) + "%";
    document.getElementById('rain-val').innerHTML = rainProb;
    document.getElementById('val-feels').innerText = Math.round(data.main.feels_like) + "°";
    document.getElementById('val-humidity').innerText = data.main.humidity;
    var speed = Math.round(data.wind.speed * 3.6);
    document.getElementById('val-wind').innerHTML = speed + ' <span class="cell-unit">km/h</span>';
    document.getElementById('icon-wind').style.transform = 'rotate(' + data.wind.deg + 'deg)';
    document.getElementById('val-vis').innerText = Math.round(data.visibility / 1000);
    document.getElementById('val-press').innerText = data.main.pressure;
    var sr = new Date((data.sys.sunrise + data.timezone - 3600) * 1000);
    var ss = new Date((data.sys.sunset + data.timezone - 3600) * 1000);
    document.getElementById('sunrise').innerText = formatTime(sr);
    document.getElementById('sunset').innerText = formatTime(ss);
}

function renderForecast(data) {
    var hHTML = "";
    for(var i=0; i<5; i++) {
        var item = data.list[i];
        var h = new Date(item.dt*1000).getHours();
        hHTML += '<div class="f-item"><span class="f-head">' + h + ' Uhr</span><div class="f-icon">' + getVectorIcon(item.weather[0].icon, false) + '</div><span class="f-temp">' + Math.round(item.main.temp) + '°</span></div>';
    }
    document.getElementById('hourly-row').innerHTML = hHTML;
    var dailyMap = {};
    for(var j=0; j<data.list.length; j++) {
        var item = data.list[j];
        var d = new Date(item.dt*1000);
        var dayKey = d.toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
        if(!dailyMap[dayKey]) dailyMap[dayKey] = { min: 100, max: -100, icon: item.weather[0].icon, pop: 0 };
        if(item.main.temp_min < dailyMap[dayKey].min) dailyMap[dayKey].min = item.main.temp_min;
        if(item.main.temp_max > dailyMap[dayKey].max) dailyMap[dayKey].max = item.main.temp_max;
        if(item.pop > dailyMap[dayKey].pop) dailyMap[dayKey].pop = item.pop;
        if(d.getHours() >= 11 && d.getHours() <= 14) dailyMap[dayKey].icon = item.weather[0].icon;
    }
    var dHTML = "";
    var keys = Object.keys(dailyMap).slice(0, 5);
    for(var k=0; k<keys.length; k++) {
        var key = keys[k];
        var d = dailyMap[key];
        dHTML += '<div class="f-item"><span class="f-head">' + key + '</span><div class="f-icon">' + getVectorIcon(d.icon, false) + '</div><div class="f-rain-row"><span class="f-rain-text">' + Math.round(d.pop*100) + '%</span></div><div class="temp-range"><span class="temp-low">' + Math.round(d.min) + '°</span><span class="temp-sep">-</span><span class="temp-high">' + Math.round(d.max) + '°</span></div></div>';
    }
    document.getElementById('daily-row').innerHTML = dHTML;
    document.getElementById('moon-phase').innerText = getMoonPhase(new Date());
}

function runClock() {
    var now = new Date();
    var h = (now.getHours()<10?'0':'')+now.getHours();
    var m = (now.getMinutes()<10?'0':'')+now.getMinutes();
    var clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = h + ":" + m;
    var days = ['SONNTAG','MONTAG','DIENSTAG','MITTWOCH','DONNERSTAG','FREITAG','SAMSTAG'];
    var months = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    var dateEl = document.getElementById('date');
    if(dateEl) dateEl.innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
    checkAutoSleep();
}

function checkAutoSleep() {
    if(!CONFIG.sleepFrom || !CONFIG.sleepTo) return;
    var now = new Date();
    var curMin = now.getHours() * 60 + now.getMinutes();
    var fromParts = CONFIG.sleepFrom.split(':');
    var fromMin = parseInt(fromParts[0]) * 60 + parseInt(fromParts[1]);
    var toParts = CONFIG.sleepTo.split(':');
    var toMin = parseInt(toParts[0]) * 60 + parseInt(toParts[1]);
    var shouldSleep = false;
    if(fromMin < toMin) { if(curMin >= fromMin && curMin < toMin) shouldSleep = true; } 
    else { if(curMin >= fromMin || curMin < toMin) shouldSleep = true; }
    var ol = document.getElementById('sleep-overlay');
    if(shouldSleep) { if(ol.style.display !== 'block') { ol.style.display = 'block'; closeMenu(); } } 
    else { if(ol.style.display === 'block') { ol.style.display = 'none'; } }
}

function checkStatus() {
    var net = document.getElementById('net-status');
    if(navigator.onLine) { net.innerText = "WLAN: OK"; net.style.color = "#0f0"; }
    else { net.innerText = "OFFLINE"; net.style.color = "#f00"; }
    if(navigator.getBattery) {
        navigator.getBattery().then(function(bat) { 
            var levelText = "BAT: " + Math.round(bat.level*100) + "%";
            var trendHTML = "";
            if(lastBatLevel !== null) {
                var diff = bat.level - lastBatLevel;
                if(diff > 0.005) trendHTML = '<span class="bat-trend-up">↑</span>';
                else if(diff < -0.005) trendHTML = '<span class="bat-trend-down">↓</span>';
            }
            document.getElementById('bat-level').innerHTML = levelText + trendHTML;
            if(lastBatLevel !== null && bat.level < lastBatLevel) batDropCounter++;
            else batDropCounter = 0;
            if(batDropCounter >= 2) batteryCritical = true;
            lastBatLevel = bat.level;
        });
    }
}

function initBatteryGuard() { if(navigator.getBattery) { navigator.getBattery().then(function(bat) { lastBatLevel = bat.level; }); } }
function getVectorIcon(code, isReal) {
    var sunObj = '<circle class="svg-sun" cx="12" cy="12" r="5"/><g class="svg-sun" style="stroke:#00eaff; stroke-width:2"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></g>';
    var cloudPath = '<path class="svg-cloud" d="M7,19 L17,19 C21,19 21,15 21,15 C21,11 17,11 17,11 C17,7 13,4 11,4 C7,4 5,7 5,10 C2,10 1,12 1,14 C1,16 3,19 5,19 Z" />';
    if(code === '01d') return '<svg class="svg-icon" viewBox="0 0 24 24">' + sunObj + '</svg>';
    return '<svg class="svg-icon" viewBox="0 0 24 24">' + cloudPath + '</svg>';
}

function showLoader() { document.getElementById('loader').style.display = 'block'; }
function hideLoader() { document.getElementById('loader').style.display = 'none'; }
function toggleSleep() { var ol = document.getElementById('sleep-overlay'); ol.style.display = (ol.style.display==='block'?'none':'block'); }
function formatTime(d) { return (d.getHours()<10?'0':'')+d.getHours() + ":" + (d.getMinutes()<10?'0':'')+d.getMinutes(); }
function openMenu() { document.getElementById('menu-modal').style.display = 'block'; }
function closeMenu() { document.getElementById('menu-modal').style.display = 'none'; }
function toggleAccordion(id) { 
    var c = document.getElementById(id); 
    var contents = document.querySelectorAll('.acc-content');
    for(var i=0; i<contents.length; i++) contents[i].style.display='none';
    c.style.display="block"; 
}
function getMoonPhase(d) { return "🌓 Halbmond"; }