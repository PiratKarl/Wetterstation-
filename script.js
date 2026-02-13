/* --- AURA V86.2 (GEN3 FINAL & DEBUG) --- */

var CONFIG = {
    version: 86.2,
    apiKey: '518e81d874739701f08842c1a55f6588', 
    city: localStorage.getItem('aura_city') || 'Braunschweig',
    sleepFrom: localStorage.getItem('aura_sleep_from') || '',
    sleepTo: localStorage.getItem('aura_sleep_to') || '',
    tickerMode: localStorage.getItem('aura_ticker_mode') || 'world',
    shellyIP: localStorage.getItem('aura_shelly_ip') || '',
    shellyActive: (localStorage.getItem('aura_shelly_active') === 'true')
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
    checkStatus(); 
    initBatteryGuard(); 
    updateShelly(); 

    setInterval(runClock, 1000);       
    setInterval(loadData, 600000);     
    setInterval(checkStatus, 60000);   
    setInterval(updateShelly, 60000); 
}

function initVideoFallback() {
    var vid = document.getElementById('logo-video');
    if(!vid) return;
    var playPromise = vid.play();
    if (playPromise !== undefined) { 
        playPromise.catch(function(error) { vid.style.display = 'none'; }); 
    }
}

function initMenuValues() {
    var cityInp = document.getElementById('inp-city-val'); if(cityInp) cityInp.value = CONFIG.city;
    var tFrom = document.getElementById('inp-time-from'); if(tFrom) tFrom.value = CONFIG.sleepFrom;
    var tTo = document.getElementById('inp-time-to'); if(tTo) tTo.value = CONFIG.sleepTo;
    var tMode = document.getElementById('inp-ticker-mode'); if(tMode) tMode.value = CONFIG.tickerMode;
    
    var sIP = document.getElementById('inp-shelly-ip'); if(sIP) sIP.value = CONFIG.shellyIP;
    var sChk = document.getElementById('chk-shelly-active'); if(sChk) sChk.checked = CONFIG.shellyActive;
}

function saveSettings() {
    var city = document.getElementById('inp-city-val').value;
    var tFrom = document.getElementById('inp-time-from').value;
    var tTo = document.getElementById('inp-time-to').value;
    var tMode = document.getElementById('inp-ticker-mode').value;
    
    var sIP = document.getElementById('inp-shelly-ip').value;
    var sActive = document.getElementById('chk-shelly-active').checked;
    var sError = document.getElementById('shelly-error');

    if(sActive && (!sIP || sIP.trim() === "")) {
        sError.style.display = 'block'; 
        return; 
    } else {
        sError.style.display = 'none'; 
    }
    
    if(city) { localStorage.setItem('aura_city', city); CONFIG.city = city; }
    localStorage.setItem('aura_sleep_from', tFrom); CONFIG.sleepFrom = tFrom;
    localStorage.setItem('aura_sleep_to', tTo); CONFIG.sleepTo = tTo;
    localStorage.setItem('aura_ticker_mode', tMode); CONFIG.tickerMode = tMode;
    
    localStorage.setItem('aura_shelly_ip', sIP); CONFIG.shellyIP = sIP;
    localStorage.setItem('aura_shelly_active', sActive); CONFIG.shellyActive = sActive;
    
    closeMenu(); 
    loadData(); 
    updateShelly(); 
}

function updateShelly() {
    var display = document.getElementById('shelly-display');
    var txtTemp = document.getElementById('shelly-temp');
    var txtHum = document.getElementById('shelly-hum');
    
    if(!CONFIG.shellyActive || !CONFIG.shellyIP) {
        if(display) display.style.display = 'none';
        return;
    }
    if(display) display.style.display = 'block';

    var xhr = new XMLHttpRequest();
    // GEN3: Wir nutzen Shelly.GetStatus
    xhr.open('GET', 'http://' + CONFIG.shellyIP + '/rpc/Shelly.GetStatus', true);
    xhr.timeout = 5000; 
    
    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                
                // GEN3 PARSING: Wir greifen exakt auf die Struktur zu, die du geschickt hast
                // "temperature:0": { "tC": 21.2 ... }
                // "humidity:0": { "rh": 36.0 ... }
                
                var tempRaw = data['temperature:0'] ? data['temperature:0'].tC : null;
                var humRaw = data['humidity:0'] ? data['humidity:0'].rh : null;

                if(tempRaw !== null) {
                    txtTemp.innerText = tempRaw.toFixed(1) + "°C";
                    txtTemp.style.color = "#00eaff";
                }
                if(humRaw !== null) {
                    txtHum.innerText = humRaw.toFixed(0) + "%";
                }
                
            } catch(e) { 
                console.log("JSON Parse Error: " + e);
                txtTemp.innerText = "JSON?";
                txtTemp.style.color = "orange";
            }
        } else {
            txtTemp.innerText = "ERR:" + xhr.status;
            txtTemp.style.color = "red";
        }
    };
    
    // HIER WIRD DER FEHLER ANGEZEIGT, WENN DER BROWSER BLOCKIERT
    xhr.onerror = function() { 
        console.log("Netzwerkfehler / Blockiert"); 
        txtTemp.innerText = "BLOCK"; 
        txtTemp.style.color = "red";
        txtHum.innerText = "NET";
    };
    
    xhr.send();
}

