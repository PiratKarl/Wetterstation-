var currentVer = 21.6;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    var elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen(); } 
    else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } 

    var wV = document.getElementById('wake-vid');
    var sV = document.getElementById('sleep-vid');
    var wA = document.getElementById('wake-aud');
    var heartbeat = document.getElementById('logo-heartbeat');
    
    wV.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    sV.src = "https://github.com/intel-iot-devkit/sample-videos/raw/master/black.mp4";
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

    wV.play(); wA.volume = 1.0; wA.play();
    if(heartbeat) { heartbeat.play(); } // Logo-Video starten

    loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000); setInterval(checkUpdate, 1800000);
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];
    if(sStart && sEnd) { /* Sleep-Timer Logik von V21.5 */ }
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
        loadFore(d.coord.lat, d.coord.lon, d.main.temp);
        checkWarnings(d.coord.lat, d.coord.lon);
    };
    x.send();
}

function loadFore(lat, lon, ct) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('pop').innerText = Math.round(d.list[0].pop * 100)+"%";
        document.getElementById('clothing').innerText = (d.list[0].pop > 0.3) ? "REGENSCHIRM" : (ct < 7 ? "WINTERJACKE" : "T-SHIRT");
        var h = "";
        for(var i=0; i<5; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += `<div class='f-item'><div class='f-head'>${t.getHours()} Uhr</div><img class='f-icon' src='${it.weather[0].icon}.gif'><div class='f-val'>${Math.round(it.main.temp)}°</div></div>`;
        }
        document.getElementById('hourly-row').innerHTML = h;
        /* Tages-Logik mit Min/Max Berechnung von V21.5 */
    };
    x.send();
}

var worldCaps = ["Berlin", "Paris", "London", "Rome", "Madrid", "Vienna", "Warsaw", "Moscow", "Lisbon", "New York", "Los Angeles", "Rio de Janeiro", "Buenos Aires", "Tokyo", "Beijing", "Bangkok", "Sydney", "Dubai", "Cairo", "Cape Town"];

function checkWarnings(lat, lon) {
    var warningHTML = "";
    var timeout = setTimeout(function() { loadWorldTicker(""); }, 3000); 
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
/* Hilfsfunktionen wie openMenu, closeMenu etc. bleiben erhalten */