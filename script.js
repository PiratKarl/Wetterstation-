var API_KEY = '518e81d874739701f08842c1a55f6588';
var currentCity = localStorage.getItem('selectedCity') || 'Braunschweig';

var iconColorMap = {
    "01d": "fa-sun-o icon-sun", "01n": "fa-moon-o icon-cloud",
    "02d": "fa-cloud icon-cloud", "02n": "fa-cloud icon-cloud",
    "03d": "fa-cloud icon-cloud", "04d": "fa-cloud icon-cloud",
    "09d": "fa-tint icon-rain", "10d": "fa-umbrella icon-rain",
    "11d": "fa-bolt icon-bolt", "13d": "fa-snowflake-o icon-snow",
    "50d": "fa-bars icon-cloud"
};

function zero(n) { return (n < 10 ? '0' : '') + n; }

// --- NEU: Bekleidungstipps ---
function getClothingTip(temp, rain) {
    var tip = "";
    if (temp < 5) tip = "❄️ WINTERMODUS: Dicke Jacke, Schal & Handschuhe!";
    else if (temp < 12) tip = "🧥 Übergangsjacke & warmer Pullover empfohlen.";
    else if (temp < 18) tip = "👕 Leichte Jacke oder Weste reicht aus.";
    else if (temp < 25) tip = "☀️ T-Shirt Wetter! Genieße die Sonne.";
    else tip = "🕶️ HEISS: Kurze Kleidung & viel Wasser trinken!";
    
    if (rain) tip += " ☔ Schirm nicht vergessen!";
    return tip;
}

// --- NEU: Warnungs-Logik ---
function getWarnings(data) {
    var warns = [];
    var windKmh = Math.round(data.wind.speed * 3.6);
    var temp = data.main.temp;
    var condition = data.weather[0].main;

    if (windKmh > 75) warns.push({t: "⚠️ ORKAN-WARNUNG: Bleiben Sie im Haus!", c: "warn-red"});
    else if (windKmh > 55) warns.push({t: "⚠️ STURM-WARNUNG: Wind bis " + windKmh + " km/h", c: "warn-orange"});
    
    if (temp < -5) warns.push({t: "❄️ STRENGER FROST: Glättegefahr!", c: "warn-frost"});
    if (temp > 32) warns.push({t: "🔥 HITZE-ALARM: Belastung für den Kreislauf!", c: "warn-red"});
    
    if (condition === "Thunderstorm") warns.push({t: "⚡ GEWITTER-WARNUNG: Gefahr von Blitzeinschlag!", c: "warn-orange"});
    
    return warns;
}

function getWindDirText(deg) {
    var directions = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
    return directions[Math.round(deg / 45) % 8];
}

function updateClock() {
    var now = new Date();
    document.getElementById('clock').innerText = zero(now.getHours()) + ":" + zero(now.getMinutes());
    document.getElementById('date').innerText = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatT(ts, offset) {
    var d = new Date((ts + offset) * 1000);
    return zero(d.getUTCHours()) + ":" + zero(d.getUTCMinutes());
}

async function fetchWeather() {
    try {
        var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de&_t=" + Date.now();
        var res = await fetch(url);
        var data = await res.json();
        
        if (data.cod === 200) {
            var temp = data.main.temp;
            var isRain = data.weather[0].main === "Rain" || data.weather[0].main === "Drizzle";
            
            document.getElementById('temp-display').innerText = temp.toFixed(1);
            document.getElementById('main-icon').className = "fa " + (iconColorMap[data.weather[0].icon] || "fa-cloud");
            document.getElementById('sunrise-val').innerText = formatT(data.sys.sunrise, data.timezone);
            document.getElementById('sunset-val').innerText = formatT(data.sys.sunset, data.timezone);

            // Ticker zusammenbauen
            var tickerContainer = document.getElementById('info-ticker');
            tickerContainer.innerHTML = ""; // Alten Text löschen

            // 1. Warnungen (Falls vorhanden)
            var warnings = getWarnings(data);
            warnings.forEach(function(w) {
                tickerContainer.innerHTML += '<span class="' + w.c + '">' + w.t + ' +++ </span>';
            });

            // 2. Bekleidungstipp
            tickerContainer.innerHTML += '<span>' + getClothingTip(temp, isRain) + ' +++ </span>';

            // 3. Wind & Rest
            var windKmh = Math.round(data.wind.speed * 3.6);
            tickerContainer.innerHTML += '<span>WIND: ' + windKmh + ' KM/H (' + getWindDirText(data.wind.deg) + ') +++ </span>';
            tickerContainer.innerHTML += '<span>LUFTFEUCHTE: ' + data.main.humidity + '% +++ </span>';
            tickerContainer.innerHTML += '<span>DRUCK: ' + data.main.pressure + ' HPA +++ </span>';
            
            document.getElementById('update-info').innerText = "Upd: " + zero(new Date().getHours()) + ":" + zero(new Date().getMinutes());
        }

        // Vorhersage (Stunden & Tage)
        var resF = await fetch("https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(currentCity) + "&appid=" + API_KEY + "&units=metric&lang=de");
        var dataF = await resF.json();

        // 1. Stunden (5)
        var hList = document.getElementById('hourly-list'); hList.innerHTML = "";
        for(var i=0; i<5; i++) {
            var it = dataF.list[i];
            hList.innerHTML += '<div class="f-item"><span class="f-label">' + new Date(it.dt*1000).getHours() + ':00</span><i class="fa ' + (iconColorMap[it.weather[0].icon] || "fa-cloud") + '" style="font-size:2.2rem; display:block; margin:4px 0;"></i><span class="f-temp-hour">' + Math.round(it.main.temp) + '°</span></div>';
        }

        // 2. Tage
        var dList = document.getElementById('daily-list'); dList.innerHTML = "";
        var daysData = {};
        dataF.list.forEach(function(it) {
            var dayName = new Date(it.dt*1000).toLocaleDateString('de-DE', {weekday:'short'});
            if(!daysData[dayName]) daysData[dayName] = { temps: [], icon: it.weather[0].icon };
            daysData[dayName].temps.push(it.main.temp);
        });
        Object.keys(daysData).slice(1, 6).forEach(function(d) {
            var maxT = Math.round(Math.max.apply(Math, daysData[d].temps));
            var minT = Math.round(Math.min.apply(Math, daysData[d].temps));
            dList.innerHTML += '<div class="f-item"><span class="f-label" style="color:#00ffcc">' + d + '</span><i class="fa ' + (iconColorMap[daysData[d].icon] || "fa-cloud") + '" style="font-size:2.2rem; display:block; margin:4px 0;"></i><div><span class="f-temp-max">' + maxT + '°</span><span class="f-temp-min">' + minT + '°</span></div></div>';
        });

    } catch (e) { console.log(e); }
}

function toggleSettings() {
    var s = document.getElementById('settings-overlay');
    s.style.display = (s.style.display === 'block') ? 'none' : 'block';
}

function saveCity() {
    var val = document.getElementById('city-input').value.trim();
    if(val) {
        localStorage.setItem('selectedCity', val);
        window.location.reload(); 
    }
}

setInterval(updateClock, 1000);
setInterval(fetchWeather, 300000);
setInterval(function() { window.location.reload(); }, 1500000); 

updateClock(); fetchWeather();