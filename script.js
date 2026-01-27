var currentVer = 17.8;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart'), sEnd = localStorage.getItem('sleepEnd');
var active = false, grace = false;
var worldCities = ["New York", "Sydney", "Tokyo", "London", "Berlin"];
var worldData = "";

function z(n){return (n<10?'0':'')+n;}

function checkUpdate() {
    var x = new XMLHttpRequest();
    x.open("GET", "version.json?nocache=" + new Date().getTime(), true);
    x.onload = function() {
        if (x.status === 200) {
            var data = JSON.parse(x.responseText);
            if (data.version > currentVer) {
                // Popup anzeigen
                document.getElementById('update-popup').style.display = 'block';
                // Video kurz triggern für "Wachbleiben"
                var v = document.getElementById('wake-video');
                v.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
                v.play().catch(function(e){});
                
                localStorage.setItem('autoStart', 'true');
                setTimeout(function(){ location.reload(true); }, 3000);
            }
        }
    };
    x.send();
}

window.onload = function() {
    if(localStorage.getItem('autoStart') === 'true') {
        localStorage.removeItem('autoStart');
        startApp(true);
    }
};

function startApp(isAuto) {
    document.getElementById('start-overlay').style.display='none';
    if(!isAuto) {
        var v = document.getElementById('wake-video');
        v.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
        v.play().catch(function(e){});
        if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    }
    if(!active) { 
        active=true; initStatusHandlers(); loadWeather(); update(); 
        setInterval(update, 1000); setInterval(loadWeather, 600000); setInterval(checkUpdate, 1800000);
    }
}

function initStatusHandlers() {
    window.addEventListener('online', function(){ document.getElementById('wifi-icon').className="online"; });
    window.addEventListener('offline', function(){ document.getElementById('wifi-icon').className="offline"; });
    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            var updateBat = function(){
                document.getElementById('bat-box').style.display = 'flex';
                document.getElementById('bat-level').innerText = Math.round(battery.level * 100) + "%";
                document.getElementById('bat-icon').innerText = battery.charging ? "⚡" : "🔋";
            };
            updateBat(); battery.onlevelchange = updateBat; battery.onchargingchange = updateBat;
        });
    }
}

function update() {
    var now = new Date();
    document.getElementById('clock').innerText = z(now.getHours())+':'+z(now.getMinutes());
    var days = ['So.','Mo.','Di.','Mi.','Do.','Fr.','Sa.'], months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    document.getElementById('date').innerText = days[now.getDay()] + " " + now.getDate() + ". " + months[now.getMonth()];
    
    var year=now.getFullYear(), month=now.getMonth()+1, day=now.getDate(); if(month<3){year--;month+=12;}++month;
    var jd = (365.25*year) + (30.6*month) + day - 694039.09; jd/=29.53; var b=Math.round((jd-parseInt(jd))*8); if(b>=8)b=0;
    document.getElementById('moon').innerText = ["🌑 NEUMOND","🌒 SICHEL","🌓 1. VIERTEL","🌔 ZUN. MOND","🌕 VOLLMOND","🌖 ABN. MOND","🌗 LETZTES V.","🌘 SICHEL"][b];

    var sleep = false;
    if(sStart && sEnd) {
        var n = now.getHours()*60 + now.getMinutes(), s = parseInt(sStart.split(':')[0])*60 + parseInt(sStart.split(':')[1]), e = parseInt(sEnd.split(':')[0])*60 + parseInt(sEnd.split(':')[1]);
        if(s > e) { if(n >= s || n < e) sleep = true; } else { if(n >= s && n < e) sleep = true; }
    }
    var v = document.getElementById('wake-video');
    if(sleep && !grace && v.src) v.classList.add('sleep-mode'); else v.classList.remove('sleep-mode');
}

