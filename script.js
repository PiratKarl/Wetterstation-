var currentVer = 18.4;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');
var active = false, worldData = "";

var capitals = ["Berlin", "Paris", "Rome", "Madrid", "London", "Tokyo", "Washington", "Ottawa", "Canberra", "Brasilia", "Stockholm", "Oslo"];

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
    var v = document.getElementById('wake-video');
    v.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    v.play().catch(function(e){});
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

    var sleep = false;
    if(sStart && sEnd) {
        var n = now.getHours()*60 + now.getMinutes(), s = parseInt(sStart.split(':')[0])*60 + parseInt(sStart.split(':')[1]), e = parseInt(sEnd.split(':')[0])*60 + parseInt(sEnd.split(':')[1]);
        if(s > e) { if(n >= s || n < e) sleep = true; } else { if(n >= s && n < e) sleep = true; }
    }
    document.getElementById('wake-video').className = sleep ? 'sleep-mode' : '';
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('temp-display').innerText = Math.round(d.main.temp) + "°";
        document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
        document.getElementById('weather-status').innerText = d.weather[0].description.toUpperCase();
        document.getElementById('city-title').innerText = d.name.toUpperCase();
        document.getElementById('current-weather-icon').src = d.weather[0].icon + ".gif";
        var r = new Date((d.sys.sunrise + d.timezone - 3600)*1000), s = new Date((d.sys.sunset + d.timezone - 3600)*1000);
        document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
        document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());
        var n = new Date(); document.getElementById('up-date').innerText = z(n.getDate())+"."+z(n.getMonth()+1); document.getElementById('up-time').innerText = z(n.getHours())+":"+z(n.getMinutes());
        loadWorld(); loadFore(d.coord.lat, d.coord.lon, d.main.temp);
    };
    x.send();
}

function loadWorld() {
    worldData = "";
    capitals.forEach(function(c) {
        var x = new XMLHttpRequest();
        x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric", false);
        x.send();
        if(x.status === 200) {
            var d = JSON.parse(x.responseText);
            worldData += " ◈ " + d.name.toUpperCase() + ": <img src='" + d.weather[0].icon + ".gif'> " + Math.round(d.main.temp) + "°";
        }
    });
}

function loadFore(lat, lon, ct) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText), rN = Math.round(d.list[0].pop * 100);
        document.getElementById('main-pop').innerText = "💧"+rN+"%";
        document.getElementById('clothes-advice').innerText = rN > 30 ? "🌂 REGENSCHIRM" : (ct < 5 ? "🧥 WINTERJACKE" : (ct < 15 ? "🧥 ÜBERGANGSJACKE" : "👕 T-SHIRT"));
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
        document.getElementById('ticker').innerHTML = d.list[0].weather[0].description.toUpperCase() + " +++ WIND: " + Math.round(d.list[0].wind.speed*3.6) + " KM/H" + worldData;
    };
    x.send();
}

function openMenu() { document.getElementById('settings-overlay').style.display='flex'; showMain(); }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showMain() { document.getElementById('menu-main').style.display='flex'; var s=document.getElementsByClassName('sub-content'); for(var i=0; i<s.length; i++) s[i].style.display='none'; }
function showSub(id) { document.getElementById('menu-main').style.display='none'; document.getElementById(id).style.display='block'; }
function save() { localStorage.setItem('city', document.getElementById('city-in').value); localStorage.setItem('t-start', document.getElementById('t-start').value); localStorage.setItem('t-end', document.getElementById('t-end').value); location.reload(); }

if(navigator.getBattery) navigator.getBattery().then(function(b){ var f = function(){ document.getElementById('bat-box').style.display='block'; document.getElementById('bat-lv').innerText=Math.round(b.level*100)+"%"; }; f(); b.onlevelchange=f; });
