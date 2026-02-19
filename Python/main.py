from flask_sqlalchemy import SQLAlchemy
import requests
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from datetime import datetime
import csv
from io import StringIO
import random

app = Flask(__name__)
CORS(app)

# --- DB definition ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///threats.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# data model
class ScanRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip = db.Column(db.String(50))
    country = db.Column(db.String(50))
    city = db.Column(db.String(50))
    risk_score = db.Column(db.Integer)
    status = db.Column(db.String(20))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


# create tables
with app.app_context():
    db.create_all()


# --- temp functions ---
def fetch_ip_info(ip):
    try:
        url = f"http://ip-api.com/json/{ip}"
        response = requests.get(url, timeout=5)
        return response.json()
    except:
        return {"status": "fail"}


def analyze_risk(data):
    score = 100
    reasons = []
    risky_countries = ["Russia", "China", "North Korea", "Iran"]

    if data.get('country') in risky_countries:
        score -= 50
        reasons.append("High-risk location")

    isp = data.get('isp', '').lower()
    if any(word in isp for word in ["hosting", "cloud", "server"]):
        score -= 20
        reasons.append("Server/Hosting network detected")

    status = "Safe"
    if score < 50:
        status = "Dangerous"
    elif score < 80:
        status = "Suspicious"

    return {"score": score, "status": status, "reasons": reasons}


# --- Routes ---

@app.route('/get-location/<ip_address>')
def get_ip_location(ip_address):
    data = fetch_ip_info(ip_address)
    if data.get('status') == 'success':
        risk_data = analyze_risk(data)
        data['security'] = risk_data


        new_scan = ScanRecord(
            ip=data['query'],
            country=data['country'],
            city=data['city'],
            risk_score=risk_data['score'],
            status=risk_data['status']
        )
        db.session.add(new_scan)
        db.session.commit()

        return jsonify(data)
    return jsonify({"status": "fail"}), 404


# history
@app.route('/get-recent')
def get_recent():
    scans = ScanRecord.query.order_by(ScanRecord.id.desc()).limit(5).all()
    output = []
    for s in scans:
        output.append({
            "ip": s.ip,
            "country": s.country,
            "city": s.city,
            "timestamp": s.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })
    return jsonify(output)


@app.route('/simulate-attack')
@app.route('/simulate-attack')
def simulate():
    fake_ips = ["8.8.8.8", "1.1.1.1", "142.250.190.46", "31.13.72.36", "185.60.216.35"]
    chosen_ip = random.choice(fake_ips)

    # retrieval of information from API
    data = fetch_ip_info(chosen_ip)

    if data.get('status') == 'success':
        # ניתוח סיכונים
        risk_data = analyze_risk(data)
        data['security'] = risk_data

        # --- save to DB ---
        new_scan = ScanRecord(
            ip=data['query'],
            country=data['country'],
            city=data['city'],
            risk_score=risk_data['score'],
            status=risk_data['status']
            # הזמן (timestamp) ייווצר אוטומטית לפי ההגדרה במודל
        )
        db.session.add(new_scan)
        db.session.commit()

        return jsonify(data)

    return jsonify({"status": "fail"}), 400


@app.route('/export-csv')
def export_csv():
    scans = ScanRecord.query.order_by(ScanRecord.timestamp.desc()).all()
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['ID', 'IP', 'Country', 'City', 'Risk Score', 'Status', 'Time'])
    for s in scans:
        cw.writerow([s.id, s.ip, s.country, s.city, s.risk_score, s.status, s.timestamp])

    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=threat_report.csv"
    output.headers["Content-type"] = "text/csv"
    return output


if __name__ == '__main__':
    app.run(debug=True)