var currentVer = 17.0; // Aktuelle Version
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart'), sEnd = localStorage.getItem('sleepEnd');
var active = false, grace = false;
var worldCities = ["New York", "Sydney", "Cape Town", "San Francisco", "Hong Kong", "Tokyo", "Berlin", "London"];
var worldData = "";

function z(n){return (n<10?'0':'')+n;}

// AUTO-UPDATE WÄCHTER
function checkUpdate() {
    var x = new XMLHttpRequest();
    // Cache-Busting für die Versionsprüfung
    x.open("GET", "version.json?nocache=" + new Date().getTime(), true);
    x.onload = function() {
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if (data.version > currentVer) {
                console.log("Neue Version gefunden: " + data.version);
                // Kleiner Puffer, damit nicht mitten in einer Wetterabfrage neugeladen wird
                setTimeout(function(){ location.reload(true); }, 5000);
            }
        }
    };
    x.send();
}

function startApp() {
    document.getElementById('start-overlay').style.display='none';
    var el = document.documentElement;
    if(el.requestFullscreen) el.requestFullscreen();
    else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    document.getElementById('wake-video').play().catch(function(e){});
    grace = true; setTimeout(function(){ grace = false; }, 60000);
    if(!active) { 
        active=true; 
        initStatusHandlers();
        loadWeather(); 
        loadWorldWeather();
        update(); 
        setInterval(update, 1000); 
        setInterval(loadWeather, 600000); 
        setInterval(loadWorldWeather, 1800000);
        setInterval(checkUpdate, 1800000); // Prüfe alle 30 Min auf Updates
    }
}

// RESTLICHE LOGIK (Batterie, Wetter, Moon etc.) - Identisch zu V16
function initStatusHandlers() {
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            updateBattery(battery);
            battery.addEventListener('levelchange', function(){ updateBattery(battery); });
            battery.addEventListener('chargingchange', function(){ updateBattery(battery); });
        });
    }
}
function updateStatus() { var wifi = document.getElementById('wifi-icon'); wifi.className = navigator.onLine ? "online" : "offline"; }
function updateBattery(bat) { document.getElementById('bat-box').style.display = 'flex'; document.getElementById('bat-level').innerText = Math.round(bat.level * 100) + "%"; document.getElementById('bat-icon').innerText = bat.charging ? "⚡" : "🔋"; }
function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var days = ['So.','Mo.','Di.','Mi.','Do.','Fr.','Sa.'], months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    document.getElementById('date').innerText = days[now.getDay()] + " " + now.getDate() + ". " + months[now.getMonth()] + " " + now.getFullYear();
    var year=now.getFullYear(), month=now.getMonth()+1, day=now.getDate(); if(month<3){year--;month+=12;}++month;
    var jd = (365.25*year) + (30.6*month) + day - 694039.09; jd/=29.53; var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
    document.getElementById('moon').innerText = ["🌑 NEUMOND","🌒 ZUN. SICHEL","🌓 1. VIERTEL","🌔 ZUN. MOND","🌕 VOLLMOND","🌖 ABN. MOND","🌗 LETZTES V.","🌘 ABN. SICHEL"][b];
    var sleep = false;
    if(sStart && sEnd) {
        var n = now.getHours()*60 + now.getMinutes(), s = parseInt(sStart.split(':')[0])*60 + parseInt(sStart.split(':')[1]), e = parseInt(sEnd.split(':')[0])*60 + parseInt(sEnd.split(':')[1]);
        if(s > e) { if(n >= s || n < e) sleep = true; } else { if(n >= s && n < e) sleep = true; }
    }
    if(sleep && !grace) document.getElementById('wake-video').classList.add('sleep-mode');
    else document.getElementById('wake-video').classList.remove('sleep-mode');
}
function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('temp-display').innerText = Math.round(d.main.temp) + "°";
        document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
        document.getElementById('city-title').innerText = d.name.toUpperCase();
        document.getElementById('current-weather-icon').src = d.weather[0].icon + ".gif";
        var rT = new Date((d.sys.sunrise + d.timezone - 3600) * 1000), sT = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
        document.getElementById('sunrise').innerText = z(rT.getHours()) + ":" + z(rT.getMinutes());
        document.getElementById('sunset').innerText = z(sT.getHours()) + ":" + z(sT.getMinutes());
        loadFore(d.coord.lat, d.coord.lon, d.main.temp, d.weather[0].description.toUpperCase());
    };
    x.send();
}
function loadWorldWeather() {
    worldData = "";
    worldCities.forEach(function(c) {
        var x = new XMLHttpRequest();
        x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric&lang=de", true);
        x.onload = function() {
            var d = JSON.parse(x.responseText);
            worldData += " +++ " + d.name.toUpperCase() + ": " + Math.round(d.main.temp) + "°";
        };
        x.send();
    });
}
function loadFore(lat, lon, currentTemp, currentDesc) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        var h = "<tr>", dy = "<tr>", rainNext = Math.round(d.list[0].pop * 100);
        var temps = [22, 15, 5], clothes = ["👕 T-SHIRT WETTER", "🧥 ÜBERGANGSJACKE", "🧥 DICKE WINTERJACKE"];
        var advice = (rainNext > 30) ? "🌂 REGENSCHIRM EINPACKEN" : (currentTemp < 5 ? clothes[2] : (currentTemp < 15 ? clothes[1] : clothes[0]));
        document.getElementById('clothes-advice').innerText = advice;
        for(var i=0; i<4; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += "<td>"+z(t.getHours())+"h<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br>"+Math.round(it.main.temp)+"°<br><span class='t-pop'>💧"+Math.round(it.pop*100)+"%</span></td>";
        }
        for(var i=0; i<32; i+=8) {
            var it = d.list[i], day = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
            dy += "<td>"+day.substr(0,2)+"<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br><span class='temp-max'>"+Math.round(it.main.temp_max)+"°</span> <span class='temp-min'>"+Math.round(it.main.temp_min-2)+"°</span><br><span class='t-pop'>💧"+Math.round(it.pop*100)+"%</span></td>";
        }
        document.getElementById('hourly-table').innerHTML = h + "</tr>"; document.getElementById('daily-table').innerHTML = dy + "</tr>";
        document.getElementById('ticker').innerText = currentDesc + " +++ REGEN: " + rainNext + "% +++ WIND: " + Math.round(d.list[0].wind.speed*3.6) + " KM/H" + worldData;
    };
    x.send();
}
function openMenu() { document.getElementById('city-in').value = city; document.getElementById('time-start').value = sStart || ""; document.getElementById('time-end').value = sEnd || ""; showMain(); document.getElementById('settings-overlay').style.display='flex'; }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showMain() { document.getElementById('menu-main').style.display = 'flex'; var subs = document.getElementsByClassName('sub-content'); for(var i=0; i<subs.length; i++) subs[i].style.display = 'none'; }
function showSub(id) { document.getElementById('menu-main').style.display = 'none'; document.getElementById(id).style.display = 'flex'; }
function save() { localStorage.setItem('city', document.getElementById('city-in').value); localStorage.setItem('sleepStart', document.getElementById('time-start').value); localStorage.setItem('sleepEnd', document.getElementById('time-end').value); location.reload(); }
