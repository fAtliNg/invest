
import os
import shutil
import re

# Source directory for icons
ICONS_DIR = 'public/icons'
CURRENCIES_DIR = os.path.join(ICONS_DIR, 'currencies')
COMMODITIES_DIR = os.path.join(ICONS_DIR, 'commodities')

# Destination directory
LOGOS_DIR = 'logos'

# Ensure destination directory exists
os.makedirs(LOGOS_DIR, exist_ok=True)

# Mapping from prefix to source icon file (relative to public/icons)
# Note: Keys are 3-letter prefixes or specific starts
MAPPING = {
    'AED': 'currencies/ae.svg',
    'AMD': 'currencies/am.svg',
    'AZN': 'currencies/az.svg',
    'BYN': 'currencies/by.svg',
    'CHF': 'currencies/ch.svg',
    'CNY': 'currencies/cn.svg',
    'EUR': 'currencies/eu.svg',
    'GBP': 'currencies/gb.svg',
    'GLD': 'commodities/GOLD.svg',
    'HKD': 'currencies/hk.svg',
    'JPY': 'currencies/jp.svg',
    'KGS': 'currencies/kg.svg',
    'KZT': 'currencies/kz.svg',
    'PLD': 'commodities/PALLADIUM.svg',
    'PLT': 'commodities/PLATINUM.svg',
    'SLV': 'commodities/SILVER.svg',
    'TJS': 'currencies/tj.svg',
    'TRY': 'currencies/tr.svg',
    'UAH': 'currencies/ua.svg',
    'USD': 'currencies/us.svg',
    'UZS': 'currencies/uz.svg',
    'ZAR': 'currencies/za.svg',
}

# Read the SQL file to get the list of secids
SQL_FILE = 'backend/liquibase/sql/04_populate_currency_names.sql'

def get_secids_from_sql(filepath):
    secids = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Regex to find lines like ('AEDRUBTODTOM', ...
            matches = re.findall(r"\('([A-Za-z0-9_]+)',", content)
            secids.extend(matches)
    except Exception as e:
        print(f"Error reading SQL file: {e}")
    return secids

def main():
    secids = get_secids_from_sql(SQL_FILE)
    print(f"Found {len(secids)} secids.")

    copied_count = 0
    for secid in secids:
        # Determine the source icon based on prefix
        prefix = secid[:3]
        
        # Handle special cases if any
        # e.g. EUR_RUB__TOD -> EUR is handled by prefix
        
        if prefix in MAPPING:
            source_rel_path = MAPPING[prefix]
            source_path = os.path.join(ICONS_DIR, source_rel_path)
            dest_path = os.path.join(LOGOS_DIR, f"{secid}.svg")
            
            if os.path.exists(source_path):
                shutil.copy2(source_path, dest_path)
                # print(f"Copied {source_path} to {dest_path}")
                copied_count += 1
            else:
                print(f"Warning: Source icon not found: {source_path}")
        else:
            print(f"No mapping for secid: {secid} (prefix: {prefix})")

    print(f"Successfully copied {copied_count} icons.")

if __name__ == "__main__":
    main()
