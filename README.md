# 🛡️ IP Threat Dashboard

A simple Full-Stack application to demonstrate how to track and visualize IP-based security data.

## 📝 What this project does
I built this project to practice connecting a Python Backend (Flask) with a dynamic Frontend and a Database.
- **Scanning:** You enter an IP, and the app fetches its location and ISP.
- **Risk Scoring:** A simple algorithm checks if the IP comes from specific regions or server providers.
- **History:** All scans are saved in a local SQLite database.
- **Visualization:** Found locations are marked on an interactive map.

## 🛠️ The Tech Behind It
- **Backend:** Flask & SQLAlchemy (Python).
- **Frontend:** Plain JS, CSS, and Leaflet.js for the map.
- **Data:** Uses the IP-API service for geolocation.

## 💡 What I learned
- How to handle asynchronous API calls in JavaScript.
- Managing a database (CRUD operations) with SQLAlchemy.
- Exporting data from a database into a downloadable CSV file.
