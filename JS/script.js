// initializing a map (CartoDB DarkMatter)
var map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap',
    className: 'map-tiles'
}).addTo(map);

var currentMarker;

document.getElementById("check").addEventListener("click", function () {
    let input = document.getElementById("inputField").value.trim();
    if (!input) return;

    fetch(`http://127.0.0.1:5000/get-location/${input}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === "success" || data.city) {
                showResult(data);
                updateMap(data.lat, data.lon, data.city);
            }
        })
        .catch(err => alert("ERROR to connect to server. Make sure the backend is running."));
});

function showResult(data) {
    const resCard = document.getElementById("result");
    const sec = data.security || { score: 100, status: "Safe", reasons: [] };
    const riskClass = sec.score > 80 ? 'risk-low' : (sec.score > 50 ? 'risk-medium' : 'risk-high');

    resCard.style.display = "block";
    document.getElementById("scoreBadge").className = `score-badge ${riskClass}`;
    document.getElementById("scoreBadge").innerText = sec.score;
    document.getElementById("statusText").className = riskClass;
    document.getElementById("statusText").innerText = `status: ${sec.status}`;

    document.getElementById("detailsText").innerHTML = `
                <p>📍 <b>location:</b> ${data.city}, ${data.country}</p>
                <p>🌐 <b>ISP:</b> ${data.isp || 'Unknown'}</p>
                <p>⚠️ <b>area:</b> ${sec.reasons.join(", ") || "clean"}</p>
            `;
}

function updateMap(lat, lon, city) {
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lon]).addTo(map).bindPopup(city).openPopup();
    map.flyTo([lat, lon], 8);
}

// simulation of live cyber attacks
let attackInterval;
document.getElementById("cyberMode").addEventListener("click", function () {
    this.classList.toggle("active");
    if (attackInterval) {
        clearInterval(attackInterval);
        attackInterval = null;
        this.innerText = "live monitoring";
    } else {
        this.innerText = "stop monitoring...";
        attackInterval = setInterval(() => {
            fetch('http://127.0.0.1:5000/simulate-attack')
                .then(res => res.json())
                .then(data => {
                    L.circleMarker([data.lat, data.lon], { color: 'red', radius: 8, fillOpacity: 0.6 }).addTo(map)
                        .bindTooltip(`מתקפה: ${data.country}`).openTooltip();
                });
        }, 3000);
    }
});

function updateLiveFeed() {
    fetch('http://127.0.0.1:5000/get-recent')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("feed-list");
            list.innerHTML = data.map(item => `
                        <li class="feed-item">
                            🛡️ <b>${item.ip}</b><br>
                            <span style="color: #94a3b8;">${item.city}, ${item.country} | ${item.timestamp}</span>
                        </li>
                    `).join('');
        });
}

document.getElementById("check").addEventListener("click", function () {
    let input = document.getElementById("inputField").value.trim();
    if (!input) return;

    // elements from DOM
    const loader = document.getElementById("loader");
    const resCard = document.getElementById("result");
    const errorMsg = document.getElementById("error-message");

    //initial state: show loading, hide results and errors
    loader.style.display = "block";
    resCard.style.display = "none";
    errorMsg.style.display = "none";

    fetch(`http://127.0.0.1:5000/get-location/${input}`)
        .then(res => {
            if (!res.ok) throw new Error("Server error");
            return res.json();
        })
        .then(data => {
            loader.style.display = "none"; // hide loading
            if (data.status === "success" || data.city) {
                showResult(data); 
                updateMap(data.lat, data.lon, data.city);
            } else {
                errorMsg.innerText = "Data not found for the given input.";
                errorMsg.style.display = "block";
            }
        })
        .catch(err => {
            loader.style.display = "none"; // hide loading
            errorMsg.style.display = "block";
            console.error("Connection failed:", err);
        });
});

function downloadReport() { window.location.href = 'http://127.0.0.1:5000/export-csv'; }
setInterval(updateLiveFeed, 5000);
updateLiveFeed();