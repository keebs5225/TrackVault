//frontend/src/pages/AnalyticsTab.tsx
import React, { useState, useMemo } from 'react'

export default function AnalyticsTab() {
  const [loanAmt, setLoanAmt]     = useState('')
  const [loanRate, setLoanRate]   = useState('')
  const [loanTerm, setLoanTerm]   = useState('')
  const loanPayment = useMemo(()=>{
    const P = parseFloat(loanAmt),
          r = parseFloat(loanRate)/100/12,
          n = parseFloat(loanTerm)*12
    if(!P||!r||!n) return ''
    return (P*r/(1-(1+r)**-n)).toFixed(2)
  },[loanAmt,loanRate,loanTerm])

  const [saveInit, setSaveInit]       = useState('')
  const [saveRate, setSaveRate]       = useState('')
  const [saveTerm, setSaveTerm]       = useState('')
  const [saveMonthly, setSaveMonthly] = useState('')
  const saveFuture = useMemo(()=>{
    const P = parseFloat(saveInit),
          r = parseFloat(saveRate)/100/12,
          n = parseFloat(saveTerm)*12,
          C = parseFloat(saveMonthly)
    if(isNaN(P)||isNaN(r)||isNaN(n)||isNaN(C)) return ''
    return (P*Math.pow(1+r,n)+C*((Math.pow(1+r,n)-1)/r)).toFixed(2)
  },[saveInit,saveRate,saveTerm,saveMonthly])

  const [invInit, setInvInit] = useState('')
  const [invRate, setInvRate] = useState('')
  const [invTerm, setInvTerm] = useState('')
  const [invCont, setInvCont] = useState('')
  const invFuture = useMemo(()=>{
    const P = parseFloat(invInit),
          r = parseFloat(invRate)/100,
          n = parseFloat(invTerm),
          C = parseFloat(invCont)
    if(isNaN(P)||isNaN(r)||isNaN(n)||isNaN(C)) return ''
    return (P*Math.pow(1+r,n)+C*((Math.pow(1+r,n)-1)/r)).toFixed(2)
  },[invInit,invRate,invTerm,invCont])

  return (
    <>
      <h2>Analytics</h2>

      <fieldset style={{marginBottom:16}}>
        <legend>Loan</legend>
        <label>Amount: <input
          type="number" step="0.01"
          value={loanAmt}
          onChange={e=>setLoanAmt(e.target.value)}
        /></label>
        <label>Rate %: <input
          type="number" step="0.01"
          value={loanRate}
          onChange={e=>setLoanRate(e.target.value)}
        /></label>
        <label>Years: <input
          type="number" step="0.1"
          value={loanTerm}
          onChange={e=>setLoanTerm(e.target.value)}
        /></label>
        <p>Monthly: {loanPayment? `$${loanPayment}`:'—'}</p>
      </fieldset>

      <fieldset style={{marginBottom:16}}>
        <legend>Savings</legend>
        <label>Initial: <input
          type="number" step="0.01"
          value={saveInit}
          onChange={e=>setSaveInit(e.target.value)}
        /></label>
        <label>Rate %: <input
          type="number" step="0.01"
          value={saveRate}
          onChange={e=>setSaveRate(e.target.value)}
        /></label>
        <label>Years: <input
          type="number" step="0.1"
          value={saveTerm}
          onChange={e=>setSaveTerm(e.target.value)}
        /></label>
        <label>Monthly: <input
          type="number" step="0.01"
          value={saveMonthly}
          onChange={e=>setSaveMonthly(e.target.value)}
        /></label>
        <p>Future: {saveFuture? `$${saveFuture}`:'—'}</p>
      </fieldset>

      <fieldset>
        <legend>Investment</legend>
        <label>Initial: <input
          type="number" step="0.01"
          value={invInit}
          onChange={e=>setInvInit(e.target.value)}
        /></label>
        <label>Rate %: <input
          type="number" step="0.01"
          value={invRate}
          onChange={e=>setInvRate(e.target.value)}
        /></label>
        <label>Years: <input
          type="number" step="0.1"
          value={invTerm}
          onChange={e=>setInvTerm(e.target.value)}
        /></label>
        <label>Annual: <input
          type="number" step="0.01"
          value={invCont}
          onChange={e=>setInvCont(e.target.value)}
        /></label>
        <p>Proj: {invFuture? `$${invFuture}`:'—'}</p>
      </fieldset>
    </>
  )
}
