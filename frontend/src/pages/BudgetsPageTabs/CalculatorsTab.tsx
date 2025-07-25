// frontend/src/pages/CalculatorsTab.tsx
import React, { useState, useMemo } from 'react'
import '../../styles/global.css'
import '../../styles/calculators.css'

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const copy = async (text: string) => {
  try { await navigator.clipboard.writeText(text) } catch { /* noop */ }
}

export default function CalculatorsTab() {
  // ── Loan calculator state ───────────────────────────────
  const [loanAmt, setLoanAmt]   = useState('')
  const [loanRate, setLoanRate] = useState('')
  const [loanTerm, setLoanTerm] = useState('')

  // ── Compute loan payment ──────────────────────────────────
  const loanPayment = useMemo(() => {
    const P = parseFloat(loanAmt)
    const r = parseFloat(loanRate) / 100 / 12
    const n = parseFloat(loanTerm) * 12
    if (!P || !r || !n) return ''
    return (P * r / (1 - (1 + r) ** -n)).toFixed(2)
  }, [loanAmt, loanRate, loanTerm])
  const loanText = loanPayment ? `Monthly Payment: $${loanPayment}` : ''

  // ── Savings calculator state ────────────────────────────
  const [saveInit, setSaveInit]       = useState('')
  const [saveRate, setSaveRate]       = useState('')
  const [saveTerm, setSaveTerm]       = useState('')
  const [saveMonthly, setSaveMonthly] = useState('')

  // ── Compute savings future value ────────────────────────
  const saveFuture = useMemo(() => {
    const P = parseFloat(saveInit)
    const r = parseFloat(saveRate) / 100 / 12
    const n = parseFloat(saveTerm) * 12
    const C = parseFloat(saveMonthly)
    if (isNaN(P) || isNaN(r) || isNaN(n) || isNaN(C)) return ''
    return (P * Math.pow(1 + r, n) + C * ((Math.pow(1 + r, n) - 1) / r)).toFixed(2)
  }, [saveInit, saveRate, saveTerm, saveMonthly])
  const savingsText = saveFuture ? `Future Value: $${saveFuture}` : ''

  // ── Investment calculator state ─────────────────────────
  const [invInit, setInvInit] = useState('')
  const [invRate, setInvRate] = useState('')
  const [invTerm, setInvTerm] = useState('')
  const [invCont, setInvCont] = useState('')

  // ── Compute investment future value ─────────────────────
  const invFuture = useMemo(() => {
    const P = parseFloat(invInit)
    const r = parseFloat(invRate) / 100
    const n = parseFloat(invTerm)
    const C = parseFloat(invCont)
    if (isNaN(P) || isNaN(r) || isNaN(n) || isNaN(C)) return ''
    return (P * Math.pow(1 + r, n) + C * ((Math.pow(1 + r, n) - 1) / r)).toFixed(2)
  }, [invInit, invRate, invTerm, invCont])
  const invText = invFuture ? `Projected Value: $${invFuture}` : ''

  // ── Pay/Salary calculator state ─────────────────────────
  const [payMode, setPayMode] = useState<'hourly' | 'salary'>('hourly')
  const [hourlyRate, setHourlyRate]   = useState('')
  const [hoursWeek,  setHoursWeek]    = useState('40')
  const [weeksYear,  setWeeksYear]    = useState('52')
  const [annualSalary, setAnnualSalary] = useState('')

  // ── Compute pay breakdown ───────────────────────────────
  const payResult = useMemo(() => {
    const hw = parseFloat(hoursWeek) || 0
    const wy = parseFloat(weeksYear) || 0
    if (payMode === 'hourly') {
      const hr = parseFloat(hourlyRate)
      if (!hr || !hw || !wy) return null
      const annual = hr * hw * wy
      return {
        hourly: hr,
        weekly: hr * hw,
        biweekly: hr * hw * 2,
        semimonthly: annual / 24,
        monthly: annual / 12,
        annual,
      }
    } else {
      const annual = parseFloat(annualSalary)
      if (!annual || !hw || !wy) return null
      return {
        hourly: annual / (hw * wy),
        weekly: annual / 52,
        biweekly: annual / 26,
        semimonthly: annual / 24,
        monthly: annual / 12,
        annual,
      }
    }
  }, [payMode, hourlyRate, hoursWeek, weeksYear, annualSalary])

  const payText = payResult
    ? `Hourly: $${money(payResult.hourly)}
Weekly: $${money(payResult.weekly)}
Biweekly: $${money(payResult.biweekly)}
Semi-Monthly: $${money(payResult.semimonthly)}
Monthly: $${money(payResult.monthly)}
Annual: $${money(payResult.annual)}`
    : ''

  // ── Reset functions ─────────────────────────────────────
  const resetLoan = () => { setLoanAmt(''); setLoanRate(''); setLoanTerm('') }
  const resetSave = () => { setSaveInit(''); setSaveRate(''); setSaveTerm(''); setSaveMonthly('') }
  const resetInv  = () => { setInvInit(''); setInvRate(''); setInvTerm(''); setInvCont('') }
  const resetPay  = () => {
    setHourlyRate(''); setAnnualSalary('')
    setHoursWeek('40'); setWeeksYear('52'); setPayMode('hourly')
  }

  return (
    <section className="calculators-page">
      <h1>Calculators</h1>

      <div className="calculators-grid">
        {/* ── Loan calculator UI ───────────────────────── */}
        <div className="calculator-card">
          <fieldset className="calculators-fieldset">
            <legend>Loan Payment</legend>
            <label>Loan Amount ($)
              <input type="number" step="0.01" value={loanAmt} onChange={e => setLoanAmt(e.target.value)} />
            </label>
            <label>APR (%)
              <input type="number" step="0.01" value={loanRate} onChange={e => setLoanRate(e.target.value)} />
            </label>
            <label>Term (Years)
              <input type="number" step="0.1" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} />
            </label>
            <p className="calculator-result">
              <span className="result-label">Monthly:</span> {loanPayment ? `$${loanPayment}` : '—'}
            </p>
          </fieldset>
          <div className="calc-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={resetLoan}>Reset</button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              disabled={!loanText}
              onClick={() => copy(loanText)}
            >
              Copy Result
            </button>
          </div>
        </div>

        {/* ── Savings calculator UI ───────────────────────── */}
        <div className="calculator-card">
          <fieldset className="calculators-fieldset">
            <legend>Savings Growth</legend>
            <label>Start Balance ($)
              <input type="number" step="0.01" value={saveInit} onChange={e => setSaveInit(e.target.value)} />
            </label>
            <label>APR (%)
              <input type="number" step="0.01" value={saveRate} onChange={e => setSaveRate(e.target.value)} />
            </label>
            <label>Years Saved
              <input type="number" step="0.1" value={saveTerm} onChange={e => setSaveTerm(e.target.value)} />
            </label>
            <label>Monthly Deposit ($)
              <input type="number" step="0.01" value={saveMonthly} onChange={e => setSaveMonthly(e.target.value)} />
            </label>
            <p className="calculator-result">
              <span className="result-label">Future:</span> {saveFuture ? `$${saveFuture}` : '—'}
            </p>
          </fieldset>
          <div className="calc-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={resetSave}>Reset</button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              disabled={!savingsText}
              onClick={() => copy(savingsText)}
            >
              Copy Result
            </button>
          </div>
        </div>

        {/* ── Investment calculator UI ─────────────────────── */}
        <div className="calculator-card">
          <fieldset className="calculators-fieldset">
            <legend>Investment Projection</legend>
            <label>Initial Invest ($)
              <input type="number" step="0.01" value={invInit} onChange={e => setInvInit(e.target.value)} />
            </label>
            <label>Return Rate (%)
              <input type="number" step="0.01" value={invRate} onChange={e => setInvRate(e.target.value)} />
            </label>
            <label>Years Invested
              <input type="number" step="0.1" value={invTerm} onChange={e => setInvTerm(e.target.value)} />
            </label>
            <label>Annual Contribution ($)
              <input type="number" step="0.01" value={invCont} onChange={e => setInvCont(e.target.value)} />
            </label>
            <p className="calculator-result">
              <span className="result-label">Projected:</span> {invFuture ? `$${invFuture}` : '—'}
            </p>
          </fieldset>
          <div className="calc-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={resetInv}>Reset</button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              disabled={!invText}
              onClick={() => copy(invText)}
            >
              Copy Result
            </button>
          </div>
        </div>

        {/* ── Pay/Salary calculator UI ───────────────────────── */}
        <div className="calculator-card">
          <fieldset className="calculators-fieldset pay-calc">
            <legend>Pay / Salary</legend>

            <div className="pay-mode">
              <button
                type="button"
                className={`btn btn-small ${payMode === 'hourly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setPayMode('hourly'); setAnnualSalary('') }}
              >
                Hourly ➜ Salary
              </button>
              <button
                type="button"
                className={`btn btn-small ${payMode === 'salary' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setPayMode('salary'); setHourlyRate('') }}
              >
                Salary ➜ Hourly
              </button>
            </div>

            {payMode === 'hourly' ? (
              <label>Hourly Pay ($)
                <input type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
              </label>
            ) : (
              <label>Annual Salary ($)
                <input type="number" step="0.01" value={annualSalary} onChange={e => setAnnualSalary(e.target.value)} />
              </label>
            )}

            <label>Hours Per Week
              <input type="number" step="0.1" value={hoursWeek} onChange={e => setHoursWeek(e.target.value)} />
            </label>
            <label>Weeks Per Year
              <input type="number" step="0.1" value={weeksYear} onChange={e => setWeeksYear(e.target.value)} />
            </label>

            <p className="calculator-result">
              <span className="result-label">Result:</span>
              {payResult ? (
                <div className="pay-result-grid">
                  <span>Hourly</span><span>${money(payResult.hourly)}</span>
                  <span>Weekly</span><span>${money(payResult.weekly)}</span>
                  <span>Biweekly</span><span>${money(payResult.biweekly)}</span>
                  <span>Semi-Monthly</span><span>${money(payResult.semimonthly)}</span>
                  <span>Monthly</span><span>${money(payResult.monthly)}</span>
                  <span>Annual</span><span>${money(payResult.annual)}</span>
                </div>
              ) : '—'}
            </p>
          </fieldset>
          <div className="calc-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={resetPay}>Reset</button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              disabled={!payText}
              onClick={() => copy(payText)}
            >
              Copy Result
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
