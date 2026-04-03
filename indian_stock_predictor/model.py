import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np


class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_sizes=[128, 64, 32], dropout_rate=0.2):
        super(LSTMModel, self).__init__()
        
        self.lstm1 = nn.LSTM(input_size, hidden_sizes[0], batch_first=True, bidirectional=True)
        self.bn1 = nn.BatchNorm1d(hidden_sizes[0] * 2)
        self.dropout1 = nn.Dropout(dropout_rate)
        
        self.lstm2 = nn.LSTM(hidden_sizes[0] * 2, hidden_sizes[1], batch_first=True, bidirectional=True)
        self.bn2 = nn.BatchNorm1d(hidden_sizes[1] * 2)
        self.dropout2 = nn.Dropout(dropout_rate)
        
        self.lstm3 = nn.LSTM(hidden_sizes[1] * 2, hidden_sizes[2], batch_first=True)
        self.bn3 = nn.BatchNorm1d(hidden_sizes[2])
        self.dropout3 = nn.Dropout(dropout_rate)
        
        self.fc1 = nn.Linear(hidden_sizes[2], 16)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(16, 1)
    
    def forward(self, x):
        out, _ = self.lstm1(x)
        out = out[:, -1, :]
        out = self.bn1(out)
        out = self.dropout1(out)
        
        out = out.unsqueeze(1).repeat(1, x.size(1), 1)
        out, _ = self.lstm2(out)
        out = out[:, -1, :]
        out = self.bn2(out)
        out = self.dropout2(out)
        
        out = out.unsqueeze(1).repeat(1, x.size(1), 1)
        out, _ = self.lstm3(out)
        out = out[:, -1, :]
        out = self.bn3(out)
        out = self.dropout3(out)
        
        out = self.fc1(out)
        out = self.relu(out)
        out = self.fc2(out)
        return out.squeeze(-1)


def build_model(input_size, hidden_sizes=[128, 64, 32], dropout_rate=0.2, learning_rate=0.001):
    model = LSTMModel(input_size, hidden_sizes, dropout_rate)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=10, min_lr=1e-6)
    criterion = nn.HuberLoss()
    
    return model, optimizer, scheduler, criterion


def train_model(model, optimizer, scheduler, criterion, X_train, y_train, X_val, y_val, epochs=100, batch_size=32, model_path="models/best_model.pth"):
    import os
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_val_t = torch.FloatTensor(X_val)
    y_val_t = torch.FloatTensor(y_val)
    
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    history = {'loss': [], 'val_loss': [], 'mae': [], 'val_mae': []}
    best_val_loss = float('inf')
    patience_counter = 0
    max_patience = 20
    
    print(f"[*] Training model...")
    print(f"[*] Training samples: {len(X_train)}, Validation samples: {len(X_val)}")
    print(f"[*] Epochs: {epochs}, Batch size: {batch_size}")
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0
        train_mae = 0
        n_batches = 0
        
        for X_batch, y_batch in train_loader:
            optimizer.zero_grad()
            predictions = model(X_batch)
            loss = criterion(predictions, y_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            
            train_loss += loss.item()
            train_mae += torch.mean(torch.abs(predictions - y_batch)).item()
            n_batches += 1
        
        avg_train_loss = train_loss / n_batches
        avg_train_mae = train_mae / n_batches
        
        model.eval()
        with torch.no_grad():
            val_predictions = model(X_val_t)
            val_loss = criterion(val_predictions, y_val_t).item()
            val_mae = torch.mean(torch.abs(val_predictions - y_val_t)).item()
        
        scheduler.step(val_loss)
        
        history['loss'].append(avg_train_loss)
        history['val_loss'].append(val_loss)
        history['mae'].append(avg_train_mae)
        history['val_mae'].append(val_mae)
        
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"  Epoch {epoch+1}/{epochs} - loss: {avg_train_loss:.6f} - val_loss: {val_loss:.6f} - val_mae: {val_mae:.6f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': val_loss,
                'input_size': X_train.shape[2],
            }, model_path)
        else:
            patience_counter += 1
            if patience_counter >= max_patience:
                print(f"\n[+] Early stopping at epoch {epoch+1}. Best val_loss: {best_val_loss:.6f}")
                break
    
    print(f"[+] Training complete. Best val_loss: {best_val_loss:.6f}")
    
    return model, history


def load_model(model_path="models/best_model.pth"):
    checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)
    model = LSTMModel(input_size=checkpoint['input_size'])
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    print(f"[+] Model loaded from {model_path}")
    return model
