'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MultiplierHistoryItem {
  optionChange: number
  underlyingChange: number
  multiplier: number
}

export default function OptionsCalculator() {
  // Account Settings
  const [capital, setCapital] = useState<number>(10000)
  const [riskPercent, setRiskPercent] = useState<number>(2)
  const [riskAmount, setRiskAmount] = useState<number>(0)

  // Option Data
  const [optionChange, setOptionChange] = useState<number>(0)
  const [underlyingChange, setUnderlyingChange] = useState<number>(0)
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0)

  // Position Parameters
  const [avgMultiplier, setAvgMultiplier] = useState<number>(65)
  const [takeProfit, setTakeProfit] = useState<number>(0.33)
  const [stopLoss, setStopLoss] = useState<number>(2)
  const [premium, setPremium] = useState<number>(5)
  const [lotSize, setLotSize] = useState<number>(1)
  const [method, setMethod] = useState<'average' | 'conservative' | 'riskparity'>('average')

  // Results
  const [optionMoveTP, setOptionMoveTP] = useState<number>(0)
  const [optionMoveSL, setOptionMoveSL] = useState<number>(0)
  const [contractsToBuy, setContractsToBuy] = useState<number>(0)
  const [totalPremium, setTotalPremium] = useState<number>(0)
  const [potentialProfit, setPotentialProfit] = useState<number>(0)
  const [potentialLoss, setPotentialLoss] = useState<number>(0)

  // History
  const [multiplierHistory, setMultiplierHistory] = useState<MultiplierHistoryItem[]>([])

  // Update risk amount when capital or risk percent changes
  useEffect(() => {
    const risk = (capital * riskPercent) / 100
    setRiskAmount(risk)
  }, [capital, riskPercent])

  // Calculate position when parameters change
  useEffect(() => {
    calculatePosition()
  }, [avgMultiplier, takeProfit, stopLoss, method, multiplierHistory, premium, lotSize])

  const calculateMultiplier = () => {
    if (!optionChange || !underlyingChange || underlyingChange === 0) {
      alert('Please enter valid option and underlying changes')
      return
    }

    const multiplier = Math.abs(optionChange / underlyingChange)
    setCurrentMultiplier(multiplier)

    const newItem: MultiplierHistoryItem = {
      optionChange,
      underlyingChange,
      multiplier
    }

    setMultiplierHistory(prev => [...prev, newItem])
    updateAverageMultiplier([...multiplierHistory, newItem])
  }

  const updateAverageMultiplier = (history: MultiplierHistoryItem[]) => {
    if (history.length === 0) return

    const sum = history.reduce((acc, item) => acc + item.multiplier, 0)
    const avg = sum / history.length
    setAvgMultiplier(avg)
  }

  const clearHistory = () => {
    if (confirm('Clear all multiplier history?')) {
      setMultiplierHistory([])
      setAvgMultiplier(65)
    }
  }

  const calculatePosition = () => {
    if (!avgMultiplier || !takeProfit || !stopLoss || !premium || !lotSize) {
      setOptionMoveTP(0)
      setOptionMoveSL(0)
      setContractsToBuy(0)
      setTotalPremium(0)
      setPotentialProfit(0)
      setPotentialLoss(0)
      return
    }

    let effectiveMultiplier = avgMultiplier

    if (method === 'conservative') {
      const maxMultiplier = multiplierHistory.length > 0
        ? Math.max(...multiplierHistory.map(m => m.multiplier))
        : avgMultiplier * 1.3
      effectiveMultiplier = maxMultiplier
    }

    const moveTP = takeProfit * effectiveMultiplier
    const moveSL = stopLoss * effectiveMultiplier

    setOptionMoveTP(moveTP)
    setOptionMoveSL(moveSL)

    // Calculate position size
    // Premium per lot = premium * lotSize
    const premiumPerLot = premium * lotSize

    // Loss per lot at stop loss = premiumPerLot * (moveSL / 100)
    const lossPerLot = premiumPerLot * (moveSL / 100)

    // Lots to buy = Risk Amount / Loss per lot
    // Allow fractional lots
    if (lossPerLot > 0) {
      const lots = riskAmount / lossPerLot
      setContractsToBuy(lots)
      setTotalPremium(lots * premiumPerLot)

      // Potential profit = lots * premiumPerLot * (moveTP / 100)
      setPotentialProfit(lots * premiumPerLot * (moveTP / 100))

      // Potential loss = lots * lossPerLot
      setPotentialLoss(lots * lossPerLot)
    } else {
      setContractsToBuy(0)
      setTotalPremium(0)
      setPotentialProfit(0)
      setPotentialLoss(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 p-4 md:p-6">
      <div className="mx-auto max-w-6xl bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-purple-600 mb-2">
          📊 Options Position Size Calculator
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Calculate optimal position size based on option leverage multiplier
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-700 border-b-2 border-purple-500 pb-2">
                💰 Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="capital">Total Capital ($)</Label>
                <Input
                  id="capital"
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  step={100}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="riskPercent">Risk Per Trade (%)</Label>
                <Input
                  id="riskPercent"
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  step={0.1}
                  min={0.1}
                  max={10}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="riskAmount">Risk Amount ($)</Label>
                <Input
                  id="riskAmount"
                  type="number"
                  value={riskAmount.toFixed(2)}
                  readOnly
                  className="mt-1 bg-gray-100"
                />
              </div>
            </CardContent>
          </Card>

          {/* Option Data Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-700 border-b-2 border-purple-500 pb-2">
                📈 Option Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="optionChange">Option Price Change (%)</Label>
                <Input
                  id="optionChange"
                  type="number"
                  value={optionChange || ''}
                  onChange={(e) => setOptionChange(Number(e.target.value))}
                  placeholder="e.g., 101 or -16.39"
                  step={0.01}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="underlyingChange">Underlying (ETH) Change (%)</Label>
                <Input
                  id="underlyingChange"
                  type="number"
                  value={underlyingChange || ''}
                  onChange={(e) => setUnderlyingChange(Number(e.target.value))}
                  placeholder="e.g., 1.17 or -0.23"
                  step={0.01}
                  className="mt-1"
                />
              </div>
              <Button onClick={calculateMultiplier} className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:opacity-90">
                Calculate Multiplier
              </Button>
              <div>
                <Label htmlFor="currentMultiplier">Current Multiplier</Label>
                <Input
                  id="currentMultiplier"
                  type="number"
                  value={currentMultiplier > 0 ? currentMultiplier.toFixed(2) : ''}
                  readOnly
                  className="mt-1 bg-gray-100 font-bold text-purple-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Position Parameters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-700 border-b-2 border-purple-500 pb-2">
                ⚙️ Position Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="avgMultiplier">Average Multiplier (Manual)</Label>
                <Input
                  id="avgMultiplier"
                  type="number"
                  value={avgMultiplier}
                  onChange={(e) => setAvgMultiplier(Number(e.target.value))}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="takeProfit">Take Profit (%)</Label>
                <Input
                  id="takeProfit"
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  step={0.01}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  step={0.1}
                  min={0.1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="premium">Option Premium per Contract ($)</Label>
                <Input
                  id="premium"
                  type="number"
                  value={premium}
                  onChange={(e) => setPremium(Number(e.target.value))}
                  step={0.01}
                  min={0.01}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lotSize">Lot Size</Label>
                <Input
                  id="lotSize"
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(Number(e.target.value))}
                  step={0.01}
                  min={0.01}
                  placeholder="e.g., 0.15, 1, 100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="method">Sizing Method</Label>
                <Select value={method} onValueChange={(value: any) => setMethod(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="average">Average Multiplier</SelectItem>
                    <SelectItem value="conservative">Conservative (Higher Risk)</SelectItem>
                    <SelectItem value="riskparity">Risk Parity (Simple)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={calculatePosition} className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:opacity-90">
                Calculate Position
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Card */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white mb-6">
          <CardHeader>
            <CardTitle className="text-white border-b-2 border-white/30 pb-2">
              🎯 Position Size Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Option Move at TP</div>
                <div className="text-2xl font-bold text-green-400">
                  +{optionMoveTP.toFixed(2)}%
                </div>
                <div className="text-sm mt-2 opacity-80">
                  Premium: ${premium.toFixed(2)} → ${((premium * (1 + optionMoveTP / 100))).toFixed(2)}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-sm opacity-90 mb-1">Option Move at SL</div>
                <div className="text-2xl font-bold text-red-400">
                  -{optionMoveSL.toFixed(2)}%
                </div>
                <div className="text-sm mt-2 opacity-80">
                  Premium: ${premium.toFixed(2)} → ${((premium * (1 - optionMoveSL / 100))).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Size Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 border-b-2 border-purple-500 pb-2">
              💼 Position Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Lots to Buy</div>
                <div className="text-2xl font-bold text-purple-600">
                  {contractsToBuy.toFixed(3)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Lot Size: {lotSize}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Total Premium</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalPremium.toFixed(2)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Potential Profit</div>
                <div className="text-2xl font-bold text-green-600">
                  +${potentialProfit.toFixed(2)}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <div className="text-sm text-gray-600 mb-1">Potential Loss</div>
                <div className="text-2xl font-bold text-red-600">
                  -${potentialLoss.toFixed(2)}
                </div>
              </div>
            </div>
            {contractsToBuy > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <div className="font-semibold mb-1">📌 Position Summary:</div>
                <div>
                  • Buy <span className="font-bold text-purple-600">{contractsToBuy.toFixed(3)}</span> lots (size: {lotSize}) at <span className="font-bold">${premium.toFixed(2)}</span>/contract
                </div>
                <div>
                  • Total contracts: <span className="font-bold">{(contractsToBuy).toFixed(3)}</span>
                </div>
                <div>
                  • Total cost: <span className="font-bold text-blue-600">${totalPremium.toFixed(2)}</span> ({((totalPremium / capital) * 100).toFixed(2)}% of capital)
                </div>
                <div>
                  • Risk: <span className="font-bold text-red-600">${potentialLoss.toFixed(2)}</span> ({((potentialLoss / totalPremium) * 100).toFixed(2)}% of position)
                </div>
                <div>
                  • Reward: <span className="font-bold text-green-600">${potentialProfit.toFixed(2)}</span> ({((potentialProfit / totalPremium) * 100).toFixed(2)}% of position)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-cyan-50 border-cyan-500 text-cyan-900 mb-6">
          <CardContent className="pt-6">
            <p className="font-semibold mb-2">💡 How to Use:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Enter your actual option and underlying price changes to calculate the multiplier</li>
              <li>Build a history of multipliers to find your average</li>
              <li>Use the average multiplier to calculate optimal position size</li>
              <li>The calculator accounts for the leverage effect of options on the underlying asset</li>
            </ol>
          </CardContent>
        </Card>

        {/* History Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 border-b-2 border-purple-500 pb-2">
              📊 Multiplier History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {multiplierHistory.length === 0 ? (
                <p className="text-gray-400 text-center text-sm">No multipliers calculated yet</p>
              ) : (
                multiplierHistory.slice().reverse().map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg text-sm border-l-4 border-purple-500"
                  >
                    <div className="font-semibold text-purple-600">
                      Multiplier: {item.multiplier.toFixed(2)}x
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      Option: {item.optionChange > 0 ? '+' : ''}{item.optionChange.toFixed(2)}% |{' '}
                      Underlying: {item.underlyingChange > 0 ? '+' : ''}{item.underlyingChange.toFixed(2)}%
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={clearHistory}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              Clear History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
