"""
Gmail API One-Time Authorization Setup for MedDiagnose AI.

Run this script ONCE to authorize the application to send emails via Gmail API.
This will open a browser window for Google OAuth2 consent.

Prerequisites:
  1. A Google Cloud project with Gmail API enabled
  2. OAuth2 Desktop credentials downloaded as 'credentials.json' in this directory

Usage:
  python gmail_setup.py

After successful authorization, a 'token.json' file will be created.
The MedDiagnose AI agent can then send emails without further user interaction.
"""

import os
import sys

# Reconfigure stdout/stderr to use UTF-8 to prevent cp1252 UnicodeEncodeErrors on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')


def setup_gmail():
    """Run the OAuth2 authorization flow for Gmail API."""
    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
    except ImportError:
        print("❌ Required packages not installed. Run:")
        print("   pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
        sys.exit(1)

    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    script_dir = os.path.dirname(os.path.abspath(__file__))
    credentials_path = os.path.join(script_dir, 'credentials.json')
    token_path = os.path.join(script_dir, 'token.json')

    # Check for credentials.json
    if not os.path.exists(credentials_path):
        print("❌ 'credentials.json' not found in the project root.")
        print()
        print("To set up Gmail API credentials:")
        print("  1. Go to https://console.cloud.google.com/")
        print("  2. Create or select a project")
        print("  3. Enable 'Gmail API' in APIs & Services → Library")
        print("  4. Go to APIs & Services → Credentials")
        print("  5. Click 'Create Credentials' → 'OAuth client ID'")
        print("  6. Select 'Desktop app' as Application Type")
        print("  7. Download the JSON and save as 'credentials.json' here:")
        print(f"     {credentials_path}")
        sys.exit(1)

    # Check if already authorized
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if creds and creds.valid:
        print("✅ Gmail API is already authorized!")
        print(f"   Token file: {token_path}")
        return

    if creds and creds.expired and creds.refresh_token:
        print("🔄 Refreshing expired token...")
        try:
            creds.refresh(Request())
        except Exception as e:
            print(f"⚠️ Refresh failed ({str(e)}). Requesting fresh sign-in...")
            creds = None

    if not creds:
        print("🌐 Opening browser for Google OAuth2 consent...")
        print("   Please authorize the application to send emails on your behalf.")
        print()
        flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
        creds = flow.run_local_server(port=0)

    # Save the token
    with open(token_path, 'w') as token:
        token.write(creds.to_json())

    print()
    print("✅ Gmail API authorized successfully!")
    print(f"   Token saved to: {token_path}")
    print()
    print("The MedDiagnose AI agent can now send real emails via Gmail.")
    print("You can re-run this script anytime to re-authorize.")


if __name__ == '__main__':
    setup_gmail()
