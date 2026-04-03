import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
import numpy as np
import os


def plot_predictions_vs_actual(y_true, y_pred, test_dates, title="NIFTY 50 Predictions vs Actual", save_path="results/predictions_plot.png"):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    plt.figure(figsize=(14, 7))
    plt.style.use('seaborn-v0_8-darkgrid')
    
    plt.plot(test_dates, y_true, label='Actual', color='#1f77b4', linewidth=2, alpha=0.8)
    plt.plot(test_dates, y_pred, label='Predicted', color='#ff7f0e', linewidth=2, alpha=0.8, linestyle='--')
    
    plt.title(title, fontsize=16, fontweight='bold', pad=15)
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('NIFTY 50 Price', fontsize=12)
    plt.legend(fontsize=11)
    plt.xticks(rotation=45)
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.MonthLocator(interval=2))
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[+] Plot saved to {save_path}")


def plot_training_history(history, save_path="results/training_history.png"):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    axes[0].plot(history['loss'], label='Train Loss', color='#1f77b4', linewidth=2)
    axes[0].plot(history['val_loss'], label='Val Loss', color='#ff7f0e', linewidth=2)
    axes[0].set_title('Model Loss', fontsize=14, fontweight='bold')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    axes[1].plot(history['mae'], label='Train MAE', color='#2ca02c', linewidth=2)
    axes[1].plot(history['val_mae'], label='Val MAE', color='#d62728', linewidth=2)
    axes[1].set_title('Model MAE', fontsize=14, fontweight='bold')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('MAE')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[+] Training history plot saved to {save_path}")


def plot_future_predictions(actual_dates, actual_prices, future_dates, future_prices, save_path="results/future_predictions.png"):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    plt.figure(figsize=(14, 7))
    
    plt.plot(actual_dates[-60:], actual_prices[-60:], label='Actual (Last 60 Days)', color='#1f77b4', linewidth=2)
    plt.plot(future_dates, future_prices, label='Predicted Future', color='#ff7f0e', linewidth=3, marker='o', markersize=8)
    
    plt.axvline(x=actual_dates[-1], color='gray', linestyle='--', alpha=0.5, label='Today')
    
    plt.title('NIFTY 50 Future Price Prediction', fontsize=16, fontweight='bold', pad=15)
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('NIFTY 50 Price', fontsize=12)
    plt.legend(fontsize=11)
    plt.xticks(rotation=45)
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[+] Future predictions plot saved to {save_path}")


def plot_metrics_bar(metrics, save_path="results/metrics_bar.png"):
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    metric_names = ['R² Score', 'Accuracy (%)', 'Direction Acc (%)']
    metric_values = [metrics['r2'] * 100, metrics['accuracy'], metrics['direction_accuracy']]
    
    colors = ['#2ca02c' if v > 80 else '#ff7f0e' if v > 60 else '#d62728' for v in metric_values]
    
    bars = ax.barh(metric_names, metric_values, color=colors, edgecolor='black', height=0.5)
    
    for bar, val in zip(bars, metric_values):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2, 
                f'{val:.2f}%', va='center', fontsize=12, fontweight='bold')
    
    ax.set_xlim(0, 110)
    ax.set_title('Model Performance Summary', fontsize=16, fontweight='bold', pad=15)
    ax.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"[+] Metrics bar plot saved to {save_path}")
