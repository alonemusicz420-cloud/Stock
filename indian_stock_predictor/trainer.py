import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import pickle
import os


class DataScaler:
    def __init__(self):
        self.feature_scaler = MinMaxScaler(feature_range=(0, 1))
        self.target_scaler = MinMaxScaler(feature_range=(0, 1))
    
    def fit_transform(self, features, target):
        X_scaled = self.feature_scaler.fit_transform(features)
        y_scaled = self.target_scaler.fit_transform(target.values.reshape(-1, 1))
        return X_scaled, y_scaled.flatten()
    
    def transform(self, features):
        return self.feature_scaler.transform(features)
    
    def inverse_transform_target(self, scaled_predictions):
        return self.target_scaler.inverse_transform(scaled_predictions.reshape(-1, 1)).flatten()
    
    def save(self, filepath="models/scalers.pkl"):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump({
                'feature_scaler': self.feature_scaler,
                'target_scaler': self.target_scaler
            }, f)
        print(f"[+] Scalers saved to {filepath}")
    
    @classmethod
    def load(cls, filepath="models/scalers.pkl"):
        with open(filepath, 'rb') as f:
            scalers = pickle.load(f)
        instance = cls()
        instance.feature_scaler = scalers['feature_scaler']
        instance.target_scaler = scalers['target_scaler']
        print(f"[+] Scalers loaded from {filepath}")
        return instance


def train_test_split_time_series(X, y, dates, train_ratio=0.8):
    split_idx = int(len(X) * train_ratio)
    
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    train_dates, test_dates = dates[:split_idx], dates[split_idx:]
    
    val_split_idx = int(len(X_train) * 0.85)
    X_train_final, X_val = X_train[:val_split_idx], X_train[val_split_idx:]
    y_train_final, y_val = y_train[:val_split_idx], y_train[val_split_idx:]
    
    print(f"[*] Train: {len(X_train_final)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    return (X_train_final, y_train_final), (X_val, y_val), (X_test, y_test), (train_dates[:val_split_idx], train_dates[val_split_idx:], test_dates)


def evaluate_model(y_true, y_pred):
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    accuracy = max(0, 100 - mape)
    
    direction_true = np.diff(y_true) > 0
    direction_pred = np.diff(y_pred) > 0
    direction_accuracy = np.mean(direction_true == direction_pred) * 100
    
    print("\n" + "="*50)
    print("MODEL PERFORMANCE METRICS")
    print("="*50)
    print(f"RMSE:           Rs.{rmse:,.2f}")
    print(f"MAE:            Rs.{mae:,.2f}")
    print(f"R² Score:       {r2:.4f}")
    print(f"MAPE:           {mape:.2f}%")
    print(f"Accuracy:       {accuracy:.2f}%")
    print(f"Direction Acc:  {direction_accuracy:.2f}%")
    print("="*50 + "\n")
    
    return {
        'rmse': rmse,
        'mae': mae,
        'r2': r2,
        'mape': mape,
        'accuracy': accuracy,
        'direction_accuracy': direction_accuracy
    }


def predict_next_days(model, scaler, last_sequence, n_days=5):
    import torch
    predictions = []
    current_seq = last_sequence.copy()
    
    model.eval()
    with torch.no_grad():
        for _ in range(n_days):
            input_tensor = torch.FloatTensor(current_seq).unsqueeze(0)
            pred_scaled = model(input_tensor).numpy()
            pred_original = scaler.inverse_transform_target(pred_scaled.reshape(-1, 1)).flatten()[0]
            predictions.append(pred_original)
            
            new_row = current_seq[-1].copy()
            new_row[0] = pred_scaled.flatten()[0]
            current_seq = np.vstack([current_seq[1:], new_row])
    
    return np.array(predictions)
