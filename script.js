var currentVer = 22.3;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';

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

            // Mond
            var year=now.getFullYear(), mo=now.getMonth()+1, da=now.getDate(); if(mo<3){year--;mo+=12;}++mo;
            var jd = (365.25*year) + (30.6*mo) + da - 694039.09; jd/=29.53; var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
            var moonTxt = ["NEUMOND","SICHEL","1. VIERTEL","ZUN. MOND","VOLLMOND","ABN. MOND","3. VIERTEL","SICHEL"];
            var moonIco = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
            document.getElementById('moon-txt').innerText = moonTxt[b];
            document.getElementById('moon-icon').innerText = moonIco[b];

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
            
            var h = "";
            for(var i=0; i<5; i++) {
                var it = d.list[i], t = new Date(it.dt*1000);
                h += `<div class='f-item'><div class='f-head'>${t.getHours()} Uhr</div><img class='f-icon' src='${it.weather[0].icon}.gif'><div class='f-val'>${Math.round(it.main.temp)}°</div></div>`;
            }
            document.getElementById('hourly-row').innerHTML = h;

            var days = {};
            d.list.forEach(function(item) {
                var dStr = new Date(item.dt * 1000).toLocaleDateString('de-DE', {weekday: 'short'}).toUpperCase();
                if (!days[dStr]) { days[dStr] = { min: 100, max: -100, icon: item.weather[0].icon }; }
                if (item.main.temp_min < days[dStr].min) days[dStr].min = item.main.temp_min;
                if (item.main.temp_max > days[dStr].max) days[dateStr].max = item.main.temp_max;
            });
            var dy = ""; var cnt = 0;
            for (var k in days) { if (cnt >= 5) break;
                dy += `<div class='f-item'><div class='f-head'>${k}</div><img class='f-icon' src='${days[k].icon}.gif'><div class='f-val'><span style='color:#ff4444'>${Math.round(days[k].max)}°</span> <span style='color:#00eaff'>${Math.round(days[k].min)}°</span></div></div>`;
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
                for(var i=0; i<data.alerts.length; i++) { txt += `<span class='t-warn'> +++ ⚠️ WARNUNG: ${data.alerts[i].event_de.toUpperCase()} ⚠️</span>`; }
            }
        }
        loadWorldTicker(txt);
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
            if(r.status===200) { var j=JSON.parse(r.responseText); wd += `<span class='t-world'> ◈ ${j.name.toUpperCase()}: ${Math.round(j.main.temp)}°</span>`; }
            done++; if(done === caps.length) document.getElementById('ticker-text').innerHTML = wd;
        };
        r.send(); 
    });
}

function openMenu() { document.getElementById('settings-overlay').style.display='block'; }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showSub(id) { 
    var s = document.getElementsByClassName('sub-c'); 
    for(var i=0; i<s.length; i++){s[i].style.display='none';}
    document.getElementById('menu-main').style.display='none'; 
    document.getElementById(id).style.display='block'; 
}
function showMain() { 
    document.getElementById('menu-main').style.display='block'; 
    var s = document.getElementsByClassName('sub-c'); 
    for(var i=0; i<s.length; i++){s[i].style.display='none';} 
}