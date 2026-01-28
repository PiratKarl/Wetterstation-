var currentVer = 21.3;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');

function z(n){return (n<10?'0':'')+n;}

function checkUpdate() {
    var x = new XMLHttpRequest();
    x.open("GET", "version.json?n=" + Date.now(), true);
    x.onload = function() {
        if (x.status === 200 && JSON.parse(x.responseText).version > currentVer) {
            document.getElementById('update-overlay').style.display = 'flex';
        }
    };
    x.send();
}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    var elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen(); } 
    else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } 

    var wV = document.getElementById('wake-vid');
    var sV = document.getElementById('sleep-vid');
    var wA = document.getElementById('wake-aud');
    
    wV.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    sV.src = "https://github.com/intel-iot-devkit/sample-videos/raw/master/black.mp4";
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

    wV.play(); wA.volume = 1.0; wA.play();

    loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000); setInterval(checkUpdate, 1800000);
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];

    if(sStart && sEnd) {
        var n = now.getHours()*60 + now.getMinutes();
        var s = parseInt(sStart.split(':')[0])*60 + parseInt(sStart.split(':')[1]);
        var e = parseInt(sEnd.split(':')[0])*60 + parseInt(sEnd.split(':')[1]);
        var isSleep = (s > e) ? (n >= s || n < e) : (n >= s && n < e);
        var sV = document.getElementById('sleep-vid');
        if(isSleep) { if(sV.style.display !== 'block') { sV.style.display = 'block'; sV.play(); } } else { sV.style.display = 'none'; sV.pause(); }
    }
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('city-name').innerText = d.name.toUpperCase();
        document.getElementById('temp').innerText = Math.round(d.main.temp) + "°";
        document.getElementById('w-icon').src = d.weather[0].icon + ".gif";
        document.getElementById('w-desc').innerText = d.weather[0].description;
        document.getElementById('w-feels').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
        var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000);
        var s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
        document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
        document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());

        var year=new Date().getFullYear(), mo=new Date().getMonth()+1, da=new Date().getDate(); if(mo<3){year--;mo+=12;}++mo;
        var jd = (365.25*year) + (30.6*mo) + da - 694039.09; jd/=29.53; var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
        var moonTxt = ["NEUMOND","SICHEL","1. VIERTEL","ZUN. MOND","VOLLMOND","ABN. MOND","3. VIERTEL","SICHEL"];
        var moonIco = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
        document.getElementById('moon-txt').innerText = moonTxt[b];
        document.getElementById('moon-icon').innerText = moonIco[b];

        loadFore(d.coord.lat, d.coord.lon, d.main.temp);
        checkWarnings(d.coord.lat, d.coord.lon);
    };
    x.send();
}

// NEUE INTELLIGENTE BERECHNUNG
function loadFore(lat, lon, ct) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('pop').innerText = Math.round(d.list[0].pop * 100)+"%";
        document.getElementById('clothing').innerText = (d.list[0].pop > 0.3) ? "REGENSCHIRM" : (ct < 7 ? "WINTERJACKE" : "T-SHIRT");

        // STUNDEN (Einfach die nächsten 5)
        var h = "";
        for(var i=0; i<5; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += `<div class='f-item'>${t.getHours()} Uhr<br><img class='f-icon' src='${it.weather[0].icon}.gif'><br>${Math.round(it.main.temp)}°</div>`;
        }
        document.getElementById('hourly-row').innerHTML = h;

        // TAGE: Echte Berechnung von Min/Max
        // Wir gruppieren die Daten nach Tag (Datum String)
        var days = {};
        d.list.forEach(function(item) {
            var date = new Date(item.dt * 1000);
            var dateStr = date.toLocaleDateString('de-DE', {weekday: 'short'}).toUpperCase();
            
            if (!days[dateStr]) {
                days[dateStr] = { min: 100, max: -100, icon: item.weather[0].icon, count: 0 };
            }
            // Wir suchen den niedrigsten und höchsten Wert des Tages
            if (item.main.temp_min < days[dateStr].min) days[dateStr].min = item.main.temp_min;
            if (item.main.temp_max > days[dateStr].max) days[dateStr].max = item.main.temp_max;
            
            // Icon von Mittags (ca. 12 Uhr) nehmen, wenn möglich
            if (date.getHours() >= 11 && date.getHours() <= 14) {
                days[dateStr].icon = item.weather[0].icon;
            }
        });

        var dy = "";
        var count = 0;
        // Die gesammelten Tage anzeigen (Maximal 5)
        for (var key in days) {
            if (count >= 5) break;
            var dayData = days[key];
            dy += `<div class='f-item'>${key}<br><img class='f-icon' src='${dayData.icon}.gif'><br><span style='color:#ff4444'>${Math.round(dayData.max)}°</span> <span style='color:#00eaff'>${Math.round(dayData.min)}°</span></div>`;
            count++;
        }
        document.getElementById('daily-row').innerHTML = dy;
    };
    x.send();
}

// 20 STÄDTE + ANTI-HÄNGER
var worldCaps = ["Berlin", "Paris", "London", "Rome", "Madrid", "Vienna", "Warsaw", "Moscow", "Lisbon", "New York", "Los Angeles", "Rio de Janeiro", "Buenos Aires", "Tokyo", "Beijing", "Bangkok", "Sydney", "Dubai", "Cairo", "Cape Town"];

function checkWarnings(lat, lon) {
    var warningHTML = "";
    var timeout = setTimeout(function() { loadWorldTicker(""); }, 3000); // Notbremse

    var x = new XMLHttpRequest();
    x.open("GET", "https://api.brightsky.dev/alerts?lat="+lat+"&lon="+lon, true);
    x.onload = function() {
        clearTimeout(timeout);
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if (data.alerts && data.alerts.length > 0) {
                for(var i=0; i<data.alerts.length; i++) {
                    warningHTML += "<span class='warn-blink'> +++ ⚠️ WARNUNG: " + data.alerts[i].event_de.toUpperCase() + " (" + data.alerts[i].headline_de + ") ⚠️</span>";
                }
            }
        }
        loadWorldTicker(warningHTML);
    };
    x.onerror = function() { clearTimeout(timeout); loadWorldTicker(""); };
    x.send();
}

function loadWorldTicker(prefix) {
    var wd = prefix || "";
    function loadNextCity(i) {
        if (i >= worldCaps.length) { document.getElementById('ticker-text').innerHTML = wd; return; }
        var r = new XMLHttpRequest();
        r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+worldCaps[i]+"&appid="+API+"&units=metric",true);
        r.onload = function() {
            if(r.status===200) { var j=JSON.parse(r.responseText); wd += ` ◈ ${j.name.toUpperCase()}: <img src='${j.weather[0].icon}.gif'> ${Math.round(j.main.temp)}°`; }
            loadNextCity(i+1);
        };
        r.onerror = function() { loadNextCity(i+1); };
        r.send();
    }
    loadNextCity(0);
}

function openMenu() { document.getElementById('settings-overlay').style.display='block'; showMain(); }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showMain() { document.getElementById('menu-main').style.display='block'; var s=document.getElementsByClassName('sub-c'); for(var i=0; i<s.length; i++) s[i].style.display='none'; }
function showSub(id) { document.getElementById('menu-main').style.display='none'; document.getElementById(id).style.display='block'; }
function save() { localStorage.setItem('city', document.getElementById('city-in').value); localStorage.setItem('t-start', document.getElementById('t-start').value); localStorage.setItem('t-end', document.getElementById('t-end').value); location.reload(); }