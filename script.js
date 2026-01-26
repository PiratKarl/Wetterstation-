var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart'), sEnd = localStorage.getItem('sleepEnd');
var active = false, grace = false;

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display='none';
    var el = document.documentElement;
    if(el.requestFullscreen) el.requestFullscreen();
    else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    document.getElementById('wake-video').play().catch(e=>{});
    grace = true; setTimeout(() => { grace = false; }, 60000);
    if(!active) { active=true; loadWeather(); update(); setInterval(update,1000); setInterval(loadWeather,600000); }
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var days=['SO','MO','DI','MI','DO','FR','SA'], months=['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
    document.getElementById('date').innerText = days[now.getDay()] + ", " + now.getDate() + ". " + months[now.getMonth()];
    
    var year=now.getFullYear(), month=now.getMonth()+1, day=now.getDate();
    if(month<3){year--;month+=12;}++month;
    var jd = (365.25*year) + (30.6*month) + day - 694039.09; jd/=29.53; var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
    var p=["🌑 NEUMOND","🌒 ZUN. SICHEL","🌓 1. VIERTEL","🌔 ZUN. MOND","🌕 VOLLMOND","🌖 ABN. MOND","🌗 LETZTES V.","🌘 ABN. SICHEL"];
    document.getElementById('moon').innerText = p[b];

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
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API}&units=metric&lang=de`)
    .then(r => r.json()).then(d => {
        document.getElementById('temp-display').innerText = Math.round(d.main.temp)+"°";
        document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
        document.getElementById('city-title').innerText = d.name.toUpperCase();
        var ic = d.weather[0].icon;
        document.getElementById('current-weather-icon').src = ic + ".gif";
        var sunrise = new Date((d.sys.sunrise + d.timezone - 3600) * 1000);
        var sunset = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
        document.getElementById('sunrise').innerText = z(sunrise.getHours()) + ":" + z(sunrise.getMinutes());
        document.getElementById('sunset').innerText = z(sunset.getHours()) + ":" + z(sunset.getMinutes());
        document.getElementById('ticker').innerText = `${d.weather[0].description.toUpperCase()} +++ WIND: ${Math.round(d.wind.speed*3.6)} KM/H +++ FEUCHTE: ${d.main.humidity}% +++ DRUCK: ${d.main.pressure} HPA`;
        loadFore(d.coord.lat, d.coord.lon);
    });
}

function loadFore(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API}&units=metric&lang=de`)
    .then(r => r.json()).then(d => {
        var h = "<tr>", dy = "<tr>";
        for(var i=0; i<4; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += `<td>${z(t.getHours())}h<br><img class="t-icon" src="${it.weather[0].icon}.gif"><br>${Math.round(it.main.temp)}°<br><span class="t-pop">${Math.round(it.pop*100)}%</span></td>`;
        }
        for(var i=0; i<32; i+=8) {
            var it = d.list[i], day = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
            dy += `<td>${day.substr(0,2)}<br><img class="t-icon" src="${it.weather[0].icon}.gif"><br>${Math.round(it.main.temp)}°</td>`;
        }
        document.getElementById('hourly-table').innerHTML = h + "</tr>";
        document.getElementById('daily-table').innerHTML = dy + "</tr>";
    });
}

function openMenu() { document.getElementById('settings-overlay').style.display='flex'; }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function save() {
    localStorage.setItem('city', document.getElementById('city-in').value);
    localStorage.setItem('sleepStart', document.getElementById('time-start').value);
    localStorage.setItem('sleepEnd', document.getElementById('time-end').value);
    location.reload();
}
