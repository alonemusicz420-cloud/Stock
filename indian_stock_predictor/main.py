import yfinance as yf
import pandas as pd
import numpy as np
import ta
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import torch.optim as optim
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import json
import os
import pickle
from datetime import datetime, timedelta


STOCKS = {
    'NIFTY 50': '^NSEI',
    'IDEA': 'IDEA.NS',
    'RENUKA': 'RENUKA.NS',
    'YESBANK': 'YESBANK.NS'
}


class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size=64, dropout_rate=0.2):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True, num_layers=2, dropout=dropout_rate, bidirectional=True)
        self.bn = nn.BatchNorm1d(hidden_size * 2)
        self.dropout = nn.Dropout(dropout_rate)
        self.fc1 = nn.Linear(hidden_size * 2, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        out = self.bn(out)
        out = self.dropout(out)
        out = self.fc1(out)
        out = self.relu(out)
        out = self.fc2(out)
        return out.squeeze(-1)


def fetch_stock_data(symbol, period="2y"):
    ticker = STOCKS.get(symbol, symbol)
    print(f"[*] Fetching {symbol}...")
    data = yf.download(ticker, period=period, progress=False)
    if data.empty:
        raise ValueError(f"Failed to fetch {symbol}")
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)
    data = data.dropna()
    print(f"[+] {symbol}: {len(data)} days")
    return data


def add_indicators(df):
    df = df.copy()
    df['SMA_10'] = ta.trend.sma_indicator(df['Close'], window=10)
    df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
    df['EMA_12'] = ta.trend.ema_indicator(df['Close'], window=12)
    df['RSI'] = ta.momentum.rsi(df['Close'], window=14)
    macd = ta.trend.MACD(df['Close'])
    df['MACD'] = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    bb = ta.volatility.BollingerBands(df['Close'])
    df['BB_High'] = bb.bollinger_hband()
    df['BB_Low'] = bb.bollinger_lband()
    df['ATR'] = ta.volatility.average_true_range(df['High'], df['Low'], df['Close'], window=14)
    df['Return'] = df['Close'].pct_change()
    df['Volatility'] = df['Return'].rolling(10).std()
    df['Range'] = (df['High'] - df['Low']) / df['Close']
    df = df.dropna()
    return df


def create_sequences(features, targets, seq_length=30):
    X, y = [], []
    for i in range(len(features) - seq_length):
        X.append(features[i:i+seq_length])
        y.append(targets[i+seq_length])
    return np.array(X), np.array(y)


def get_buy_sell_signal(current_price, predicted_prices, rsi=None, macd_hist=None):
    avg_pred = np.mean(predicted_prices[:3])
    change_pct = ((avg_pred - current_price) / current_price) * 100
    
    if change_pct > 1.5:
        signal = "STRONG BUY"
        strength = min(100, int(abs(change_pct) * 20))
    elif change_pct > 0.5:
        signal = "BUY"
        strength = min(100, int(abs(change_pct) * 15))
    elif change_pct < -1.5:
        signal = "STRONG SELL"
        strength = min(100, int(abs(change_pct) * 20))
    elif change_pct < -0.5:
        signal = "SELL"
        strength = min(100, int(abs(change_pct) * 15))
    else:
        signal = "HOLD"
        strength = 50
    
    if rsi is not None:
        if rsi < 30 and signal in ["BUY", "STRONG BUY"]:
            signal = "STRONG BUY"
            strength = min(100, strength + 15)
        elif rsi > 70 and signal in ["SELL", "STRONG SELL"]:
            signal = "STRONG SELL"
            strength = min(100, strength + 15)
    
    return signal, strength, round(change_pct, 2)


