var currentVer = 20.1;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    var wV = document.getElementById('wake-vid');
    var sV = document.getElementById('sleep-vid');
    
    // Transparenter Wachhalter & Schwarzer Schlaf-Film
    wV.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    sV.src = "https://github.com/intel-iot-devkit/sample-videos/raw/master/black.mp4";
    
    wV.play();
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
        if(isSleep) { 
            if(sV.style.display !== 'block') { sV.style.display = 'block'; sV.play(); } 
        } else { 
            sV.style.display = 'none'; sV.pause(); 
        }
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

        // Mondphase
        var year=new Date().getFullYear(), mo=new Date().getMonth()+1, da=new Date().getDate(); if(mo<3){year--;mo+=12;}++mo;
        var jd = (365.25*year) + (30.6*mo) + da - 694039.09; jd/=29.53; var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
        var moonTxt = ["NEUMOND","SICHEL","1. VIERTEL","ZUN. MOND","VOLLMOND","ABN. MOND","3. VIERTEL","SICHEL"];
        document.getElementById('moon-txt').innerText = moonTxt[b];

        loadFore(d.coord.lat, d.coord.lon, d.main.temp);
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

        var h = "", dy = "";
        for(var i=0; i<4; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += `<div class='f-item'>${t.getHours()}h<br><img class='f-icon' src='${it.weather[0].icon}.gif'><br>${Math.round(it.main.temp)}°</div>`;
        }
        for(var i=0; i<32; i+=8) {
            var it = d.list[i], day = new Date(it.dt*1000).toLocaleDateString('de-DE',{weekday:'short'});
            dy += `<div class='f-item'>${day.toUpperCase()}<br><img class='f-icon' src='${it.weather[0].icon}.gif'><br><span style='color:#ff4444'>${Math.round(it.main.temp_max)}°</span> <span style='color:#00eaff'>${Math.round(it.main.temp_min)}°</span></div>`;
        }
        document.getElementById('hourly-row').innerHTML = h;
        document.getElementById('daily-row').innerHTML = dy;

        // Ticker
        var caps = ["Berlin", "Paris", "Rome", "London", "Tokyo", "Cairo"]; var wd = "";
        caps.forEach(c => { var r=new XMLHttpRequest(); r.open("GET","https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric",false); r.send(); if(r.status===200){var j=JSON.parse(r.responseText); wd+=` ◈ ${j.name.toUpperCase()}: <img src='${j.weather[0].icon}.gif'> ${Math.round(j.main.temp)}°`;} });
        document.getElementById('ticker-text').innerHTML = wd;
    };
    x.send();
}

function openMenu() { document.getElementById('settings-overlay').style.display='block'; showMain(); }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showMain() { document.getElementById('menu-main').style.display='block'; var s=document.getElementsByClassName('sub-c'); for(var i=0; i<s.length; i++) s[i].style.display='none'; }
function showSub(id) { document.getElementById('menu-main').style.display='none'; document.getElementById(id).style.display='block'; }
function save() { localStorage.setItem('city', document.getElementById('city-in').value); localStorage.setItem('t-start', document.getElementById('t-start').value); localStorage.setItem('t-end', document.getElementById('t-end').value); location.reload(); }