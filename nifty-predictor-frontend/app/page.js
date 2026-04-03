'use client'

import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'

const STOCKS = ['NIFTY 50', 'IDEA', 'RENUKA', 'YESBANK']

const STOCK_ICONS = {
  'NIFTY 50': '📊',
  'IDEA': '💡',
  'RENUKA': '🏭',
  'YESBANK': '🏦'
}

function SignalBadge({ signal, strength }) {
  const isBuy = signal.includes('BUY')
  const isSell = signal.includes('SELL')
  const isStrong = signal.includes('STRONG')
  
  const cls = isBuy ? 'signal-buy' : isSell ? 'signal-sell' : 'signal-hold'
  const glow = isBuy ? 'glow-green' : isSell ? 'glow-red' : ''
  
  return (
    <div className="flex items-center gap-2">
      <span className={`signal-badge ${cls} ${glow} ${isStrong ? 'text-sm px-4 py-1.5' : ''}`}>
        {isBuy ? '▲' : isSell ? '▼' : '◆'} {signal}
      </span>
      <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isBuy ? 'bg-green-500' : isSell ? 'bg-red-500' : 'bg-yellow-500'}`}
          style={{ width: `${strength}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 font-mono">{strength}%</span>
    </div>
  )
}

function PriceCard({ stock, data, isActive, onClick }) {
  const isBuy = data.signal.includes('BUY')
  const isSell = data.signal.includes('SELL')
  
  return (
    <div 
      className={`glass-card stock-card p-5 ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{STOCK_ICONS[stock]}</span>
          <div>
            <h3 className="font-bold text-white text-sm">{stock}</h3>
            <p className="text-xs text-gray-500">NSE</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg font-mono">₹{data.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
      
      <SignalBadge signal={data.signal} strength={data.signal_strength} />
      
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={`font-mono ${data.change_percent >= 0 ? 'price-up' : 'price-down'}`}>
          {data.change_percent >= 0 ? '↑' : '↓'} {Math.abs(data.change_percent)}%
        </span>
        <span className="text-gray-500">Acc: {data.metrics.accuracy}%</span>
      </div>
      
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.price_history.map((p, i) => ({ i, p }))}>
            <Line type="monotone" dataKey="p" stroke={isBuy ? '#00e676' : isSell ? '#ff1744' : '#ffd600'} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LiveChart({ data, selectedStock }) {
  const [chartData, setChartData] = useState([])
  const [livePrice, setLivePrice] = useState(data.current_price)
  const [priceHistory, setPriceHistory] = useState([])
  const [flash, setFlash] = useState(null)
  
  const allData = [
    ...data.price_history.map((p, i) => ({
      label: data.history_dates[i] || '',
      price: p,
      type: 'history'
    })),
    ...data.future_predictions.map((fp, i) => ({
      label: fp.date,
      price: fp.price,
      type: 'predicted'
    }))
  ]
  
  useEffect(() => {
    setChartData(allData)
    setLivePrice(data.current_price)
    
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * data.current_price * 0.002
      const newPrice = data.current_price + jitter
      setLivePrice(prev => {
        const diff = newPrice - prev
        setFlash(diff > 0 ? 'up' : diff < 0 ? 'down' : null)
        setTimeout(() => setFlash(null), 500)
        return newPrice
      })
      setPriceHistory(prev => [...prev.slice(-50), { time: new Date().toLocaleTimeString(), price: newPrice }])
    }, 2000)
    
    return () => clearInterval(interval)
  }, [data])
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-gray-400 mb-1">{d.label}</p>
          <p className="font-bold font-mono text-white">₹{d.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <span className={`text-xs ${d.type === 'predicted' ? 'text-purple-400' : 'text-blue-400'}`}>
            {d.type === 'predicted' ? '● Predicted' : '● Actual'}
          </span>
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold">{selectedStock}</h2>
            <span className={`text-2xl font-mono font-bold transition-colors duration-300 ${flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-white'}`}>
              ₹{livePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">LIVE</span>
            </span>
          </div>
          <p className="text-xs text-gray-500">Simulated real-time price movement • Updates every 2s</p>
        </div>
        <SignalBadge signal={data.signal} strength={data.signal_strength} />
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2979ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2979ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#aa00ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#aa00ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis 
              dataKey="label" 
              stroke="#4a4a5a" 
              tick={{ fontSize: 11, fill: '#6a6a7a' }}
              tickFormatter={(v) => v ? v.slice(5) : ''}
            />
            <YAxis 
              stroke="#4a4a5a" 
              tick={{ fontSize: 11, fill: '#6a6a7a' }}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `₹${v.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={data.history_dates[data.history_dates.length - 1]} stroke="#ffd600" strokeDasharray="3 3" label={{ value: 'TODAY', fill: '#ffd600', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#2979ff" 
              strokeWidth={2}
              fill="url(#historyGrad)"
              connectNulls
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#aa00ff" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#predictedGrad)"
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">RSI</p>
          <p className={`font-mono font-bold ${data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-white'}`}>
            {data.rsi || 'N/A'}
          </p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">RMSE</p>
          <p className="font-mono font-bold text-white">₹{data.metrics.rmse.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">R² Score</p>
          <p className={`font-mono font-bold ${data.metrics.r2 > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.metrics.r2}
          </p>
        </div>
      </div>
    </div>
  )
}

function PredictionTable({ data }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-purple-400">📈</span> 7-Day Forecast
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800">
              <th className="text-left py-3 px-4">DATE</th>
              <th className="text-right py-3 px-4">PREDICTED PRICE</th>
              <th className="text-right py-3 px-4">CHANGE</th>
              <th className="text-center py-3 px-4">SIGNAL</th>
            </tr>
          </thead>
          <tbody>
            {data.future_predictions.map((fp, i) => {
              const prevPrice = i === 0 ? data.current_price : data.future_predictions[i - 1].price
              const dayChange = ((fp.price - prevPrice) / prevPrice) * 100
              const isUp = dayChange >= 0
              
              return (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium">{new Date(fp.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono font-bold text-sm">₹{fp.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono text-sm font-medium ${isUp ? 'price-up' : 'price-down'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(dayChange).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isUp ? 'signal-buy' : 'signal-sell'}`}>
                      {isUp ? 'BUY' : 'SELL'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Home() {
  const [allData, setAllData] = useState(null)
  const [selectedStock, setSelectedStock] = useState('NIFTY 50')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/predictions')
      if (res.ok) {
        const json = await res.json()
        setAllData(json.stocks)
        setLastUpdate(json.last_updated)
      }
    } catch (e) {
      console.error('Failed to fetch:', e)
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => { fetchData() }, [fetchData])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 animate-pulse">Loading predictions...</p>
        </div>
      </div>
    )
  }
  
  if (!allData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">No Data Available</h2>
          <p className="text-gray-400 text-sm mb-4">Run the Python prediction script first.</p>
          <code className="text-xs bg-gray-800 px-3 py-2 rounded block text-left">
            cd indian_stock_predictor<br/>
            python main.py<br/>
            python export_data.py
          </code>
        </div>
      </div>
    )
  }
  
  const currentData = allData[selectedStock]
  
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl md:text-4xl font-black gradient-text mb-1">StockAI Pro</h1>
          <p className="text-gray-500 text-sm">AI-Powered Indian Stock Market Predictions</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Last updated: {lastUpdate || 'N/A'}
          </div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STOCKS.map((stock, i) => (
          allData[stock] && (
            <div key={stock} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <PriceCard 
                stock={stock} 
                data={allData[stock]} 
                isActive={selectedStock === stock}
                onClick={() => setSelectedStock(stock)}
              />
            </div>
          )
        ))}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <LiveChart data={currentData} selectedStock={selectedStock} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <PredictionTable data={currentData} />
        </div>
      </div>
      
      <footer className="mt-8 text-center text-xs text-gray-600 animate-fade-in">
        <p>Built with LSTM Neural Network • 32 Technical Indicators • Not financial advice</p>
      </footer>
    </main>
  )
}
