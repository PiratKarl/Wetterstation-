var currentVer = 19.0;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');
var active = false;

var caps = ["Berlin", "Paris", "Rome", "Madrid", "London", "Tokyo", "Washington", "Ottawa", "Stockholm", "Vienna", "Lisbon", "Cairo"];

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
    var vW = document.getElementById('wake-video');
    var aW = document.getElementById('wake-audio');
    vW.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    aW.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="; 
    vW.play().catch(e => {}); aW.play().catch(e => {});

    if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    if(!active) { active = true; loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000); setInterval(checkUpdate, 1800000); }
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var d = ['SO','MO','DI','MI','DO','FR','SA'], m = ['JANUAR','FEBRUAR','MÄRZ','APRIL','MAI','JUNI','JULI','AUGUST','SEPTEMBER','OKTOBER','NOVEMBER','DEZEMBER'];
    document.getElementById('date').innerText = d[now.getDay()] + ". " + now.getDate() + ". " + m[now.getMonth()];
    
    var year=now.getFullYear(), mo=now.getMonth()+1, da=now.getDate(); if(mo<3){year--;mo+=12;}++mo;
    var jd = (365.25*year) + (30.6*mo) + da - 694039.09; jd/=29.53; var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
    document.getElementById('moon').innerText = ["🌑 NEUMOND","🌒 SICHEL","🌓 1. VIERTEL","🌔 ZUN. MOND","🌕 VOLLMOND","🌖 ABN. MOND","🌗 LETZTES V.","🌘 SICHEL"][b];

    // NARRENSICHERE SLEEP-LOGIK
    if(sStart && sEnd) {
        var n = now.getHours()*60 + now.getMinutes();
        var s = parseInt(sStart.split(':')[0])*60 + parseInt(sStart.split(':')[1]);
        var e = parseInt(sEnd.split(':')[0])*60 + parseInt(sEnd.split(':')[1]);
        var isSleep = (s > e) ? (n >= s || n < e) : (n >= s && n < e);
        document.body.className = isSleep ? 'sleep-mode' : '';
    }
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('temp-display').innerText = Math.round(d.main.temp) + "°";
        document.getElementById('weather-status').innerText = d.weather[0].description.toUpperCase();
        document.getElementById('city-title').innerText = d.name.toUpperCase();
        document.getElementById('current-weather-icon').src = d.weather[0].icon + ".gif";
        var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000), s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
        document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
        document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());
        loadWorld(); loadFore(d.coord.lat, d.coord.lon, d.main.temp);
    };
    x.send();
}

function loadWorld() {
    var worldData = "";
    var shuffle = caps.sort(() => 0.5 - Math.random()).slice(0, 10);
    shuffle.forEach(function(c) {
        var x = new XMLHttpRequest(); x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric", false); x.send();
        if(x.status === 200) { var d = JSON.parse(x.responseText); worldData += " ◈ " + d.name.toUpperCase() + ": <img src='" + d.weather[0].icon + ".gif'> " + Math.round(d.main.temp) + "°"; }
    });
    document.getElementById('ticker').innerHTML = worldData;
}

function loadFore(lat, lon, ct) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('main-pop').innerText = "💧"+Math.round(d.list[0].pop * 100)+"%";
        document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.list[0].main.feels_like) + "°";
        document.getElementById('clothes-advice').innerText = (d.list[0].pop > 0.3) ? "🌂 REGENSCHIRM" : (ct < 5 ? "🧥 WINTERJACKE" : (ct < 15 ? "🧥 ÜBERGANGSJACKE" : "👕 T-SHIRT"));
        var h = "<tr>", dy = "<tr>";
        for(var i=0; i<4; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += "<td>"+t.getHours()+" Uhr<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br>"+Math.round(it.main.temp)+"°<span class='t-pop'><br>💧"+Math.round(it.pop*100)+"%</span></td>";
        }
        for(var i=0; i<32; i+=8) {
            var it = d.list[i], day = new Date(it.dt*1000).toLocaleDateString('de-DE',{weekday:'short'}).toUpperCase();
            dy += "<td>"+day+"<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br><span style='color:#ff4444'>"+Math.round(it.main.temp_max)+"°</span> <span style='color:#00eaff'>"+Math.round(it.main.temp_min-2)+"°</span></td>";
        }
        document.getElementById('hourly-table').innerHTML = h + "</tr>"; document.getElementById('daily-table').innerHTML = dy + "</tr>";
    };
    x.send();
}

function openMenu() { document.getElementById('settings-overlay').style.display='flex'; }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showMain() { document.getElementById('menu-main').style.display='flex'; document.getElementById('sub-config').style.display='none'; document.getElementById('sub-donation').style.display='none'; document.getElementById('sub-help').style.display='none'; }
function showSub(id) { document.getElementById('menu-main').style.display='none'; document.getElementById(id).style.display='block'; }
function save() { localStorage.setItem('city', document.getElementById('city-in').value); localStorage.setItem('t-start', document.getElementById('t-start').value); localStorage.setItem('t-end', document.getElementById('t-end').value); location.reload(); }
