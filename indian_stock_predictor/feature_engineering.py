import pandas as pd
import numpy as np
import ta


def add_technical_indicators(df):
    print("[*] Adding technical indicators...")
    
    df = df.copy()
    
    df['SMA_10'] = ta.trend.sma_indicator(df['Close'], window=10)
    df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
    df['SMA_50'] = ta.trend.sma_indicator(df['Close'], window=50)
    df['SMA_200'] = ta.trend.sma_indicator(df['Close'], window=200)
    
    df['EMA_10'] = ta.trend.ema_indicator(df['Close'], window=10)
    df['EMA_20'] = ta.trend.ema_indicator(df['Close'], window=20)
    
    df['RSI_14'] = ta.momentum.rsi(df['Close'], window=14)
    
    macd = ta.trend.MACD(df['Close'])
    df['MACD'] = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    df['MACD_Hist'] = macd.macd_diff()
    
    bb = ta.volatility.BollingerBands(df['Close'])
    df['BB_High'] = bb.bollinger_hband()
    df['BB_Low'] = bb.bollinger_lband()
    df['BB_Mid'] = bb.bollinger_mavg()
    
    df['ATR_14'] = ta.volatility.average_true_range(df['High'], df['Low'], df['Close'], window=14)
    
    df['Stoch_K'] = ta.momentum.stoch(df['High'], df['Low'], df['Close'])
    df['Stoch_D'] = ta.momentum.stoch_signal(df['High'], df['Low'], df['Close'])
    
    df['ADX_14'] = ta.trend.adx(df['High'], df['Low'], df['Close'], window=14)
    
    df['OBV'] = ta.volume.on_balance_volume(df['Close'], df['Volume'])
    
    df['VWAP'] = (df['Volume'] * (df['High'] + df['Low'] + df['Close']) / 3).cumsum() / df['Volume'].cumsum()
    
    df['Return_1D'] = df['Close'].pct_change(1)
    df['Return_3D'] = df['Close'].pct_change(3)
    df['Return_5D'] = df['Close'].pct_change(5)
    
    df['Volatility_10D'] = df['Return_1D'].rolling(window=10).std()
    df['Volatility_20D'] = df['Return_1D'].rolling(window=20).std()
    
    df['High_Low_Range'] = (df['High'] - df['Low']) / df['Close']
    df['Open_Close_Range'] = (df['Close'] - df['Open']) / df['Open']
    
    df['Volume_SMA_10'] = ta.trend.sma_indicator(df['Volume'], window=10)
    df['Volume_Ratio'] = df['Volume'] / df['Volume_SMA_10']
    
    df = df.dropna()
    
    print(f"[+] Added technical indicators. Final shape: {df.shape}")
    
    return df


def prepare_features(df, target_col='Close'):
    feature_cols = [col for col in df.columns if col != target_col]
    
    print(f"[*] Total features: {len(feature_cols)}")
    print(f"[*] Features: {feature_cols}")
    
    return df[feature_cols], df[target_col], feature_cols


def create_sequences(features, targets, seq_length=60, predict_days=1):
    X, y = [], []
    
    for i in range(len(features) - seq_length - predict_days + 1):
        X.append(features[i:(i + seq_length)])
        y.append(targets.iloc[i + seq_length + predict_days - 1])
    
    return np.array(X), np.array(y)
