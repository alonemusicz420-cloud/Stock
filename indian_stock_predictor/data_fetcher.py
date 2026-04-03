import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta


STOCKS = {
    'NIFTY 50': '^NSEI',
    'IDEA': 'IDEA.NS',
    'RENUKA': 'SHREECEM.NS',
    'YESBANK': 'YESBANK.NS'
}


def fetch_stock_data(symbol, period="2y"):
    ticker = symbol if symbol in STOCKS.values() else STOCKS.get(symbol, symbol)
    print(f"[*] Fetching {symbol} data for period: {period}")
    data = yf.download(ticker, period=period, progress=False)
    
    if data.empty:
        raise ValueError(f"Failed to fetch {symbol} data.")
    
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)
    data = data.dropna()
    
    print(f"[+] Fetched {len(data)} trading days")
    return data


def fetch_all_stocks(period="2y"):
    all_data = {}
    for name, symbol in STOCKS.items():
        try:
            all_data[name] = fetch_stock_data(symbol, period)
        except Exception as e:
            print(f"[-] Failed to fetch {name}: {e}")
    return all_data


def save_data(df, filepath):
    import os
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    df.to_csv(filepath)
    print(f"[+] Data saved to {filepath}")


def load_data(filepath):
    df = pd.read_csv(filepath, index_col=0, parse_dates=True)
    print(f"[+] Loaded {len(df)} records from {filepath}")
    return df