function showLoader() { var l = document.getElementById('loader'); if(l) l.style.display = 'block'; }
function hideLoader() { setTimeout(function() { var l = document.getElementById('loader'); if(l) l.style.display = 'none'; }, 1000); }

/* --- ENGINE --- */
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
    
    if(fromMin < toMin) { 
        if(curMin >= fromMin && curMin < toMin) shouldSleep = true; 
    } else { 
        if(curMin >= fromMin || curMin < toMin) shouldSleep = true; 
    }
    
    var ol = document.getElementById('sleep-overlay');
    if(shouldSleep) { 
        if(ol.style.display !== 'block') { ol.style.display = 'block'; closeMenu(); } 
    } else { 
        if(ol.style.display === 'block') { ol.style.display = 'none'; } 
    }
}

function checkStatus() {
    var net = document.getElementById('net-status');
    if(navigator.onLine) { net.innerText = "WLAN: OK"; net.style.color = "#0f0"; }
    else { net.innerText = "OFFLINE"; net.style.color = "#f00"; }
    
    if(navigator.getBattery) {
        navigator.getBattery().then(function(bat) { 
            var levelText = "BAT: " + Math.round(bat.level*100) + "%";
            var trendHTML = "";
            var diff = 0;
            if(lastBatLevel !== null) {
                diff = bat.level - lastBatLevel;
                if(diff > 0.005) trendHTML = '<span class="bat-trend-up">↑</span>';
                else if(diff < -0.005) trendHTML = '<span class="bat-trend-down">↓</span>';
                else trendHTML = '<span class="bat-trend-eq">=</span>';
            }
            document.getElementById('bat-level').innerHTML = levelText + trendHTML;
            
            var current = bat.level;
            if(lastBatLevel !== null) {
                if(current < lastBatLevel) batDropCounter++;
                else if (current > lastBatLevel) { batDropCounter = 0; batteryCritical = false; }
            }
            if(batDropCounter >= 2) { batteryCritical = true; }
            lastBatLevel = current;
        });
    }
}

function initBatteryGuard() {
    if(navigator.getBattery) { 
        navigator.getBattery().then(function(bat) { lastBatLevel = bat.level; }); 
    }
}

function loadData() {
    showLoader();
    var cb = Date.now(); 
    var urlCurrent = 'https://api.openweathermap.org/data/2.5/weather?q=' + CONFIG.city + '&appid=' + CONFIG.apiKey + '&units=metric&lang=de&_t=' + cb;
    
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
        return loadTicker(); 
    })
    .then(function() { hideLoader(); })
    .catch(function(e) {
        console.log(e);
        document.getElementById('ticker-text').innerHTML = '<span class="t-alert">+++ OFFLINE +++</span>';
        hideLoader();
    });
    
    var now = new Date();
    var ts = (now.getHours()<10?'0':'')+now.getHours() + ":" + (now.getMinutes()<10?'0':'')+now.getMinutes();
    document.getElementById('last-update').innerText = "Sync: " + ts;
}

