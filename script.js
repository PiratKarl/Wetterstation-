/* --- AURA V23.6 REPARATUR-MOTOR (Universal Safe) --- */

var currentVer = 23.6;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start') || '--:--', sEnd = localStorage.getItem('t-end') || '--:--';
var lastDataFetch = 0;
var appStarted = false;

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    appStarted = true;
    // FIX: Dashboard erst nach Klick aktivieren (Gegen Symbol-Salat)
    document.getElementById('start-overlay').style.display = 'none';
    var dash = document.getElementsByClassName('dashboard')[0];
    if(dash) dash.style.display = 'flex'; 
    
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
    if(!appStarted) return;
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];

    // Sleep-Logik
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
    var row = document.getElementById('moon-row');
    if(row) row.innerText = mI[b];
}

function loadWorldTicker(prefix) {
    var caps = ["Berlin", "Paris", "London", "Rome", "New York", "Tokyo", "Sydney", "Dubai"];
    var wd = prefix; var done = 0;
    caps.forEach(function(c) { 
        var r = new XMLHttpRequest();
        r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric",true);
        r.onload = function() {
            if(r.status===200) { 
                var j = JSON.parse(r.responseText);
                var utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                var cityTime = new Date(utc + (3600000 * (j.timezone / 3600)));
                var tStr = z(cityTime.getHours()) + ":" + z(cityTime.getMinutes());
                // Name in Cyan, Uhrzeit in Weiss
                wd += " <span class='t-world'> ◈ " + j.name.toUpperCase() + " <span style='color:#ffffff'>" + tStr + "</span> <img class='t-icon' src='" + j.weather[0].icon + ".gif'> " + Math.round(j.main.temp) + "°</span>"; 
            }
            done++; if(done === caps.length) document.getElementById('ticker-text').innerHTML = wd;
        };
        r.send(); 
    });
}

function loadFore(lat, lon, ct) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        if (x.status === 200) {
            var d = JSON.parse(x.responseText);
            document.getElementById('pop').innerText = Math.round(d.list[0].pop * 100)+"%";
            document.getElementById('clothing').innerText = (d.list[0].pop > 0.3) ? "REGENSCHIRM" : (ct < 7 ? "WINTERJACKE" : "T-SHIRT");
            
            var h = "";
            for(var i=0; i<5; i++) {
                var it = d.list[i], t = new Date(it.dt*1000);
                h += "<div class='f-item'><div class='f-head'>" + t.getHours() + " Uhr</div><img class='f-icon' src='" + it.weather[0].icon + ".gif'><div class='f-val'>" + Math.round(it.main.temp) + "°</div></div>";
            }
            document.getElementById('hourly-row').innerHTML = h;

            var days = {};
            d.list.forEach(function(item) {
                var dStr = new Date(item.dt * 1000).toLocaleDateString('de-DE', {weekday: 'short'}).toUpperCase();
                if (!days[dStr]) { days[dStr] = { min: 100, max: -100, icon: item.weather[0].icon }; }
                if (item.main.temp_min < days[dStr].min) days[dStr].min = item.main.temp_min;
                if (item.main.temp_max > days[dStr].max) days[dStr].max = item.main.temp_max;
            });
            var dy = ""; var cnt = 0;
            for (var k in days) { if (cnt >= 5) break;
                dy += "<div class='f-item'><div class='f-head'>" + k + "</div><img class='f-icon' src='" + days[k].icon + ".gif'><div class='f-val'><span style='color:#ff4444'>" + Math.round(days[k].max) + "°</span> <span style='color:#00eaff'>" + Math.round(days[k].min) + "°</span></div></div>";
                cnt++;
            }
            document.getElementById('daily-row').innerHTML = dy;
        }
    };
    x.send();
}

function checkWarnings(lat, lon) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.brightsky.dev/alerts?lat="+lat+"&lon="+lon, true);
    x.onload = function() {
        var txt = "";
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if (data.alerts && data.alerts.length > 0) {
                for(var i=0; i<data.alerts.length; i++) { txt += "<span class='t-warn'> +++ ⚠️ " + data.alerts[i].event_de.toUpperCase() + " ⚠️</span>"; }
            }
        }
        loadWorldTicker(txt);
    };
    x.onerror = function() { loadWorldTicker(""); };
    x.send();
}

function checkUpdate() {
    var x = new XMLHttpRequest();
    x.open("GET", "version.json?n=" + Date.now(), true);
    x.onload = function() { 
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if(data.version > currentVer) { document.getElementById('update-overlay').style.display = 'flex'; }
        }
    };
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