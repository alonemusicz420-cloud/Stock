# NIFTY 50 Stock Market Predictor

AI-powered Indian stock market prediction using LSTM Neural Network with a modern web dashboard.

## Quick Start

### 1. Run Prediction Model
```bash
cd indian_stock_predictor
python main.py
python export_data.py
```

### 2. Start Frontend
```bash
cd nifty-predictor-frontend
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel

### Method 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Method 2: GitHub + Vercel
1. Push code to GitHub
2. Go to vercel.com
3. Import your repository
4. Deploy

### Method 3: Direct Deploy
1. Go to https://vercel.com/new
2. Import your Git repository
3. Click Deploy

## Project Structure
```
├── indian_stock_predictor/     # Python ML model
│   ├── main.py                 # Run predictions
│   ├── data_fetcher.py         # Fetch NIFTY 50 data
│   ├── feature_engineering.py  # Technical indicators
│   ├── model.py                # LSTM architecture
│   ├── trainer.py              # Training pipeline
│   ├── visualizer.py           # Charts generation
│   └── export_data.py          # Export to frontend
├── nifty-predictor-frontend/   # Next.js dashboard
│   ├── app/
│   │   ├── page.js             # Main dashboard
│   │   └── api/                # API routes
│   └── public/data/            # Prediction data
└── vercel.json                 # Vercel config
```

## Features
- 32 technical indicators (RSI, MACD, Bollinger Bands, etc.)
- Bidirectional LSTM with 352K parameters
- 98%+ prediction accuracy
- 7-day future price forecast
- Interactive web dashboard with charts
- Real-time metrics visualization