function loadRealDWD(lat, lon) {
    var monitor = document.getElementById('dwd-monitor');
    var txt = document.getElementById('dwd-text');
    var time = document.getElementById('dwd-valid');
    if(!monitor) return;
    monitor.style.display = 'none'; 
    
    fetch('https://api.brightsky.dev/alerts?lat=' + lat + '&lon=' + lon)
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if(data && data.alerts && data.alerts.length > 0) {
            monitor.style.display = '-webkit-flex'; 
            monitor.style.display = 'flex';
            var alerts = data.alerts;
            alerts.sort(function(a, b) { 
                var sev = { 'minor': 1, 'moderate': 2, 'severe': 3, 'extreme': 4 };
                return sev[b.severity] - sev[a.severity];
            });
            var topAlert = alerts[0];
            var level = 1;
            if(topAlert.severity == 'moderate') level = 2;
            if(topAlert.severity == 'severe') level = 3;
            if(topAlert.severity == 'extreme') level = 4;
            
            monitor.className = '';
            if(level === 4) monitor.classList.add('warn-red');
            else if(level === 3) monitor.classList.add('warn-orange');
            else if(level === 2) monitor.classList.add('warn-yellow');
            else monitor.classList.add('warn-cyan'); 
            
            var msg = topAlert.headline_de || topAlert.event_de || "WETTERWARNUNG";
            txt.innerText = msg.toUpperCase();
            
            var end = new Date(topAlert.expires);
            var endStr = (end.getHours()<10?'0':'') + end.getHours() + ":" + (end.getMinutes()<10?'0':'') + end.getMinutes();
            time.innerText = "Bis: " + endStr + " Uhr";
            time.style.display = "block";
        }
    })
    .catch(function(e) {});
}

function renderCurrent(data) {
    document.getElementById('location-header').innerText = data.name.toUpperCase();
    document.getElementById('main-temp').innerText = Math.round(data.main.temp) + "°";
    document.getElementById('main-icon').innerHTML = getVectorIcon(data.weather[0].icon, true);
    
    var rainProb = "0%";
    if(globalForecastCache && globalForecastCache.list && globalForecastCache.list[0]) {
       rainProb = Math.round(globalForecastCache.list[0].pop * 100) + "%";
    }
    
    document.getElementById('rain-val').innerHTML = rainProb;
    document.getElementById('val-feels').innerText = Math.round(data.main.feels_like) + "°";
    document.getElementById('val-humidity').innerText = data.main.humidity;
    
    var speed = Math.round(data.wind.speed * 3.6);
    document.getElementById('val-wind').innerHTML = speed + ' <span class="cell-unit">km/h</span>';
    document.getElementById('icon-wind').style.transform = 'rotate(' + data.wind.deg + 'deg)';
    
    var visKM = Math.round(data.visibility / 1000);
    document.getElementById('val-vis').innerText = visKM;
    
    var press = data.main.pressure;
    if(press !== lastPressure) { localStorage.setItem('aura_last_press', press); lastPressure = press; }
    document.getElementById('val-press').innerText = press;
    
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
        var dayData = dailyMap[dayKey];
        if(item.main.temp_min < dayData.min) dayData.min = item.main.temp_min;
        if(item.main.temp_max > dayData.max) dayData.max = item.main.temp_max;
        if(item.pop > dayData.pop) dayData.pop = item.pop;
        if(d.getHours() >= 11 && d.getHours() <= 14) dayData.icon = item.weather[0].icon;
    }
    
    var dHTML = "";
    var keys = Object.keys(dailyMap).slice(0, 5);
    var dropSvg = '<svg class="f-drop-small" viewBox="0 0 24 24"><path d="M12 2.6c-3.4 5.8-8.5 11.5-8.5 16 0 4.6 3.8 8.4 8.5 8.4s8.5-3.8 8.5-8.4c0-4.5-5.1-10.2-8.5-16z"/></svg>';
    
    for(var k=0; k<keys.length; k++) {
        var key = keys[k];
        var d = dailyMap[key];
        dHTML += '<div class="f-item"><span class="f-head">' + key + '</span><div class="f-icon">' + getVectorIcon(d.icon, false) + '</div><div class="f-rain-row">' + dropSvg + '<span class="f-rain-text">' + Math.round(d.pop*100) + '%</span></div><div class="temp-range"><span class="temp-low">' + Math.round(d.min) + '°</span><span class="temp-sep">-</span><span class="temp-high">' + Math.round(d.max) + '°</span></div></div>';
    }
    document.getElementById('daily-row').innerHTML = dHTML;
    document.getElementById('moon-phase').innerText = getMoonPhase(new Date());
}