function loadWeather() {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        document.getElementById('temp-display').innerText = Math.round(d.main.temp) + "°";
        document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
        document.getElementById('weather-desc').innerText = d.weather[0].description.toUpperCase();
        document.getElementById('city-title').innerText = d.name.toUpperCase();
        document.getElementById('current-weather-icon').src = d.weather[0].icon + ".gif";
        
        var r = new Date((d.sys.sunrise + d.timezone - 3600) * 1000), s = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
        document.getElementById('sunrise').innerText = z(r.getHours()) + ":" + z(r.getMinutes());
        document.getElementById('sunset').innerText = z(s.getHours()) + ":" + z(s.getMinutes());

        var now = new Date();
        document.getElementById('last-up-date').innerText = z(now.getDate()) + "." + z(now.getMonth()+1) + "." + now.getFullYear().toString().substr(2,2);
        document.getElementById('last-up-time').innerText = z(now.getHours()) + ":" + z(now.getMinutes());

        loadWorldWeather(); 
        loadFore(d.coord.lat, d.coord.lon, d.main.temp);
    };
    x.send();
}

function loadWorldWeather() {
    worldData = "";
    var icons = {"Clouds":"☁️","Clear":"☀️","Rain":"🌧️","Drizzle":"🌦️","Thunderstorm":"⛈️","Snow":"❄️","Mist":"🌫️"};
    worldCities.forEach(function(c) {
        var x = new XMLHttpRequest();
        x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric&lang=de", false);
        x.send();
        var d = JSON.parse(x.responseText);
        var icon = icons[d.weather[0].main] || "🌡️";
        worldData += " +++ " + d.name.toUpperCase() + ": " + icon + " " + Math.round(d.main.temp) + "°";
    });
}

function loadFore(lat, lon, currentTemp) {
    var x = new XMLHttpRequest();
    x.open("GET", "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de", true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        var h = "<tr>", dy = "<tr>", rainNext = Math.round(d.list[0].pop * 100);
        document.getElementById('main-pop').innerText = "💧" + rainNext + "%";
        document.getElementById('clothes-advice').innerText = (rainNext > 30) ? "🌂 REGENSCHIRM" : (currentTemp < 5 ? "🧥 WINTERJACKE" : (currentTemp < 15 ? "🧥 ÜBERGANGSJACKE" : "👕 T-SHIRT"));
        
        for(var i=0; i<4; i++) {
            var it = d.list[i], t = new Date(it.dt*1000);
            h += "<td>"+z(t.getHours())+" Uhr<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br>"+Math.round(it.main.temp)+"°<br><span style='color:#00eaff; font-size:2vh;'>💧"+Math.round(it.pop*100)+"%</span></td>";
        }
        for(var i=0; i<32; i+=8) {
            var it = d.list[i], day = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase();
            dy += "<td>"+day.substr(0,2)+"<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br><span style='color:#ff4444;'>"+Math.round(it.main.temp_max)+"°</span> <span style='color:#00eaff;'>"+Math.round(it.main.temp_min-2)+"°</span><br><span style='color:#00eaff; font-size:2vh;'>💧"+Math.round(it.pop*100)+"%</span></td>";
        }
        document.getElementById('hourly-table').innerHTML = h + "</tr>"; document.getElementById('daily-table').innerHTML = dy + "</tr>";
        document.getElementById('ticker').innerText = d.list[0].weather[0].description.toUpperCase() + " +++ WIND: " + Math.round(d.list[0].wind.speed*3.6) + " KM/H" + worldData;
    };
    x.send();
}

function openMenu() { document.getElementById('settings-overlay').style.display='flex'; showMain(); }
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function showMain() { document.getElementById('menu-main').style.display='flex'; var subs=document.getElementsByClassName('sub-content'); for(var i=0; i<subs.length; i++) subs[i].style.display='none'; }
function showSub(id) { document.getElementById('menu-main').style.display='none'; document.getElementById(id).style.display='flex'; }
function save() { localStorage.setItem('city', document.getElementById('city-in').value); localStorage.setItem('sleepStart', document.getElementById('time-start').value); localStorage.setItem('sleepEnd', document.getElementById('time-end').value); location.reload(); }
