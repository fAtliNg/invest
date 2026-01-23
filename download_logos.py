import json
import os
import urllib.request
import urllib.parse
import time
import base64
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def get_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def download_file(url, filepath):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            content = r.read()
            with open(filepath, 'wb') as f:
                f.write(content)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def get_moex_mapping():
    mapping = {}
    sources = [
        ('stock', 'shares', 'TQBR'),
        ('stock', 'shares', 'TQTF'),
        ('stock', 'bonds', 'TQCB'),
        ('stock', 'bonds', 'TQOB'),
    ]
    
    for engine, market, board in sources:
        url = f"https://iss.moex.com/iss/engines/{engine}/markets/{market}/boards/{board}/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,ISIN"
        print(f"Fetching mapping from {board}...")
        data = get_json(url)
        if data and 'securities' in data and 'data' in data['securities']:
            rows = data['securities']['data']
            for row in rows:
                if len(row) >= 2:
                    secid = row[0]
                    isin = row[1]
                    if secid and isin:
                        mapping[secid] = isin
            
    return mapping

def run():
    print("Loading MOEX mapping...")
    mapping = get_moex_mapping()
    print(f"Loaded {len(mapping)} mappings from MOEX")

    output_dir = 'logos'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    offset = 0
    limit = 100 # Try requesting more
    total_downloaded = 0
    total_skipped = 0
    
    while True:
        url = f"https://financemarker.ru/api/stocks?offset={offset}&limit={limit}"
        print(f"Fetching page offset={offset}...")
        
        data = get_json(url)
        if not data or 'data' not in data:
            print("No data or error, stopping.")
            break
            
        items = data['data']
        if not items:
            print("Empty list, finished.")
            break
            
        print(f"Processing {len(items)} items...")
        
        for item in items:
            ticker = item.get('code')
            logolink = item.get('logolink')
            
            if not ticker or not logolink:
                continue
                
            isin = mapping.get(ticker)
            if not isin:
                if len(ticker) == 12: # Maybe it is ISIN?
                    isin = ticker
                else:
                    # print(f"Skipping {ticker}: ISIN not found")
                    continue
            
            ext = '.png'
            try:
                if 'file_id=' in logolink:
                    file_id = logolink.split('file_id=')[1]
                    missing_padding = len(file_id) % 4
                    if missing_padding:
                        file_id += '=' * (4 - missing_padding)
                    decoded = base64.b64decode(file_id).decode('utf-8')
                    _, ext_candidate = os.path.splitext(decoded)
                    if ext_candidate:
                        ext = ext_candidate
                else:
                    _, ext_candidate = os.path.splitext(logolink)
                    if ext_candidate:
                        ext = ext_candidate
            except Exception:
                pass
                
            filename = f"{isin}{ext}"
            filepath = os.path.join(output_dir, filename)
            
            if os.path.exists(filepath):
                total_skipped += 1
                continue
                
            if download_file(logolink, filepath):
                print(f"Downloaded: {filename} ({ticker})")
                total_downloaded += 1
                time.sleep(0.05)
        
        offset += len(items)
        if len(items) < 10: # Assuming page size is at least 10, if less, probably end
             break
        time.sleep(0.5)

    print(f"Finished. Total downloaded: {total_downloaded}. Total skipped: {total_skipped}.")

if __name__ == "__main__":
    run()
