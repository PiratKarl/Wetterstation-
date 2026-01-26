// script.js - Korrektur für Vollbild & Logo
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('sStart'), sEnd = localStorage.getItem('sEnd');
var active = false, grace = false;

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display='none';
    
    // VOLLBILD-FIX: Versuche alle bekannten Methoden
    var el = document.documentElement;
    var rfs = el.requestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if(rfs) rfs.call(el);

    var v = document.getElementById('wake-video');
    v.play().catch(function(e){ console.log("Video Play Error", e); });
    
    grace = true; 
    setTimeout(function() { grace = false; }, 60000);

    if(!active) { 
        active = true; 
        loadWeather(); 
        update(); 
        setInterval(update, 1000); 
        setInterval(loadWeather, 600000); 
    }
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var days=['SO','MO','DI','MI','DO','FR','SA'], months=['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
    
    // Mondphasen-Berechnung
    var year=now.getFullYear(), month=now.getMonth()+1, day=now.getDate();
    if(month<3){year--;month+=12;}++month;
    var jd = (365.25*year) + (30.6*month) + day - 694039.09; jd/=29.53; 
    var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
    var p=["🌑 NEUMOND","🌒 ZUN. SICHEL","🌓 1. VIERTEL","🌔 ZUN. MOND","🌕 VOLLMOND","🌖 ABN. MOND","🌗 LETZTES V.","🌘 ABN. SICHEL"];
    document.getElementById('moon').innerText = p[b];

    // Sleep-Logik
    var sleep = false;
    if(sStart && sEnd) {
        var n = now.getHours()*60 + now.getMinutes();
        var s = parseInt(sStart.split(':')[0])*60 + parseInt(sStart.split(':')[1]);
        var e = parseInt(sEnd.split(':')[0])*60 + parseInt(sEnd.split(':')[1]);
        if(s > e) { if(n >= s || n < e) sleep = true; } else { if(n >= s && n < e) sleep = true; }
    }
    if(sleep && !grace) document.getElementById('wake-video').classList.add('sleep-mode');
    else document.getElementById('wake-video').classList.remove('sleep-mode');
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open('GET', 'https://api.openweathermap.org/data/2.5/weather?q='+city+'&appid='+API+'&units=metric&lang=de', true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('temp-display').innerText = Math.round(d.main.temp)+"°";
        document.getElementById('city-title').innerText = d.name.toUpperCase();
        document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.main.feels_like)+"°";
        
        // LOGO UNTER DATUM EINBINDEN
        var ic = d.weather[0].icon;
        document.getElementById('current-icon-container').innerHTML = '<img src="'+ic+'.gif" onerror="this.src=\'https://openweathermap.org/img/wn/'+ic+'@2x.png\'">';
        
        var r = new Date((d.sys.sunrise+d.timezone-3600)*1000), s = new Date((d.sys.sunset+d.timezone-3600)*1000);
        document.getElementById('sunrise').innerText = z(r.getHours())+':'+z(r.getMinutes());
        document.getElementById('sunset').innerText = z(s.getHours())+':'+z(s.getMinutes());

        document.getElementById('ticker').innerText = d.weather[0].description.toUpperCase() + " +++ WIND: " + Math.round(d.wind.speed*3.6) + " KM/H +++ FEUCHTE: " + d.main.humidity + "% +++ DRUCK: " + d.main.pressure + " HPA";
        loadFore(d.coord.lat, d.coord.lon);
    };
    x.send();
}

function loadFore(lat, lon) {
    var x = new XMLHttpRequest();
    x.open('GET', 'https://api.openweathermap.org/data/2.5/forecast?lat='+lat+'&lon='+lon+'&appid='+API+'&units=metric&lang=de', true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        var h = "<tr>", dy = "<tr>";
        for(var i=0; i<5; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += '<td>'+z(t.getHours())+'h<br><img src="'+it.weather[0].icon+'.gif" style="width:5vh;" onerror="this.src=\'https://openweathermap.org/img/wn/'+it.weather[0].icon+'.png\'"><br>'+Math.round(it.main.temp)+'°<br><span class="t-pop">'+Math.round(it.pop*100)+'%</span></td>';
        }
        for(var i=0; i<d.list.length; i+=8) {
            var it = d.list[i], day = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
            dy += '<td>'+day.substr(0,2)+'<br><img src="'+it.weather[0].icon+'.gif" style="width:5vh;" onerror="this.src=\'https://openweathermap.org/img/wn/'+it.weather[0].icon+'.png\'"><br>'+Math.round(it.main.temp)+'°</td>';
        }
        document.getElementById('hourly-table').innerHTML = h + "</tr>";
        document.getElementById('daily-table').innerHTML = dy + "</tr>";
    };
    x.send();
}

function openMenu() { document.getElementById('settings-overlay').style.display='flex'; }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function save() {
    localStorage.setItem('city', document.getElementById('city-in').value);
    localStorage.setItem('sStart', document.getElementById('time-start').value);
    localStorage.setItem('sEnd', document.getElementById('time-end').value);
    location.reload();
}