function loadTicker() {
    var tickerContent = "";
    if(batteryCritical) tickerContent += '<span class="t-warn-crit">+++ ACHTUNG: KRITISCHE ENTLADUNG! +++</span> ';
    
    if(CONFIG.tickerMode === 'snow') tickerContent += '<span class="t-item">+++ SCHNEEHÖHEN (35 ZIELE) +++</span>';
    else if(CONFIG.tickerMode === 'summer') tickerContent += '<span class="t-item">+++ WASSERTEMPERATUREN (35 ZIELE) +++</span>';
    else tickerContent += '<span class="t-item">+++ WELT-WETTER +++</span>';

    var cb = Date.now();
    var requests = [];
    
    if(CONFIG.tickerMode === 'snow') {
        requests = SNOW_LOCATIONS.map(function(loc) { 
            return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon + '&current=snow_depth&timezone=auto')
            .then(function(r){ return r.json(); })
            .then(function(d){ return { name: loc.name, flag: loc.flag, data: d }; })
            .catch(function(e){ return null; });
        });
    } else if(CONFIG.tickerMode === 'summer') {
        requests = SUMMER_LOCATIONS.map(function(loc) { 
            return fetch('https://marine-api.open-meteo.com/v1/marine?latitude=' + loc.lat + '&longitude=' + loc.lon + '&current=sea_surface_temperature&timezone=auto')
            .then(function(r){ return r.json(); })
            .then(function(d){ return { name: loc.name, flag: loc.flag, data: d }; })
            .catch(function(e){ return null; });
        });
    } else {
        requests = WORLD_CITIES.map(function(city) { 
            return fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city.n + '&appid=' + CONFIG.apiKey + '&units=metric&_t=' + cb)
            .then(function(r){ return r.json(); })
            .then(function(d){ d.flag = city.f; return d; })
            .catch(function(e){ return null; });
        });
    }

    return Promise.all(requests).then(function(results) {
        results.forEach(function(item) {
            if(!item) return;
            
            if(CONFIG.tickerMode === 'snow' || CONFIG.tickerMode === 'summer') {
                if(item.data && item.data.current) {
                    var val = "";
                    var icon = "";
                    if(CONFIG.tickerMode === 'snow') {
                        var cm = Math.round(item.data.current.snow_depth * 100);
                        val = cm > 0 ? cm + "cm" : "0cm";
                        icon = "❄️";
                        if(cm > 50) icon = "⛷️"; 
                        else if(cm > 20) icon = "🗻";
                        tickerContent += '<div class="t-item">' + item.flag + ' ' + item.name + ' ' + icon + ' ' + val + '</div>';
                    } else {
                        var temp = Math.round(item.data.current.sea_surface_temperature);
                        icon = "🌊";
                        if(temp > 22) icon = "🌴"; 
                        else if(temp >= 17) icon = "🏊";
                        tickerContent += '<div class="t-item">' + item.flag + ' ' + item.name + ' ' + icon + ' ' + temp + '°C</div>';
                    }
                }
            } else {
                if(item.main) {
                    var utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                    var cityTime = new Date(utc + (1000 * item.timezone));
                    var h = (cityTime.getHours()<10?'0':'')+cityTime.getHours();
                    var m = (cityTime.getMinutes()<10?'0':'')+cityTime.getMinutes();
                    tickerContent += '<div class="t-item">' + item.flag + ' ' + item.name.toUpperCase() + ' <div class="t-icon">' + getVectorIcon(item.weather[0].icon, false) + '</div> <span class="t-time">' + h + ':' + m + '</span> ' + Math.round(item.main.temp) + '°</div>';
                }
            }
        });
        document.getElementById('ticker-text').innerHTML = tickerContent;
    });
}

