import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Loader2, Sparkles, Server, CreditCard, UserCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function CheckoutModal({ domain, onClose, onPurchaseSuccess, config }) {
  const [step, setStep] = useState(1); // 1: Review & Contact, 2: Payment, 3: Provisioning & Success
  const [years, setYears] = useState(1);
  const [customer, setCustomer] = useState({
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    phone: '+1 555-0199',
    organization: 'Apex Ventures',
    country: 'US'
  });
  const [payment, setPayment] = useState({
    method: 'Credit Card',
    cardNumber: '4242 4242 4242 4242',
    expiry: '11/29',
    cvv: '888',
    cardName: 'Sarah Jenkins'
  });

  const [reservation, setReservation] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Provisioning progress stages for Step 4 & 5
  const [provisionStage, setProvisionStage] = useState(0); // 1: Pay, 2: Registrar, 3: Ownership
  const [orderResult, setOrderResult] = useState(null);

  // Dynamic pricing calculation
  const unitPrice = domain.price || 9.99;
  const basePrice = parseFloat((unitPrice * years).toFixed(2));
  const icannFee = parseFloat((0.18 * years).toFixed(2));
  const taxRate = config?.taxRate || 0.18;
  const taxAmount = parseFloat(((basePrice + icannFee) * taxRate).toFixed(2));
  const total = parseFloat((basePrice + icannFee + taxAmount).toFixed(2));
  const currencySymbol = config?.currencySymbol || '$';

  // Reserve domain in background (Step 2)
  useEffect(() => {
    let isMounted = true;
    async function reserve() {
      setIsReserving(true);
      try {
        const res = await api.reserveDomain({
          domainName: domain.domainName,
          customerEmail: customer.email,
          years
        });
        if (isMounted) {
          setReservation(res);
        }
      } catch (err) {
        // Silently catch non-critical reservation errors in background
        console.warn('Background reservation note:', err.message);
      } finally {
        if (isMounted) setIsReserving(false);
      }
    }
    reserve();

    return () => { isMounted = false; };
  }, [domain.domainName, years]);

  const handleFillDemoData = () => {
    setCustomer({
      name: 'Alex Rivera',
      email: 'alex.rivera@techflow.io',
      phone: '+91 98765 43210',
      organization: 'TechFlow Systems',
      country: 'IN'
    });
    setPayment({
      method: 'Credit Card',
      cardNumber: '5500 0000 0000 1234',
      expiry: '09/28',
      cvv: '456',
      cardName: 'Alex Rivera'
    });
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email) {
      setErrorMessage('Please provide customer name and email.');
      return;
    }
    setErrorMessage('');
    
    // Attempt reservation if not already reserved
    try {
      if (!reservation) {
        const res = await api.reserveDomain({
          domainName: domain.domainName,
          customerEmail: customer.email,
          years
        });
        setReservation(res);
      }
    } catch (err) {
      console.warn('Proceeding with direct checkout:', err.message);
    }
    
    setStep(2);
  };

  const handleExecutePurchase = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');
    setStep(3); // Show live provisioning screen

    // Stage 1: Initiating payment gateway authorization
    setProvisionStage(1);

    try {
      // Stage 2: Calling backend API which contacts external registrar
      setProvisionStage(2);

      // Real HTTP REST request to backend (which calls simulated external registrar)
      const result = await api.processPurchase({
        reservationId: reservation?.reservationId,
        domainName: domain.domainName,
        years,
        customer,
        paymentDetails: payment
      });

      // Stage 3: Registrar approved & ownership assigned in store
      setProvisionStage(3);
      await new Promise(r => setTimeout(r, 400));
      setProvisionStage(4); // Fully done!

      setOrderResult(result);
      setIsProcessing(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (cErr) {
        // ignore if not supported in iframe
      }

      if (onPurchaseSuccess) {
        onPurchaseSuccess(result);
      }
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage(err.message);
      setStep(2); // return to payment step with error
    }
  };

  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>Domain Checkout & Ownership Assignment</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Securing <strong style={{ color: 'var(--primary)' }}>{domain.domainName}</strong>
            </div>
          </div>
          <button className="close-modal-btn" onClick={onClose} id="checkout-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* 5-Step Stepper Header */}
        <div className="stepper-bar">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span>Customer & Plan</span>
          </div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span>Payment</span>
          </div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span>Provision & Ownership</span>
          </div>
        </div>

        {errorMessage && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#f87171', 
            padding: '12px 20px', 
            margin: '16px 28px 0', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="modal-body">
          {/* STEP 1: Registration Details & Duration */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>1. Registration Term & WHOIS Contact</h4>
                <button type="button" className="autofill-btn" onClick={handleFillDemoData}>
                  Fill Demo Data
                </button>
              </div>

              {/* Term Selection */}
              <div className="form-group">
                <label className="form-label">Registration Duration</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[1, 2, 3].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setYears(yr)}
                      className={`btn-outline-sm ${years === yr ? 'active' : ''}`}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: years === yr ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: years === yr ? 'rgba(0, 223, 130, 0.1)' : 'transparent',
                        color: years === yr ? 'var(--primary)' : 'var(--text-secondary)',
                        textAlign: 'center'
                      }}
                      id={`term-btn-${yr}`}
                    >
                      <div style={{ fontWeight: 700 }}>{yr} {yr === 1 ? 'Year' : 'Years'}</div>
                      <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                        {currencySymbol}{(unitPrice * yr).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Contact Form */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name / Registrant *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    id="checkout-name-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address (for ownership) *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    id="checkout-email-input"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    id="checkout-phone-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization / Business</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customer.organization}
                    onChange={(e) => setCustomer({ ...customer, organization: e.target.value })}
                    id="checkout-org-input"
                  />
                </div>
              </div>

              {/* Price summary */}
              <div className="order-summary-box">
                <div className="summary-row">
                  <span>{domain.domainName} ({years} {years === 1 ? 'year' : 'years'})</span>
                  <span>{currencySymbol}{basePrice.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>ICANN Regulatory Fee</span>
                  <span>{currencySymbol}{icannFee.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Estimated Taxes ({Math.round(taxRate * 100)}%)</span>
                  <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Due Today</span>
                  <span style={{ color: 'var(--primary)' }}>{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-outline-sm" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-sm"
                  style={{ padding: '12px 28px' }}
                  id="proceed-payment-btn"
                >
                  <span>Continue to Payment</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Simulated Payment Processing */}
          {step === 2 && (
            <form onSubmit={handleExecutePurchase}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>2. Submit Payment Details</h4>
                <button type="button" className="autofill-btn" onClick={handleFillDemoData}>
                  Auto-fill Test Card
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={payment.cardName}
                  onChange={(e) => setPayment({ ...payment, cardName: e.target.value })}
                  id="checkout-cardname-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={payment.cardNumber}
                    onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                    id="checkout-cardnumber-input"
                  />
                  <CreditCard size={18} style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    className="form-input"
                    value={payment.expiry}
                    onChange={(e) => setPayment({ ...payment, expiry: e.target.value })}
                    id="checkout-cardexpiry-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Security Code (CVV)</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="123"
                    className="form-input"
                    value={payment.cvv}
                    onChange={(e) => setPayment({ ...payment, cvv: e.target.value })}
                    id="checkout-cardcvv-input"
                  />
                </div>
              </div>

              {/* Total reminder */}
              <div className="order-summary-box" style={{ padding: '14px 20px', marginBottom: '20px' }}>
                <div className="summary-row total" style={{ border: 'none', padding: 0, margin: 0 }}>
                  <span>Total to Authorize</span>
                  <span style={{ color: 'var(--primary)' }}>{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn-outline-sm" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary-sm"
                  style={{ padding: '12px 32px' }}
                  id="submit-payment-btn"
                >
                  <ShieldCheck size={18} />
                  <span>Authorize & Register Domain</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3, 4 & 5: Live Provisioning & Ownership Confirmation */}
          {step === 3 && (
            <div className="provisioning-container">
              {isProcessing ? (
                <>
                  <div className="provisioning-spinner" />
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
                    Provisioning Your Domain...
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Executing real-time ICANN registrar handshakes and allocating DNS records.
                  </p>

                  <div className="provision-steps-list">
                    <div className={`provision-step-row ${provisionStage >= 1 ? 'done' : ''}`}>
                      {provisionStage >= 1 ? <CheckCircle2 size={18} color="var(--primary)" /> : <Loader2 size={18} className="animate-spin" />}
                      <span>Step 3: Authorizing Payment Gateway</span>
                    </div>

                    <div className={`provision-step-row ${provisionStage >= 2 ? 'done' : ''}`}>
                      {provisionStage >= 2 ? <CheckCircle2 size={18} color="var(--primary)" /> : (provisionStage === 1 ? <Loader2 size={18} className="animate-spin" /> : <Server size={18} />)}
                      <span>Step 4: Registering with External ICANN Registrar</span>
                    </div>

                    <div className={`provision-step-row ${provisionStage >= 3 ? 'done' : ''}`}>
                      {provisionStage >= 3 ? <CheckCircle2 size={18} color="var(--primary)" /> : <UserCheck size={18} />}
                      <span>Step 5: Assigning Legal Ownership to {customer.name}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Confirmed Success View */
                orderResult && (
                  <div>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(0, 223, 130, 0.2)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <CheckCircle2 size={36} />
                    </div>

                    <h3 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '6px' }}>
                      Domain Successfully Registered!
                    </h3>
                    <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>
                      {orderResult.domain.domainName}
                    </p>

                    <div className="order-summary-box" style={{ textAlign: 'left', background: '#151c2e' }}>
                      <div className="summary-row">
                        <span>Status</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>ACTIVE & VERIFIED</span>
                      </div>
                      <div className="summary-row">
                        <span>Legal Owner</span>
                        <span style={{ fontWeight: 600 }}>{orderResult.owner.name} ({orderResult.owner.email})</span>
                      </div>
                      <div className="summary-row">
                        <span>Order Reference</span>
                        <code>{orderResult.orderId}</code>
                      </div>
                      <div className="summary-row">
                        <span>Registrar Reference</span>
                        <code>{orderResult.registrar.transactionId}</code>
                      </div>
                      <div className="summary-row">
                        <span>Valid Until</span>
                        <span>{new Date(orderResult.domain.expiryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="summary-row">
                        <span>Assigned Nameservers</span>
                        <span style={{ fontSize: '0.8rem' }}>{orderResult.domain.nameservers.join(', ')}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '24px' }}>
                      <button
                        className="btn-primary-sm"
                        onClick={onClose}
                        id="finish-checkout-btn"
                        style={{ padding: '12px 32px' }}
                      >
                        <span>View My Domains</span>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
