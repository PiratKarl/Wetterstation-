var currentVer = 22.1;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    var de = document.documentElement;
    var fs = de.requestFullscreen || de.webkitRequestFullscreen || de.mozRequestFullScreen || de.msRequestFullscreen;
    if(fs) { fs.call(de); }

    var heartbeat = document.getElementById('logo-heartbeat');
    var wV = document.getElementById('wake-vid');
    var wA = document.getElementById('wake-aud');
    wV.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    wV.play(); wA.play();
    if(heartbeat) { heartbeat.play(); }

    loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000); setInterval(checkUpdate, 1800000);
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];

    // SLEEP LOGIK
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
            document.getElementById('temp').innerText = Math.round(d.main.temp) + "°";
            document.getElementById('w-icon').src = d.weather[0].icon + ".gif";
            document.getElementById('w-desc').innerText = d.weather[0].description.toUpperCase();
            document.getElementById('city-name').innerText = d.name.toUpperCase();
            
            var now = new Date();
            document.getElementById('last-update').innerText = z(now.getDate()) + "." + z(now.getMonth()+1) + "." + now.getFullYear().toString().substr(-2) + " " + z(now.getHours()) + ":" + z(now.getMinutes());

            var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000), s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
            document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
            document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());

            loadFore(d.coord.lat, d.coord.lon, d.main.temp);
            checkWarnings(d.coord.lat, d.coord.lon);
        }
    };
    x.send();
}

function loadFore(lat, lon, ct) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        if (x.status === 200) {
            var d = JSON.parse(x.responseText);
            document.getElementById('pop').innerText = Math.round(d.list[0].pop * 100)+"%";
            document.getElementById('clothing').innerText = (d.list[0].pop > 0.3) ? "REGENSCHIRM" : (ct < 7 ? "WINTERJACKE" : "T-SHIRT");
            // ... (Hourly & Daily Logik wie V22.0)
        }
    };
    x.send();
}

function checkWarnings(lat, lon) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.brightsky.dev/alerts?lat="+lat+"&lon="+lon, true);
    x.onload = function() {
        var warnTxt = "";
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if (data.alerts && data.alerts.length > 0) {
                for(var i=0; i<data.alerts.length; i++) {
                    warnTxt += `<span class='t-warn'> +++ ⚠️ WARNUNG: ${data.alerts[i].event_de.toUpperCase()} ⚠️</span>`;
                }
            }
        }
        loadWorldTicker(warnTxt);
    };
    x.onerror = function() { loadWorldTicker(""); };
    x.send();
}

function loadWorldTicker(prefix) {
    var caps = ["Berlin", "Paris", "London", "Rome", "Madrid", "Vienna", "Warsaw", "Moscow", "Lisbon", "New York", "Los Angeles", "Rio de Janeiro", "Buenos Aires", "Tokyo", "Beijing", "Bangkok", "Sydney", "Dubai", "Cairo", "Cape Town"];
    var wd = prefix; var done = 0;
    caps.forEach(c => { 
        var r = new XMLHttpRequest();
        r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric",true);
        r.onload = function() {
            if(r.status===200) { 
                var j=JSON.parse(r.responseText); 
                wd += `<span class='t-world'> ◈ ${j.name.toUpperCase()}: ${Math.round(j.main.temp)}°</span>`; 
            }
            done++; if(done === caps.length) document.getElementById('ticker-text').innerHTML = wd;
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

function openMenu() { document.getElementById('settings-overlay').style.display='block'; showMain(); }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showSub(id) { document.getElementById('menu-main').style.display='none'; document.getElementById(id).style.display='block'; }
function showMain() { document.getElementById('menu-main').style.display='block'; var s = document.getElementsByClassName('sub-c'); for(var i=0; i<s.length; i++){s[i].style.display='none';} }
function save() { 
    localStorage.setItem('city', document.getElementById('city-in').value); 
    localStorage.setItem('t-start', document.getElementById('t-start').value); 
    localStorage.setItem('t-end', document.getElementById('t-end').value); 
    location.reload(); 
}