function getVectorIcon(code, isReal) {
    var isNight = code.indexOf('n') !== -1;
    var svgContent = "";
    var cssClass = isReal ? "icon-real" : "icon-simple";
    var cloudPath = '<path class="svg-cloud" d="M7,19 L17,19 C19.2,19 21,17.2 21,15 C21,12.8 19.2,11 17,11 L17,10 C17,6.7 14.3,4 11,4 C7.7,4 5,6.7 5,10 C2.8,10 1,11.8 1,14 C1,16.2 2.8,19 5,19 Z" />';
    var cloudDark = '<path class="svg-cloud-dark" d="M7,19 L17,19 C19.2,19 21,17.2 21,15 C21,12.8 19.2,11 17,11 L17,10 C17,6.7 14.3,4 11,4 C7.7,4 5,6.7 5,10 C2.8,10 1,11.8 1,14 C1,16.2 2.8,19 5,19 Z" />';
    var fillSun = isReal ? 'url(#gradSunReal)' : '#00eaff';
    var sunObj = '<circle class="svg-sun" cx="12" cy="12" r="5"/><g class="svg-sun" style="stroke:'+fillSun+'; stroke-width:2"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g>';
    var moonObj = '<path class="svg-moon" d="M12,3 C10,3 8,4 7,6 C10,6 13,9 13,12 C13,15 10,18 7,18 C8,20 10,21 12,21 C17,21 21,17 21,12 C21,7 17,3 12,3 Z" />';
    var rainObj = '<line class="svg-rain" x1="8" y1="18" x2="8" y2="22" /><line class="svg-rain" x1="12" y1="18" x2="12" y2="22" style="animation-delay:0.2s" /><line class="svg-rain" x1="16" y1="18" x2="16" y2="22" style="animation-delay:0.4s"/>';
    var snowObj = '<circle class="svg-snow" cx="8" cy="20" r="1.5"/><circle class="svg-snow" cx="16" cy="20" r="1.5" style="animation-delay:1s"/><circle class="svg-snow" cx="12" cy="22" r="1.5" style="animation-delay:0.5s"/>';
    var boltObj = '<polygon class="svg-bolt" points="10,15 13,15 12,19 16,13 13,13 14,9"/>';
    var mistObj = '<line class="svg-mist" x1="4" y1="10" x2="20" y2="10" /><line class="svg-mist" x1="4" y1="14" x2="20" y2="14" style="animation-delay:1s"/><line class="svg-mist" x1="4" y1="18" x2="20" y2="18" style="animation-delay:2s"/>';
    
    if(code === '01d') svgContent = sunObj; 
    else if(code === '01n') svgContent = moonObj; 
    else if(code === '02d' || code === '02n') svgContent = (isNight ? moonObj : sunObj) + cloudPath; 
    else if(code === '03d' || code === '03n' || code === '04d' || code === '04n') svgContent = cloudPath + cloudDark; 
    else if(code === '09d' || code === '09n' || code === '10d' || code === '10n') svgContent = cloudPath + rainObj; 
    else if(code === '11d' || code === '11n') svgContent = cloudDark + boltObj; 
    else if(code === '13d' || code === '13n') svgContent = cloudPath + snowObj; 
    else if(code === '50d' || code === '50n') svgContent = mistObj; 
    else svgContent = sunObj; 
    
    return '<svg class="svg-icon ' + cssClass + '" viewBox="0 0 24 24">' + svgContent + '</svg>';
}

function toggleSleep() { 
    var ol = document.getElementById('sleep-overlay'); 
    if(ol.style.display === 'block') ol.style.display = 'none'; 
    else { ol.style.display = 'block'; closeMenu(); } 
}
function checkUpdate() { 
    fetch("version.json?t=" + Date.now()).then(function(r){return r.json()}).then(function(d){ if(d.version > CONFIG.version) location.reload(true); }); 
}
function formatTime(d) { return (d.getHours()<10?'0':'')+d.getHours() + ":" + (d.getMinutes()<10?'0':'')+d.getMinutes(); }
function getMoonPhase(date) {
    var year = date.getFullYear(); var month = date.getMonth() + 1; var day = date.getDate();
    if (month < 3) { year--; month += 12; }
    var c = 365.25 * year; var e = 30.6 * month; var jd = c + e + day - 694039.09;
    jd /= 29.5305882; var b = parseInt(jd); jd -= b; b = Math.round(jd * 8); if (b >= 8) b = 0;
    var phases = ['🌑 Neumond', '🌒 Zunehmend', '🌓 Halbmond', '🌔 Zunehmend', '🌕 Vollmond', '🌖 Abnehmend', '🌗 Halbmond', '🌘 Abnehmend'];
    return phases[b];
}
function openMenu() { document.getElementById('menu-modal').style.display = 'block'; }
function closeMenu() { document.getElementById('menu-modal').style.display = 'none'; }
function toggleAccordion(id) { 
    var c = document.getElementById(id); 
    var contents = document.querySelectorAll('.acc-content');
    for(var i=0; i<contents.length; i++) contents[i].style.display='none';
    c.style.display="block"; 
}