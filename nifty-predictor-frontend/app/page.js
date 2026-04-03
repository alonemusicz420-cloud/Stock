'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts'

function SignalBadge({ signal, strength }) {
  const isBuy = signal.includes('BUY')
  const isSell = signal.includes('SELL')
  const isStrong = signal.includes('STRONG')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        padding: '8px 20px',
        borderRadius: '25px',
        fontWeight: 800,
        fontSize: isStrong ? '14px' : '12px',
        letterSpacing: '1.5px',
        background: isBuy ? 'rgba(0, 230, 118, 0.15)' : isSell ? 'rgba(255, 23, 68, 0.15)' : 'rgba(255, 214, 0, 0.15)',
        color: isBuy ? '#00e676' : isSell ? '#ff1744' : '#ffd600',
        border: `1px solid ${isBuy ? 'rgba(0, 230, 118, 0.4)' : isSell ? 'rgba(255, 23, 68, 0.4)' : 'rgba(255, 214, 0, 0.4)'}`,
        boxShadow: isBuy ? '0 0 20px rgba(0, 230, 118, 0.2)' : isSell ? '0 0 20px rgba(255, 23, 68, 0.2)' : 'none',
        animation: isBuy || isSell ? 'pulse 2s ease-in-out infinite' : 'none'
      }}>
        {isBuy ? '▲' : isSell ? '▼' : '◆'} {signal}
      </span>
      <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${strength}%`,
          height: '100%',
          borderRadius: '3px',
          background: isBuy ? '#00e676' : isSell ? '#ff1744' : '#ffd600'
        }} />
      </div>
      <span style={{ fontSize: '12px', color: '#6a6a7a', fontFamily: 'monospace' }}>{strength}%</span>
    </div>
  )
}

function StockContainer({ stock, data }) {
  const isBuy = data.signal.includes('BUY')
  const isSell = data.signal.includes('SELL')
  const chartColor = isBuy ? '#00e676' : isSell ? '#ff1744' : '#ffd600'

  const chartData = [
    ...data.price_history.map((p, i) => ({
      label: data.history_dates[i] || '',
      price: p,
      type: 'history'
    })),
    ...data.future_predictions.map((fp) => ({
      label: fp.date,
      price: fp.price,
      type: 'predicted'
    }))
  ]

  const todayLabel = data.history_dates[data.history_dates.length - 1]

  return (
    <div style={{
      background: 'rgba(18, 18, 26, 0.6)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '30px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '15px',
            background: `linear-gradient(135deg, ${chartColor}33, ${chartColor}11)`,
            border: `1px solid ${chartColor}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {stock === 'NIFTY 50' ? '📊' : stock === 'IDEA' ? '💡' : stock === 'RENUKA' ? '🏭' : '🏦'}
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{stock}</h2>
            <p style={{ fontSize: '12px', color: '#6a6a7a', margin: 0 }}>NSE • Last updated: {data.last_updated}</p>
          </div>
        </div>
        <SignalBadge signal={data.signal} strength={data.signal_strength} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '18px' }}>
          <p style={{ fontSize: '11px', color: '#6a6a7a', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Price</p>
          <p style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', margin: 0 }}>₹{data.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '18px' }}>
          <p style={{ fontSize: '11px', color: '#6a6a7a', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>7-Day Change</p>
          <p style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', margin: 0, color: data.change_percent >= 0 ? '#00e676' : '#ff1744' }}>
            {data.change_percent >= 0 ? '+' : ''}{data.change_percent}%
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '18px' }}>
          <p style={{ fontSize: '11px', color: '#6a6a7a', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>RSI</p>
          <p style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', margin: 0, color: data.rsi > 70 ? '#ff1744' : data.rsi < 30 ? '#00e676' : '#ffffff' }}>
            {data.rsi || 'N/A'}
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '18px' }}>
          <p style={{ fontSize: '11px', color: '#6a6a7a', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Accuracy</p>
          <p style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', margin: 0, color: '#2979ff' }}>{data.metrics.accuracy}%</p>
        </div>
      </div>

      <div style={{ height: '350px', marginBottom: '25px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${stock}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
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
              tickFormatter={(v) => `₹${typeof v === 'number' ? v.toLocaleString() : v}`}
            />
            <Tooltip
              contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
              formatter={(value) => [`₹${typeof value === 'number' ? value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : value}`, 'Price']}
            />
            <ReferenceLine x={todayLabel} stroke="#ffd600" strokeDasharray="3 3" label={{ value: 'TODAY', fill: '#ffd600', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2.5}
              fill={`url(#grad-${stock})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#aa00ff' }}>📈</span> 7-Day Price Prediction
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '11px', color: '#6a6a7a', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '12px 15px', fontSize: '11px', color: '#6a6a7a', textTransform: 'uppercase', letterSpacing: '1px' }}>Predicted Price</th>
                <th style={{ textAlign: 'right', padding: '12px 15px', fontSize: '11px', color: '#6a6a7a', textTransform: 'uppercase', letterSpacing: '1px' }}>Change</th>
                <th style={{ textAlign: 'center', padding: '12px 15px', fontSize: '11px', color: '#6a6a7a', textTransform: 'uppercase', letterSpacing: '1px' }}>Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.future_predictions.map((fp, i) => {
                const prevPrice = i === 0 ? data.current_price : data.future_predictions[i - 1].price
                const dayChange = ((fp.price - prevPrice) / prevPrice) * 100
                const isUp = dayChange >= 0
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 15px', fontWeight: 600 }}>
                      {new Date(fp.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 15px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '15px' }}>
                      ₹{fp.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 15px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: isUp ? '#00e676' : '#ff1744' }}>
                      {isUp ? '▲' : '▼'} {Math.abs(dayChange).toFixed(2)}%
                    </td>
                    <td style={{ padding: '14px 15px', textAlign: 'center' }}>
                      <span style={{
                        padding: '5px 14px',
                        borderRadius: '15px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        background: isUp ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 23, 68, 0.12)',
                        color: isUp ? '#00e676' : '#ff1744',
                        border: `1px solid ${isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 23, 68, 0.3)'}`
                      }}>
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
    </div>
  )
}

export default function Home() {
  const [allData, setAllData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    fetch('/api/predictions')
      .then(res => res.json())
      .then(json => {
        setAllData(json.stocks)
        setLastUpdate(json.last_updated)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', margin: '0 auto 20px', border: '3px solid rgba(41, 121, 255, 0.2)', borderTopColor: '#2979ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6a6a7a' }}>Loading predictions...</p>
        </div>
      </div>
    )
  }

  if (!allData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'rgba(18, 18, 26, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚠️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>No Data Available</h2>
          <p style={{ color: '#6a6a7a', fontSize: '14px', marginBottom: '20px' }}>Run the Python prediction script first.</p>
          <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', textAlign: 'left', fontSize: '13px', lineHeight: 1.8 }}>
            cd indian_stock_predictor<br />
            python main.py<br />
            python export_data.py
          </code>
        </div>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', padding: '30px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #0a0a0f; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <header style={{ marginBottom: '40px', animation: 'slideUp 0.5s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, background: 'linear-gradient(135deg, #00e676, #2979ff, #aa00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '5px' }}>
              StockAI Pro
            </h1>
            <p style={{ color: '#6a6a7a', fontSize: '14px' }}>AI-Powered Indian Stock Market Predictions</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '12px', color: '#6a6a7a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: '#00e676', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Updated: {lastUpdate}
            </span>
          </div>
        </div>
      </header>

      {Object.entries(allData).map(([stock, data], i) => (
        <div key={stock} style={{ animation: `slideUp 0.5s ease-out ${i * 0.15}s both` }}>
          <StockContainer stock={stock} data={data} />
        </div>
      ))}

      <div style={{ textAlign: 'center', padding: '30px 0', color: '#4a4a5a', fontSize: '12px', animation: 'slideUp 0.5s ease-out 0.6s both' }}>
        <p>Built with Bidirectional LSTM Neural Network • 17 Technical Indicators • Not financial advice</p>
      </div>
    </main>
  )
}
