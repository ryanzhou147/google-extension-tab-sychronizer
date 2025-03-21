# server/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import database

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

@app.route('/api/init', methods=['GET'])
def init_db():
    database.init_db()
    return jsonify({'status': 'success', 'message': 'Database initialized'})

@app.route('/api/tabs', methods=['POST'])
def save_tabs():
    tabs_data = request.json
    result = database.save_tabs(tabs_data)
    return jsonify({'status': 'success', 'message': 'Tabs saved'})

@app.route('/api/tabs/latest', methods=['GET'])
def get_latest_tabs():
    tabs = database.get_latest_tabs()
    return jsonify({'status': 'success', 'data': tabs})

@app.route('/api/tabs/history', methods=['GET'])
def get_tab_history():
    history = database.get_all_tab_history()
    return jsonify({'status': 'success', 'data': history})

@app.route('/', methods=['GET'])
def home():
    return "Flask server is running!"

if __name__ == '__main__':
    database.init_db()  # Initialize DB on startup
    app.run(debug=True, host='0.0.0.0', port=5000)
