var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('sleepStart'), sEnd = localStorage.getItem('sleepEnd');
var active = false, grace = false;
var worldCities = ["New York", "Sydney", "Cape Town", "San Francisco", "Hong Kong", "Tokyo", "Berlin", "London"];
var worldData = "";

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display='none';
    var el = document.documentElement;
    if(el.requestFullscreen) el.requestFullscreen();
    else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    document.getElementById('wake-video').play().catch(function(e){});
    grace = true; setTimeout(function(){ grace = false; }, 60000);
    if(!active) { 
        active=true; 
        loadWeather(); 
        loadWorldWeather();
        update(); 
        setInterval(update,1000); 
        setInterval(loadWeather,600000); 
        setInterval(loadWorldWeather,1800000);
    }
}

function getClothes(temp, rain) {
    if (rain > 30) return "🌂 REGENSCHIRM EINPACKEN";
    if (temp < 5) return "🧥 DICKE WINTERJACKE";
    if (temp < 15) return "🧥 ÜBERGANGSJACKE";
    if (temp < 22) return "👕 PULLOVER / LANGARM";
    return "👕 T-SHIRT WETTER";
}

function getWeatherSymbol(desc) {
    desc = desc.toLowerCase();
    if(desc.includes("sonne") || desc.includes("klar")) return "☀️";
    if(desc.includes("wolken")) return "☁️";
    if(desc.includes("regen")) return "🌧️";
    if(desc.includes("gewitter")) return "⛈️";
    if(desc.includes("schnee")) return "❄️";
    return "🌤️";
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
    var url = "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+API+"&units=metric&lang=de";
    var x = new XMLHttpRequest();
    x.open("GET", url, true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        var temp = Math.round(d.main.temp);
        document.getElementById('temp-display').innerText = temp + "°";
        document.getElementById('feels-like').innerText = "GEFÜHLT " + Math.round(d.main.feels_like) + "°";
        document.getElementById('city-title').innerText = d.name.toUpperCase();
        document.getElementById('current-weather-icon').src = d.weather[0].icon + ".gif";
        var rT = new Date((d.sys.sunrise + d.timezone - 3600) * 1000), sT = new Date((d.sys.sunset + d.timezone - 3600) * 1000);
        document.getElementById('sunrise').innerText = z(rT.getHours()) + ":" + z(rT.getMinutes());
        document.getElementById('sunset').innerText = z(sT.getHours()) + ":" + z(sT.getMinutes());
        loadFore(d.coord.lat, d.coord.lon, temp, d.weather[0].description.toUpperCase());
    };
    x.send();
}

function loadWorldWeather() {
    worldData = "";
    worldCities.forEach(function(c) {
        var x = new XMLHttpRequest();
        x.open("GET", "https://api.openweathermap.org/data/2.5/weather?q="+c+"&appid="+API+"&units=metric&lang=de", true);
        x.onload = function() {
            var d = JSON.parse(x.responseText);
            var sym = getWeatherSymbol(d.weather[0].description);
            worldData += " +++ " + d.name.toUpperCase() + ": " + sym + " " + Math.round(d.main.temp) + "°";
        };
        x.send();
    });
}

function loadFore(lat, lon, currentTemp, currentDesc) {
    var url = "https://api.openweathermap.org/data/2.5/forecast?lat="+lat+"&lon="+lon+"&appid="+API+"&units=metric&lang=de";
    var x = new XMLHttpRequest();
    x.open("GET", url, true);
    x.onload = function() {
        var d = JSON.parse(x.responseText);
        var h = "<tr>", dy = "<tr>";
        var rainNext = Math.round(d.list[0].pop * 100);
        document.getElementById('clothes-advice').innerText = getClothes(currentTemp, rainNext);

        for(var i=0; i<4; i++) {
            var it = d.list[i], t = new Date(it.dt*1000), p = Math.round(it.pop * 100);
            h += "<td>"+z(t.getHours())+"h<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br>"+Math.round(it.main.temp)+"°<br><span class='t-pop'>💧"+p+"%</span></td>";
        }
        for(var i=0; i<32; i+=8) {
            var it = d.list[i], day = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'}).toUpperCase(), p = Math.round(it.pop * 100);
            dy += "<td>"+day.substr(0,2)+"<br><img class='t-icon' src='"+it.weather[0].icon+".gif'><br><span class='temp-max'>"+Math.round(it.main.temp_max)+"°</span> <span class='temp-min'>"+Math.round(it.main.temp_min - 2)+"°</span><br><span class='t-pop'>💧"+p+"%</span></td>";
        }
        document.getElementById('hourly-table').innerHTML = h + "</tr>";
        document.getElementById('daily-table').innerHTML = dy + "</tr>";
        document.getElementById('ticker').innerText = currentDesc + " +++ REGEN: " + rainNext + "% +++ WIND: " + Math.round(d.list[0].wind.speed*3.6) + " KM/H" + worldData;
    };
    x.send();
}

function openMenu() { 
    document.getElementById('city-in').value = city;
    document.getElementById('time-start').value = sStart || "";
    document.getElementById('time-end').value = sEnd || "";
    document.getElementById('settings-overlay').style.display='flex'; 
}
function closeMenu() { document.getElementById('settings-overlay').style.display='none'; }
function save() {
    localStorage.setItem('city', document.getElementById('city-in').value);
    localStorage.setItem('sleepStart', document.getElementById('time-start').value);
    localStorage.setItem('sleepEnd', document.getElementById('time-end').value);
    location.reload();
}
