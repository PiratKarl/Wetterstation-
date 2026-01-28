var currentVer = 21.9;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    
    // VOLLBILD-COMMANDO VERSCHÄRFT
    var de = document.documentElement;
    var fs = de.requestFullscreen || de.webkitRequestFullscreen || de.mozRequestFullScreen || de.msRequestFullscreen;
    if(fs) { fs.call(de); }

    var heartbeat = document.getElementById('logo-heartbeat');
    var wV = document.getElementById('wake-vid');
    var wA = document.getElementById('wake-aud');
    
    wV.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

    wV.play(); wA.volume = 1.0; wA.play();
    if(heartbeat) { heartbeat.play(); }

    loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000); setInterval(checkUpdate, 1800000);
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('city-name').innerText = d.name.toUpperCase();
        document.getElementById('temp').innerText = Math.round(d.main.temp) + "°";
        document.getElementById('w-icon').src = d.weather[0].icon + ".gif";
        document.getElementById('w-desc').innerText = d.weather[0].description.toUpperCase();
        document.getElementById('w-feels').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
        
        var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000), s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
        document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
        document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());

        // ZEITSTEMPEL AKTUALISIEREN
        var now = new Date();
        var ts = "aktualisiert am " + z(now.getDate()) + "." + z(now.getMonth()+1) + "." + now.getFullYear().toString().substr(-2) + " um " + z(now.getHours()) + ":" + z(now.getMinutes()) + " Uhr";
        document.getElementById('last-update').innerText = ts;

        // MOND BERECHNEN
        var year=now.getFullYear(), mo=now.getMonth()+1, da=now.getDate(); if(mo<3){year--;mo+=12;}++mo;
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

// ... Rest (loadFore mit Min/Max, checkWarnings, loadWorldTicker mit 20 Städten) identisch zu V21.8 ...