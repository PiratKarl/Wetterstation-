var currentVer = 21.8;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    
    // ROBUSTER VOLLBILD-FIX
    var de = document.documentElement;
    if (de.requestFullscreen) { de.requestFullscreen(); }
    else if (de.webkitRequestFullscreen) { de.webkitRequestFullscreen(); }
    else if (de.mozRequestFullScreen) { de.mozRequestFullScreen(); }
    else if (de.msRequestFullscreen) { de.msRequestFullscreen(); }

    // Wachhalter & Logo starten
    var wV = document.getElementById('wake-vid');
    var wA = document.getElementById('wake-aud');
    var heartbeat = document.getElementById('logo-heartbeat');
    
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
        var days = {};
        d.list.forEach(function(item) {
            var dateStr = new Date(item.dt * 1000).toLocaleDateString('de-DE', {weekday: 'short'}).toUpperCase();
            if (!days[dateStr]) { days[dateStr] = { min: 100, max: -100, icon: item.weather[0].icon }; }
            if (item.main.temp_min < days[dateStr].min) days[dateStr].min = item.main.temp_min;
            if (item.main.temp_max > days[dateStr].max) days[dateStr].max = item.main.temp_max;
        });
        var dy = ""; var cnt = 0;
        for (var k in days) { if (cnt >= 5) break;
            dy += `<div class='f-item'><div class='f-head'>${k}</div><img class='f-icon' src='${days[k].icon}.gif'><div class='f-val'><span style='color:#ff4444'>${Math.round(days[k].max)}°</span> <span style='color:#00eaff'>${Math.round(days[k].min)}°</span></div></div>`;
            cnt++;
        }
        document.getElementById('daily-row').innerHTML = dy;
    };
    x.send();
}

var worldCaps = ["Berlin", "Paris", "London", "Rome", "Madrid", "Vienna", "Warsaw", "Moscow", "Lisbon", "New York", "Los Angeles", "Rio de Janeiro", "Buenos Aires", "Tokyo", "Beijing", "Bangkok", "Sydney", "Dubai", "Cairo", "Cape Town"];

function checkWarnings(lat, lon) {
    var x = new XMLHttpRequest();
    var timeout = setTimeout(function() { loadWorldTicker(""); }, 3000);
    x.open("GET", "https://api.brightsky.dev/alerts?lat="+lat+"&lon="+lon, true);
    x.onload = function() {
        clearTimeout(timeout); var txt = "";
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if (data.alerts && data.alerts.length > 0) {
                for(var i=0; i<data.alerts.length; i++) { txt += "<span class='warn-blink'> +++ ⚠️ WARNUNG: " + data.alerts[i].event_de.toUpperCase() + " (" + data.alerts[i].headline_de + ") ⚠️</span>"; }
            }
        }
        loadWorldTicker(txt);
    };
    x.onerror = function() { loadWorldTicker(""); };
    x.send();
}

function loadWorldTicker(prefix) {
    var wd = prefix || ""; var done = 0;
    worldCaps.forEach(c => { 
        var r = new XMLHttpRequest();
        r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric",true);
        r.onload = function() {
            if(r.status===200) { var j=JSON.parse(r.responseText); wd += ` ◈ ${j.name.toUpperCase()}: ${Math.round(j.main.temp)}°`; }
            done++; if(done === worldCaps.length) document.getElementById('ticker-text').innerHTML = wd;
        };
        r.send(); 
    });
}

function checkUpdate() {
    var x = new XMLHttpRequest();
    x.open("GET", "version.json?n=" + Date.now(), true);
    x.onload = function() { if (x.status === 200 && JSON.parse(x.responseText).version > currentVer) document.getElementById('update-overlay').style.display = 'flex'; };
    x.send();
}

function openMenu() { document.getElementById('settings-overlay').style.display='block'; }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showSub(id) { document.getElementById('menu-main').style.display='none'; document.getElementById(id).style.display='block'; }
function showMain() { document.getElementById('menu-main').style.display='block'; var s = document.getElementsByClassName('sub-c'); for(var i=0; i<s.length; i++){s[i].style.display='none';} }
function save() { localStorage.setItem('city', document.getElementById('city-in').value); location.reload(); }