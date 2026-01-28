var currentVer = 21.6;
var API = '518e81d874739701f08842c1a55f6588';
var city = localStorage.getItem('city') || 'Braunschweig';
var sStart = localStorage.getItem('t-start'), sEnd = localStorage.getItem('t-end');

function z(n){return (n<10?'0':'')+n;}

function startApp() {
    document.getElementById('start-overlay').style.display = 'none';
    var elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen(); } 
    else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } 

    // Alle Wachhalter starten
    var wV = document.getElementById('wake-vid');
    var sV = document.getElementById('sleep-vid');
    var wA = document.getElementById('wake-aud');
    var lV = document.getElementById('logo-heartbeat'); // Dein Logo-Video

    wV.src = "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4";
    sV.src = "https://github.com/intel-iot-devkit/sample-videos/raw/master/black.mp4";
    wA.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

    wV.play(); wA.volume = 1.0; wA.play();
    if(lV) { lV.play(); } // Logo-Video starten

    loadWeather(); update(); setInterval(update, 1000); setInterval(loadWeather, 600000); setInterval(checkUpdate, 1800000);
}

// ... Restliche Funktionen (update, loadWeather, loadFore, checkWarnings, loadWorldTicker) wie in V21.5 ...