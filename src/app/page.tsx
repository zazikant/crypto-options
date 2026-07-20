'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Options Position Size Calculator
              </h1>
              <p className="text-sm text-muted-foreground">
                Calculate optimal position size based on option leverage multiplier
              </p>
            </div>
            <Badge variant="outline" className="hidden h-7 px-3 font-mono text-xs md:inline-flex">
              v0.1
            </Badge>
          </div>
          <Separator className="mt-6" />
        </header>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Settings</CardTitle>
              <CardDescription>Capital and per-trade risk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capital">Total Capital ($)</Label>
                <Input
                  id="capital"
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  step={100}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskPercent">Risk Per Trade (%)</Label>
                <Input
                  id="riskPercent"
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  step={0.1}
                  min={0.1}
                  max={10}
                  className="font-mono"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="riskAmount">Risk Amount ($)</Label>
                <Input
                  id="riskAmount"
                  type="number"
                  value={riskAmount.toFixed(2)}
                  readOnly
                  className="bg-muted font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Option Data Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Option Data</CardTitle>
              <CardDescription>Derive the leverage multiplier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="optionChange">Option Price Change (%)</Label>
                <Input
                  id="optionChange"
                  type="number"
                  value={optionChange || ''}
                  onChange={(e) => setOptionChange(Number(e.target.value))}
                  placeholder="e.g. 101 or -16.39"
                  step={0.01}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="underlyingChange">Underlying (ETH) Change (%)</Label>
                <Input
                  id="underlyingChange"
                  type="number"
                  value={underlyingChange || ''}
                  onChange={(e) => setUnderlyingChange(Number(e.target.value))}
                  placeholder="e.g. 1.17 or -0.23"
                  step={0.01}
                  className="font-mono"
                />
              </div>
              <Button onClick={calculateMultiplier} variant="default" className="w-full">
                Calculate Multiplier
              </Button>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="currentMultiplier" className="text-muted-foreground">
                  Current Multiplier
                </Label>
                <Badge variant="secondary" className="font-mono text-sm">
                  {currentMultiplier > 0 ? `${currentMultiplier.toFixed(2)}x` : '—'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Position Parameters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Position Parameters</CardTitle>
              <CardDescription>Take-profit, stop-loss and sizing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avgMultiplier">Average Multiplier (Manual)</Label>
                <Input
                  id="avgMultiplier"
                  type="number"
                  value={avgMultiplier}
                  onChange={(e) => setAvgMultiplier(Number(e.target.value))}
                  step={1}
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit (%)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    step={0.01}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    step={0.1}
                    min={0.1}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="premium">Premium / Contract ($)</Label>
                  <Input
                    id="premium"
                    type="number"
                    value={premium}
                    onChange={(e) => setPremium(Number(e.target.value))}
                    step={0.01}
                    min={0.01}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotSize">Lot Size</Label>
                  <Input
                    id="lotSize"
                    type="number"
                    value={lotSize}
                    onChange={(e) => setLotSize(Number(e.target.value))}
                    step={0.01}
                    min={0.01}
                    placeholder="e.g. 0.15, 1, 100"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Sizing Method</Label>
                <Select value={method} onValueChange={(value: any) => setMethod(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="average">Average Multiplier</SelectItem>
                    <SelectItem value="conservative">Conservative (Higher Risk)</SelectItem>
                    <SelectItem value="riskparity">Risk Parity (Simple)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={calculatePosition} variant="default" className="w-full">
                Calculate Position
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results & Position */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Results card spans 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Position Size Results</CardTitle>
              <CardDescription>Projected option moves at TP and SL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
                {/* TP */}
                <div className="bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Option Move at TP
                    </span>
                    <Badge variant="outline" className="font-mono">
                      +
                    </Badge>
                  </div>
                  <div className="mt-3 font-mono text-3xl font-semibold tabular-nums">
                    +{optionMoveTP.toFixed(2)}%
                  </div>
                  <Separator className="my-3" />
                  <div className="text-xs text-muted-foreground">
                    Premium: <span className="font-mono">${premium.toFixed(2)}</span> →{' '}
                    <span className="font-mono">${(premium * (1 + optionMoveTP / 100)).toFixed(2)}</span>
                  </div>
                </div>
                {/* SL */}
                <div className="bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Option Move at SL
                    </span>
                    <Badge variant="outline" className="font-mono">
                      −
                    </Badge>
                  </div>
                  <div className="mt-3 font-mono text-3xl font-semibold tabular-nums">
                    −{optionMoveSL.toFixed(2)}%
                  </div>
                  <Separator className="my-3" />
                  <div className="text-xs text-muted-foreground">
                    Premium: <span className="font-mono">${premium.toFixed(2)}</span> →{' '}
                    <span className="font-mono">${(premium * (1 - optionMoveSL / 100)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position Size card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Position Size</CardTitle>
              <CardDescription>Sizing breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Lots to Buy</span>
                <span className="font-mono text-2xl font-semibold tabular-nums">
                  {contractsToBuy.toFixed(3)}
                </span>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Total Premium</span>
                <span className="font-mono text-xl font-medium tabular-nums">
                  ${totalPremium.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Potential Profit</span>
                <span className="font-mono text-xl font-medium tabular-nums">
                  +${potentialProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Potential Loss</span>
                <span className="font-mono text-xl font-medium tabular-nums">
                  −${potentialLoss.toFixed(2)}
                </span>
              </div>
              {contractsToBuy > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div>
                      Buy <span className="font-mono text-foreground">{contractsToBuy.toFixed(3)}</span> lots (size {lotSize}) at{' '}
                      <span className="font-mono text-foreground">${premium.toFixed(2)}</span>/contract
                    </div>
                    <div>
                      Total cost: <span className="font-mono text-foreground">${totalPremium.toFixed(2)}</span>{' '}
                      ({((totalPremium / capital) * 100).toFixed(2)}% of capital)
                    </div>
                    <div>
                      Risk: <span className="font-mono text-foreground">${potentialLoss.toFixed(2)}</span>{' '}
                      ({((potentialLoss / totalPremium) * 100).toFixed(2)}% of position)
                    </div>
                    <div>
                      Reward: <span className="font-mono text-foreground">${potentialProfit.toFixed(2)}</span>{' '}
                      ({((potentialProfit / totalPremium) * 100).toFixed(2)}% of position)
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History & Info */}
        <div className="mt-8">
          <Tabs defaultValue="history" className="w-full">
            <TabsList>
              <TabsTrigger value="history">Multiplier History</TabsTrigger>
              <TabsTrigger value="guide">How to Use</TabsTrigger>
            </TabsList>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">Multiplier History</CardTitle>
                    <CardDescription>
                      {multiplierHistory.length} sample{multiplierHistory.length === 1 ? '' : 's'} recorded
                    </CardDescription>
                  </div>
                  <Button
                    onClick={clearHistory}
                    variant="outline"
                    size="sm"
                    disabled={multiplierHistory.length === 0}
                  >
                    Clear History
                  </Button>
                </CardHeader>
                <CardContent>
                  {multiplierHistory.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                      No multipliers calculated yet
                    </div>
                  ) : (
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">#</TableHead>
                            <TableHead>Option Change</TableHead>
                            <TableHead>Underlying Change</TableHead>
                            <TableHead className="text-right">Multiplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {multiplierHistory
                            .slice()
                            .reverse()
                            .map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-muted-foreground">
                                  {multiplierHistory.length - index}
                                </TableCell>
                                <TableCell className="font-mono tabular-nums">
                                  {item.optionChange > 0 ? '+' : ''}
                                  {item.optionChange.toFixed(2)}%
                                </TableCell>
                                <TableCell className="font-mono tabular-nums">
                                  {item.underlyingChange > 0 ? '+' : ''}
                                  {item.underlyingChange.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium tabular-nums">
                                  {item.multiplier.toFixed(2)}x
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guide Tab */}
            <TabsContent value="guide">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">How to Use</CardTitle>
                  <CardDescription>A short reference for the calculator</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground marker:text-foreground">
                    <li>
                      Enter your actual option and underlying price changes to calculate the multiplier
                    </li>
                    <li>Build a history of multipliers to find your average</li>
                    <li>Use the average multiplier to calculate optimal position size</li>
                    <li>
                      The calculator accounts for the leverage effect of options on the underlying asset
                    </li>
                  </ol>
                  <Separator className="my-5" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Strategy Note
                      </div>
                      <div className="mt-1 text-sm">
                        Keep 60–86% as multiplier for BTC and ETH respectively, or calculate from last 2
                        candles.
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Entry Rule
                      </div>
                      <div className="mt-1 text-sm">
                        Enter trade with 0.33% high of candle for short trade.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="mt-10">
          <Separator className="mb-4" />
          <p className="text-xs text-muted-foreground">
            Options Position Size Calculator · For research and education only · Not financial advice
          </p>
        </footer>
      </div>
    </div>
  )
}
