# server/database.py
import sqlite3
from datetime import datetime

def get_db_connection():
    conn = sqlite3.connect('tabs.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
    CREATE TABLE IF NOT EXISTS windows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TIMESTAMP NOT NULL
    )
    ''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS tabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        window_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        scroll_position INTEGER DEFAULT 0,
        video_timestamp FLOAT DEFAULT 0,
        created_at TIMESTAMP NOT NULL,
        FOREIGN KEY (window_id) REFERENCES windows (id)
    )
    ''')
    conn.commit()
    conn.close()

def save_tabs(tabs_data):
    """
    tabs_data should be a list of dictionaries with window_id and tabs (list of tab data)
    """
    conn = get_db_connection()
    timestamp = datetime.now().isoformat()
    
    for window in tabs_data:
        cursor = conn.execute(
            'INSERT INTO windows (created_at) VALUES (?)',
            (timestamp,)
        )
        window_id = cursor.lastrowid
        
        for tab in window['tabs']:
            conn.execute(
                '''INSERT INTO tabs 
                (window_id, url, title, scroll_position, video_timestamp, created_at) 
                VALUES (?, ?, ?, ?, ?, ?)''',
                (window_id, tab['url'], tab.get('title', ''), 
                 tab.get('scrollPosition', 0), tab.get('videoTimestamp', 0), timestamp)
            )
    
    conn.commit()
    conn.close()
    return True

def get_latest_tabs():
    """
    Get the most recent set of tabs grouped by windows
    """
    conn = get_db_connection()
    
    # Get the most recent window timestamp
    latest_time = conn.execute(
        'SELECT created_at FROM windows ORDER BY created_at DESC LIMIT 1'
    ).fetchone()
    
    if not latest_time:
        return []
    
    # Get all windows with that timestamp
    windows = conn.execute(
        'SELECT id FROM windows WHERE created_at = ?',
        (latest_time['created_at'],)
    ).fetchall()
    
    result = []
    for window in windows:
        tabs = conn.execute(
            '''SELECT id, url, title, scroll_position, video_timestamp 
            FROM tabs WHERE window_id = ?''',
            (window['id'],)
        ).fetchall()
        
        window_data = {
            'window_id': window['id'],
            'tabs': [{
                'url': tab['url'],
                'title': tab['title'],
                'scrollPosition': tab['scroll_position'],
                'videoTimestamp': tab['video_timestamp']
            } for tab in tabs]
        }
        result.append(window_data)
    
    conn.close()
    return result

def get_all_tab_history():
    """
    Get all tab history, grouped by timestamp and window
    """
    conn = get_db_connection()
    
    # Get all unique timestamps
    timestamps = conn.execute(
        'SELECT DISTINCT created_at FROM windows ORDER BY created_at DESC'
    ).fetchall()
    
    result = []
    for timestamp in timestamps:
        time_entry = {
            'timestamp': timestamp['created_at'],
            'windows': []
        }
        
        windows = conn.execute(
            'SELECT id FROM windows WHERE created_at = ?',
            (timestamp['created_at'],)
        ).fetchall()
        
        for window in windows:
            tabs = conn.execute(
                '''SELECT url, title FROM tabs WHERE window_id = ?''',
                (window['id'],)
            ).fetchall()
            
            window_data = {
                'window_id': window['id'],
                'tabs': [{
                    'url': tab['url'],
                    'title': tab['title']
                } for tab in tabs]
            }
            time_entry['windows'].append(window_data)
        
        result.append(time_entry)
    
    conn.close()
    return result