var currentVer = 22.4;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    var de = document.documentElement;
    if (de.requestFullscreen) { de.requestFullscreen(); } else if (de.webkitRequestFullscreen) { de.webkitRequestFullscreen(); }

    var heartbeat = document.getElementById('logo-heartbeat');
    var wA = document.getElementById('wake-aud');
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    wA.play();
    if(heartbeat) { heartbeat.play(); }

    loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000);
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
        if (x.status === 200) {
            var d = JSON.parse(x.responseText);
            document.getElementById('city-name').innerText = d.name.toUpperCase();
            document.getElementById('temp').innerText = Math.round(d.main.temp) + "°";
            document.getElementById('w-icon').src = d.weather[0].icon + ".gif";
            document.getElementById('w-desc').innerText = d.weather[0].description.toUpperCase();
            var now = new Date();
            document.getElementById('last-update').innerText = z(now.getDate()) + "." + z(now.getMonth()+1) + "." + now.getFullYear().toString().substr(-2) + " um " + z(now.getHours()) + ":" + z(now.getMinutes()) + " Uhr";
            var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000), s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
            document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
            document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());
            // Mond & Vorhersage & Warnung wie bisher...
            loadFore(d.coord.lat, d.coord.lon, d.main.temp);
            checkWarnings(d.coord.lat, d.coord.lon);
        }
    };
    x.send();
}

function loadWorldTicker(prefix) {
    var caps = ["Berlin", "Paris", "London", "Rome", "Madrid", "Vienna", "Warsaw", "Moscow", "Lisbon", "New York", "Los Angeles", "Rio de Janeiro", "Buenos Aires", "Tokyo", "Beijing", "Bangkok", "Sydney", "Dubai", "Cairo", "Cape Town"];
    var wd = prefix; var done = 0;
    caps.forEach(c => { 
        var r = new XMLHttpRequest();
        r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric",true);
        r.onload = function() {
            if(r.status===200) { var j=JSON.parse(r.responseText); wd += `<span class='t-world'> ◈ ${j.name.toUpperCase()}: ${Math.round(j.main.temp)}°</span>`; }
            done++; if(done === caps.length) document.getElementById('ticker-text').innerHTML = wd;
        };
        r.send(); 
    });
}
// ... (Hilfsfunktionen showSub, save etc.)