def train_and_predict(symbol, data, seq_length=30, epochs=50):
    print(f"\n{'='*50}")
    print(f"  Training: {symbol}")
    print(f"{'='*50}")
    
    df = add_indicators(data)
    feature_cols = ['Close', 'High', 'Low', 'Open', 'Volume', 'SMA_10', 'SMA_20', 'EMA_12', 'RSI', 'MACD', 'MACD_Signal', 'BB_High', 'BB_Low', 'ATR', 'Return', 'Volatility', 'Range']
    features = df[feature_cols].values
    target = df['Close'].values
    
    feat_scaler = MinMaxScaler()
    target_scaler = MinMaxScaler()
    X_scaled = feat_scaler.fit_transform(features)
    y_scaled = target_scaler.fit_transform(target.reshape(-1, 1)).flatten()
    
    X, y = create_sequences(X_scaled, y_scaled, seq_length)
    
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    
    val_split = int(len(X_train) * 0.85)
    X_train_final, X_val = X_train[:val_split], X_train[val_split:]
    y_train_final, y_val = y_train[:val_split], y_train[val_split:]
    
    model = LSTMModel(input_size=X_train_final.shape[2])
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, factor=0.5, patience=8, min_lr=1e-6)
    criterion = nn.HuberLoss()
    
    train_ds = TensorDataset(torch.FloatTensor(X_train_final), torch.FloatTensor(y_train_final))
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    
    best_val = float('inf')
    patience = 0
    for epoch in range(epochs):
        model.train()
        for xb, yb in train_loader:
            optimizer.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
        
        model.eval()
        with torch.no_grad():
            val_pred = model(torch.FloatTensor(X_val))
            val_loss = criterion(val_pred, torch.FloatTensor(y_val)).item()
        
        scheduler.step(val_loss)
        if val_loss < best_val:
            best_val = val_loss
            patience = 0
            torch.save(model.state_dict(), f'models/{symbol.replace(" ", "_")}.pth')
        else:
            patience += 1
            if patience >= 15:
                break
    
    model.load_state_dict(torch.load(f'models/{symbol.replace(" ", "_")}.pth', weights_only=True))
    model.eval()
    
    with torch.no_grad():
        test_pred_scaled = model(torch.FloatTensor(X_test)).numpy()
    
    test_pred = target_scaler.inverse_transform(test_pred_scaled.reshape(-1, 1)).flatten()
    test_actual = target_scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
    
    rmse = np.sqrt(mean_squared_error(test_actual, test_pred))
    mae = mean_absolute_error(test_actual, test_pred)
    r2 = r2_score(test_actual, test_pred)
    mape = np.mean(np.abs((test_actual - test_pred) / test_actual)) * 100
    accuracy = max(0, 100 - mape)
    
    last_seq = X_scaled[-seq_length:]
    future_preds = []
    current = last_seq.copy()
    with torch.no_grad():
        for _ in range(7):
            inp = torch.FloatTensor(current).unsqueeze(0)
            pred_s = model(inp).numpy()[0]
            pred_orig = target_scaler.inverse_transform([[pred_s]])[0, 0]
            future_preds.append(float(pred_orig))
            new_row = current[-1].copy()
            new_row[0] = pred_s
            current = np.vstack([current[1:], new_row])
    
    current_price = float(df['Close'].iloc[-1])
    rsi_val = float(df['RSI'].iloc[-1]) if 'RSI' in df.columns else None
    signal, strength, change_pct = get_buy_sell_signal(current_price, future_preds, rsi=rsi_val)
    
    dates = pd.bdate_range(start=df.index[-1] + timedelta(days=1), periods=7)
    future_data = []
    for i, (d, p) in enumerate(zip(dates, future_preds)):
        prev_p = current_price if i == 0 else future_data[i-1]['price']
        future_data.append({
            'date': d.strftime('%Y-%m-%d'),
            'price': round(p, 2),
            'change': round(((p - prev_p) / prev_p) * 100, 2) if i > 0 else round(((p - current_price) / current_price) * 100, 2)
        })
    
    price_history = df['Close'].values[-60:].tolist()
    history_dates = df.index[-60:].strftime('%Y-%m-%d').tolist()
    
    result = {
        'symbol': symbol,
        'current_price': round(current_price, 2),
        'signal': signal,
        'signal_strength': strength,
        'change_percent': change_pct,
        'rsi': round(rsi_val, 2) if rsi_val else None,
        'metrics': {
            'rmse': round(float(rmse), 2),
            'mae': round(float(mae), 2),
            'r2': round(float(r2), 4),
            'accuracy': round(float(accuracy), 2)
        },
        'future_predictions': future_data,
        'price_history': price_history,
        'history_dates': history_dates,
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    print(f"  Current: Rs.{current_price:,.2f} | Signal: {signal} ({strength}%)")
    print(f"  Accuracy: {accuracy:.1f}% | R2: {r2:.4f}")
    
    return result


def main():
    os.makedirs("models", exist_ok=True)
    os.makedirs("results", exist_ok=True)
    
    print("\n" + "="*60)
    print("  INDIAN STOCK MARKET PREDICTOR")
    print("  Multi-Stock LSTM Neural Network")
    print("="*60)
    
    all_results = {}
    
    for name, symbol in STOCKS.items():
        try:
            data = fetch_stock_data(name, period="2y")
            result = train_and_predict(name, data)
            all_results[name] = result
            
            os.makedirs(f'results/{name}', exist_ok=True)
            with open(f'results/{name}/prediction.json', 'w') as f:
                json.dump(result, f, indent=2)
        except Exception as e:
            print(f"[-] Error with {name}: {e}")
    
    summary = {
        'stocks': all_results,
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_stocks': len(all_results)
    }
    
    with open('results/all_predictions.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n{'='*60}")
    print("  SUMMARY")
    print(f"{'='*60}")
    for name, res in all_results.items():
        signal_color = "GREEN" if "BUY" in res['signal'] else "RED" if "SELL" in res['signal'] else "YELLOW"
        print(f"  {name:12} | Rs.{res['current_price']:>12,.2f} | {res['signal']:12} | Acc: {res['metrics']['accuracy']:.1f}%")
    print(f"{'='*60}\n")
    
    print("[+] All results saved to results/")
    print("[+] Run export_data.py to update the frontend")


if __name__ == "__main__":
    main()
