# Tab Synchronizer Chrome Extension

## Features

- Sync tabs across devices
- Preserve scroll positions
- Capture video timestamps
- Configurable auto-sync intervals
- View tab history

## Prerequisites

- Python 3
- Flask
- Chrome Browser
- Cloudflare account (optional, for remote hosting)

## Local Development Setup

### Backend Server Setup

1. Clone the repository:
```bash
git clone https://github.com/JarvisUrInsane/google-extension-tab-synchronizer.git
cd tab-synchronizer/server
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
python app.py
```

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/` on the host device and desired connection devices
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension` directory of the project

# Cloudflare Domain Setup Tutorial

## Prerequisites
- A domain name (recommended to purchase from Porkbun.com or similar domain registrar)
- Cloudflare account
- Local server running on localhost:5000
- Cloudflare Tunnel installed
- Google extension for your project

## Step-by-Step Guide

### 1. Purchase a Domain
1. Visit [Porkbun.com](https://porkbun.com) or similar domain registrar vendors
2. Search for and purchase your desired domain name
3. Complete the domain registration process

### 2. Register Domain with Cloudflare
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click "Add site" and enter your domain name
3. Choose the free plan
4. Cloudflare will provide you with two nameservers (e.g., `ada.ns.cloudflare.com` and `ben.ns.cloudflare.com`)
5. Go to your domain registrar (Porkbun)
6. Navigate to domain management
7. Replace existing nameservers with the Cloudflare-provided nameservers
8. Save changes and wait for DNS propagation (can take up to 24-48 hours, but often completes within an hour)

### 3. Create and Run Cloudflare Tunnel
1. In Cloudflare Dashboard, go to "Zero Trust" > "Networks" > "Tunnels"
2. Click "Create a tunnel"
3. Name your tunnel
4. Choose your preferred connector for your operating system
5. Follow the installation instructions for your specific OS
6. When prompted, authenticate with Cloudflare

### 4. Install OS-Specific Connector
1. Download the appropriate connector for your operating system
2. Install following the platform-specific instructions
3. Configure the connector to point to http://localhost:5000 (not HTTPS)
4. Verify Cloudflare tunnel connection status in the dashboard

### 5. Configure Domain in Google Extension
1. Open your project's Google extension
2. Locate the domain configuration section
3. Insert your full domain name (e.g., `https://yourdomain.com`)
4. Save the configuration

### Running the Server

1. Start the Flask server:
```bash
python app.py
```
2. In another terminal, start the Cloudflared tunnel
```bash
cloudflared tunnel run
```
## Additional Resources
- [Cloudflare DNS Setup Guide](https://developers.cloudflare.com/dns/)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
