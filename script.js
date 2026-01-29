/* --- AURA V23.4 URURLAUBS-MOTOR (Android 4.4 Safe) --- */

var currentVer = 23.4;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start') || '--:--', sEnd = localStorage.getItem('t-end') || '--:--';
var lastDataFetch = 0;
var appStarted = false; // Sicherung für den Start-Vorhang

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    appStarted = true;
    document.getElementById('start-overlay').style.display = 'none';
    
    var de = document.documentElement;
    if (de.requestFullscreen) { de.requestFullscreen(); } 
    else if (de.webkitRequestFullscreen) { de.webkitRequestFullscreen(); } 
    
    var heartbeat = document.getElementById('logo-heartbeat');
    var wA = document.getElementById('wake-aud');
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    wA.play();
    if(heartbeat) { heartbeat.play(); }

    loadWeather();
    update();
    
    setInterval(update, 1000);           
    setInterval(loadWeather, 600000);    
    setInterval(checkUpdate, 1800000);   
}

function update() {
    if(!appStarted) return; // Nichts tun, bis Start-Knopf gedrückt wurde

    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];

    updateStatusCockpit();

    if(sStart !== '--:--' && sEnd !== '--:--') {
        var n = now.getHours()*60 + now.getMinutes();
        var s = parseInt(sStart.split(':')[0])*60 + parseInt(sStart.split(':')[1]);
        var e = parseInt(sEnd.split(':')[0])*60 + parseInt(sEnd.split(':')[1]);
        var isSleep = (s > e) ? (n >= s || n < e) : (n >= s && n < e);
        var sV = document.getElementById('sleep-vid');
        if(isSleep) { 
            if(sV.style.display !== 'block') { sV.style.display = 'block'; sV.play(); } 
        } else { sV.style.display = 'none'; sV.pause(); }
    }
}

function updateStatusCockpit() {
    var diff = (Date.now() - lastDataFetch) / 1000 / 60;
    var dStat = document.getElementById('stat-data');
    if(diff < 15) { dStat.innerHTML = "🔄 DATEN AKTUELL"; dStat.className = "status-line stat-ok"; }
    else { dStat.innerHTML = "🔄 DATEN VERALTET"; dStat.className = "status-line stat-err"; }

    var wStat = document.getElementById('stat-wlan');
    if(navigator.onLine) { wStat.innerHTML = "📡 WLAN VERBUNDEN"; wStat.className = "status-line stat-ok"; }
    else { wStat.innerHTML = "📡 KEIN WLAN"; wStat.className = "status-line stat-err"; }

    if (navigator.getBattery) {
        navigator.getBattery().then(function(bat) {
            var bStat = document.getElementById('stat-bat');
            var lvl = Math.round(bat.level * 100);
            bStat.innerHTML = (bat.charging ? "⚡ LADEN " : "🔋 AKKU ") + lvl + "%";
            bStat.className = (lvl > 20 || bat.charging) ? "status-line stat-ok" : "status-line stat-err";
            var alertBox = document.getElementById('bat-alert');
            if(lvl < 5 && !bat.charging) { alertBox.style.display = 'block'; }
            else { alertBox.style.display = 'none'; }
        });
    }
    document.getElementById('conf-sleep').innerText = "🌙 Sleep: " + sStart;
    document.getElementById('conf-wake').innerText = "☀️ Wake: " + sEnd;
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        if (x.status === 200) {
            lastDataFetch = Date.now();
            var d = JSON.parse(x.responseText);
            document.getElementById('city-name').innerText = d.name.toUpperCase();
            document.getElementById('temp').innerText = Math.round(d.main.temp) + "°";
            document.getElementById('w-icon').src = d.weather[0].icon + ".gif";
            document.getElementById('w-desc').innerText = d.weather[0].description.toUpperCase();
            document.getElementById('w-feels').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
            
            var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000), s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
            document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
            document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());

            calcMoon();
            loadFore(d.coord.lat, d.coord.lon, d.main.temp);
            checkWarnings(d.coord.lat, d.coord.lon);
        }
    };
    x.send();
}

function calcMoon() {
    var n = new Date();
    var y = n.getFullYear(), m = n.getMonth() + 1, d = n.getDate();
    if (m < 3) { y--; m += 12; }
    ++m;
    var jd = (365.25 * y) + (30.6 * m) + d - 694039.09; jd /= 29.53;
    var b = Math.round((jd - parseInt(jd)) * 8); if (b >= 8) b = 0;
    var mI = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    var mT = ["NEUMOND", "SICHEL", "1. VIERTEL", "ZUN. MOND", "VOLLMOND", "ABN. MOND", "3. VIERTEL", "SICHEL"];
    var row = document.getElementById('moon-row');
    row.innerText = mI[b] + " " + mT[b];
}

function loadTicker(warnTxt) {
    var world = ["Tokyo", "New York", "Paris", "London", "Rome", "Sydney"];
    var holidays = ["Mallorca", "Antalya", "Berlin", "Gardasee", "Hamburg", "Sylt", "Kreta", "München", "Rügen", "Istrien", "Lüneburger Heide", "Tirol", "Barcelona", "Dubai"];
    
    var fullTicker = warnTxt; // Start mit Warnungen
    var allCities = world.concat(holidays);
    var done = 0;

    allCities.forEach(function(c) {
        var r = new XMLHttpRequest();
        r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric",true);
        r.onload = function() {
            if(r.status===200) {
                var j = JSON.parse(r.responseText);
                var utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                var cityTime = new Date(utc + (3600000 * (j.timezone / 3600)));
                var tStr = z(cityTime.getHours()) + ":" + z(cityTime.getMinutes());
                
                var special = "";
                if(c === "Lüneburger Heide") special = " 🐑 ";
                if(c === "Tirol") special = " 🏔️ ";

                var entry = " <span class='t-world'> ◈ " + j.name.toUpperCase() + special + " <span class='t-time'>" + tStr + "</span> <img class='t-icon' src='" + j.weather[0].icon + ".gif'> " + Math.round(j.main.temp) + "°</span>";
                
                // Zuordnung zur richtigen Phase
                if(world.indexOf(c) > -1) { world[world.indexOf(c)] = entry; }
                else { holidays[holidays.indexOf(c)] = entry; }
            }
            done++;
            if(done === allCities.length) {
                // Zusammenbau: Warnungen / Welt / Warnungen / Urlaub
                var output = warnTxt + world.join("") + warnTxt + " <span style='color:#ffcc00'>🏖️ BELIEBTE ZIELE:</span> " + holidays.join("");
                document.getElementById('ticker-text').innerHTML = output;
            }
        };
        r.send();
    });
}

function checkWarnings(lat, lon) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.brightsky.dev/alerts?lat="+lat+"&lon="+lon, true);
    x.onload = function() {
        var txt = "";
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if (data.alerts && data.alerts.length > 0) {
                for(var i=0; i<data.alerts.length; i++) { 
                    txt += "<span class='t-warn'> +++ ⚠️ WARNUNG: " + data.alerts[i].event_de.toUpperCase() + " ⚠️</span>"; 
                }
            }
        }
        loadTicker(txt);
    };
    x.onerror = function() { loadTicker(""); };
    x.send();
}

// Restliche Funktionen (loadFore, checkUpdate, openMenu etc.) bleiben identisch zu V23.3