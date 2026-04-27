import { useState } from 'react'
import './App.css'

const BOOKING_URL =
  'https://outlook.office.com/bookwithme/user/f605dc552bc64fc192526c3c83792ea3@ledgerxtr.com/meetingtype/_FgRgTaOQEyk_G3rlVZV7w2?anonymous&ismsaljsauthenabled&ep=mLinkFromTile'
const MAKE_WEBHOOK_URL = (import.meta.env.VITE_MAKE_WEBHOOK_URL as string | undefined) ?? ''

type OrgType = 'Small Business' | 'Nonprofit' | 'Service Company' | 'Other'
type MeetingTimeframe = 'This week' | 'Next week' | 'Flexible'

type ServiceNeeded =
  | 'Bookkeeping'
  | 'Payroll Support'
  | 'Sales Tax Organization'
  | 'Nonprofit Accounting Support'
  | 'Financial Reporting'
  | 'Tax-Ready Books'
  | 'Accounting System Setup'

type FormState = {
  fullName: string
  orgName: string
  email: string
  phone: string
  orgType: OrgType
  servicesNeeded: Record<ServiceNeeded, boolean>
  timeframe: MeetingTimeframe
  message: string
}

type FormErrors = Partial<Record<keyof FormState, string>> & {
  servicesNeeded?: string
}

const SECTION_IDS = {
  home: 'home',
  services: 'services',
  whoWeHelp: 'who-we-help',
  process: 'process',
  about: 'about',
  book: 'book-a-call',
} as const

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return

  // Sticky header offset (~64px). Use a constant to keep behavior predictable.
  const y = el.getBoundingClientRect().top + window.scrollY - 84
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
}

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [form, setForm] = useState<FormState>({
    fullName: '',
    orgName: '',
    email: '',
    phone: '',
    orgType: 'Small Business',
    servicesNeeded: {
      Bookkeeping: false,
      'Payroll Support': false,
      'Sales Tax Organization': false,
      'Nonprofit Accounting Support': false,
      'Financial Reporting': false,
      'Tax-Ready Books': false,
      'Accounting System Setup': false,
    },
    timeframe: 'Flexible',
    message: '',
  })

  function onNavClick(id: string) {
    setMobileOpen(false)
    scrollToId(id)
  }

  function validate(next: FormState): FormErrors {
    const nextErrors: FormErrors = {}

    if (!next.fullName.trim()) nextErrors.fullName = 'Please enter your full name.'
    if (!next.orgName.trim())
      nextErrors.orgName = 'Please enter your business / organization name.'
    if (!next.email.trim()) nextErrors.email = 'Please enter your email.'
    else if (!isValidEmail(next.email)) nextErrors.email = 'Please enter a valid email.'

    const servicesPicked = Object.values(next.servicesNeeded).some(Boolean)
    if (!servicesPicked) nextErrors.servicesNeeded = 'Select at least one service.'

    if (!next.message.trim()) nextErrors.message = 'Please add a short message.'

    return nextErrors
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(false)
    setSubmitError(null)

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (!MAKE_WEBHOOK_URL.trim()) {
      setSubmitError(
        'Form delivery is not configured yet. Please set VITE_MAKE_WEBHOOK_URL and try again.',
      )
      return
    }

    const payload = {
      fullName: form.fullName,
      orgName: form.orgName,
      email: form.email,
      phone: form.phone,
      orgType: form.orgType,
      timeframe: form.timeframe,
      servicesNeeded: (Object.keys(form.servicesNeeded) as ServiceNeeded[]).filter(
        (k) => form.servicesNeeded[k],
      ),
      message: form.message,
    }

    // TODO: You can swap Make for Formspree, Netlify Forms, Supabase, or a Power Automate webhook.
    setSubmitting(true)
    try {
      // NOTE: Make webhooks often don't support CORS preflight for JSON.
      // Using `mode: 'no-cors'` + a simple content-type avoids OPTIONS preflight in browsers.
      await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload),
      })

      setSubmitted(true)
    } catch (err) {
      console.error('[LedgerXtR] Booking request error', err)
      setSubmitError(
        'Something went wrong sending your request. Please try again, or email us at info@ledgerxtr.com.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <a className="skip-link" href={`#${SECTION_IDS.home}`}>
        Skip to content
      </a>

      <header className="header" aria-label="Primary navigation">
        <div className="container">
          <div className="headerInner">
            <a
              className="brand"
              href={`#${SECTION_IDS.home}`}
              onClick={(e) => {
                e.preventDefault()
                onNavClick(SECTION_IDS.home)
              }}
              aria-label="LedgerXtR Home"
            >
              <span className="brandMark" aria-hidden="true" />
              LedgerXtR
            </a>

            <nav className="nav" aria-label="Site">
              <div className="navLinks" role="list">
                <a
                  href={`#${SECTION_IDS.home}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(SECTION_IDS.home)
                  }}
                >
                  Home
                </a>
                <a
                  href={`#${SECTION_IDS.services}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(SECTION_IDS.services)
                  }}
                >
                  Services
                </a>
                <a
                  href={`#${SECTION_IDS.whoWeHelp}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(SECTION_IDS.whoWeHelp)
                  }}
                >
                  Who We Help
                </a>
                <a
                  href={`#${SECTION_IDS.process}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(SECTION_IDS.process)
                  }}
                >
                  Process
                </a>
                <a
                  href={`#${SECTION_IDS.about}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(SECTION_IDS.about)
                  }}
                >
                  About
                </a>
                <a
                  href={`#${SECTION_IDS.book}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(SECTION_IDS.book)
                  }}
                >
                  Book a Call
                </a>
              </div>

              <a
                className="btn btnPrimary headerCta"
                href={`#${SECTION_IDS.book}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.book)
                }}
              >
                Book a Consultation
              </a>

              <button
                type="button"
                className="btn btnGhost menuBtn"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? 'Close' : 'Menu'}
              </button>
            </nav>
          </div>

          {mobileOpen ? (
            <div className="mobilePanel" role="list">
              <a
                href={`#${SECTION_IDS.home}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.home)
                }}
              >
                Home
              </a>
              <a
                href={`#${SECTION_IDS.services}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.services)
                }}
              >
                Services
              </a>
              <a
                href={`#${SECTION_IDS.whoWeHelp}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.whoWeHelp)
                }}
              >
                Who We Help
              </a>
              <a
                href={`#${SECTION_IDS.process}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.process)
                }}
              >
                Process
              </a>
              <a
                href={`#${SECTION_IDS.about}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.about)
                }}
              >
                About
              </a>
              <a
                href={`#${SECTION_IDS.book}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.book)
                }}
              >
                Book a Call
              </a>
              <a
                className="btn btnPrimary"
                href={`#${SECTION_IDS.book}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.book)
                }}
              >
                Book a Consultation
              </a>
            </div>
          ) : null}
        </div>
      </header>

      <main id={SECTION_IDS.home}>
        <section className="hero" aria-label="Home">
          <div className="container">
            <div className="heroGrid">
              <div>
                <h1 className="heroTitle">
                  Accounting Support Built for Growing Businesses and Nonprofits
                </h1>
                <p className="heroSubtitle">
                  LedgerXtR helps organizations keep bookkeeping, payroll, and financial records
                  organized year-round, so operations run smoothly and tax season is easier to
                  manage.
                </p>

                <div className="heroActions">
                  <a
                    className="btn btnPrimary"
                    href={`#${SECTION_IDS.book}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onNavClick(SECTION_IDS.book)
                    }}
                  >
                    Book a Call
                  </a>
                  <a
                    className="btn btnSecondary"
                    href={`#${SECTION_IDS.services}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onNavClick(SECTION_IDS.services)
                    }}
                  >
                    View Services
                  </a>
                </div>

                <ul className="trustList" aria-label="Trust notes">
                  {[
                    'Independent accounting support',
                    'Bookkeeping and payroll assistance',
                    'Tax-ready financial records',
                    'Nonprofit-friendly support',
                  ].map((t) => (
                    <li className="trustItem" key={t}>
                      <span className="iconBadge" aria-hidden="true">
                        ✓
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="heroCard" aria-label="At a glance">
                <div className="heroCardInner">
                  <p className="sectionKicker">Clarity, consistency, readiness</p>
                  <h2 className="sectionTitle" style={{ marginTop: 0 }}>
                    Clean records that stay clean.
                  </h2>
                  <p className="sectionLead">
                    Monthly support designed to keep your books organized for leadership decisions and
                    ready to coordinate with your tax preparer when needed.
                  </p>

                  <div className="heroMetric" aria-label="Highlights">
                    <div className="metricBox">
                      <p className="metricLabel">Focus</p>
                      <p className="metricValue">Bookkeeping</p>
                    </div>
                    <div className="metricBox">
                      <p className="metricLabel">Support</p>
                      <p className="metricValue">Payroll + Sales Tax</p>
                    </div>
                    <div className="metricBox">
                      <p className="metricLabel">Outcome</p>
                      <p className="metricValue">Tax-ready books</p>
                    </div>
                    <div className="metricBox">
                      <p className="metricLabel">Fit</p>
                      <p className="metricValue">Nonprofit-friendly</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="section sectionAlt" aria-label="Credibility">
          <div className="container">
            <p className="sectionKicker">What you get</p>
            <h2 className="sectionTitle">Reliable financial organization, without the noise.</h2>
            <p className="sectionLead">
              LedgerXtR supports day-to-day financial operations so your organization can run with
              better visibility and fewer surprises.
            </p>

            <div className="grid cols3 cardGrid" role="list">
              {[
                {
                  title: 'Clean Books, Clear Decisions',
                  body: 'Accurate, organized bookkeeping that makes it easier to understand performance and cash flow.',
                },
                {
                  title: 'Payroll and Compliance Support',
                  body: 'Help with payroll workflows, employee payment tracking, and related reporting support.',
                },
                {
                  title: 'Nonprofit-Aware Financial Organization',
                  body: 'Fund-aware organization and reporting preparation that supports nonprofit leadership needs.',
                },
                {
                  title: 'Works Alongside Your Tax Preparer',
                  body: 'Year-round organization designed to coordinate smoothly with your existing tax preparer or CPA partner.',
                },
              ].map((c) => (
                <div className="card" role="listitem" key={c.title}>
                  <h3 className="cardTitle">{c.title}</h3>
                  <p className="cardBody">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={SECTION_IDS.services} className="section" aria-label="Services">
          <div className="container">
            <p className="sectionKicker">Services</p>
            <h2 className="sectionTitle">Support that keeps your finances organized and usable.</h2>
            <p className="sectionLead">
              Flexible accounting support focused on clean records, consistent workflows, and
              tax-ready books (without overclaiming tax filing services).
            </p>

            <div className="grid cols3 cardGrid" role="list">
              {[
                {
                  title: 'Bookkeeping',
                  body: 'Monthly bookkeeping support to keep financial records accurate, organized, and easy to understand.',
                },
                {
                  title: 'Payroll Support',
                  body: 'Help with payroll workflows, employee payment tracking, and related reporting support.',
                },
                {
                  title: 'Sales Tax Organization',
                  body: 'Support for tracking sales tax details and preparing organized records for review or filing.',
                },
                {
                  title: 'Tax-Ready Books',
                  body: 'Year-round recordkeeping designed to make tax preparation smoother for your current tax preparer or CPA.',
                },
                {
                  title: 'Nonprofit Accounting Support',
                  body: 'Organized bookkeeping support for nonprofits, including fund-aware tracking, reporting preparation, and clean financial records.',
                },
                {
                  title: 'Financial Reporting',
                  body: 'Clear monthly or periodic reports that help owners and leadership teams understand performance and cash flow.',
                },
                {
                  title: 'Accounting System Setup',
                  body: 'Assistance organizing or improving bookkeeping workflows using tools such as QuickBooks, Xero, or similar systems.',
                },
              ].map((s) => (
                <div className="card" role="listitem" key={s.title}>
                  <h3 className="cardTitle">{s.title}</h3>
                  <p className="cardBody">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={SECTION_IDS.whoWeHelp} className="section sectionAlt" aria-label="Who we help">
          <div className="container">
            <p className="sectionKicker">Who we help</p>
            <h2 className="sectionTitle">Built for organizations that want cleaner books.</h2>
            <p className="sectionLead">
              LedgerXtR supports small teams that need consistent financial organization without
              building a full internal accounting department.
            </p>

            <div className="grid cols2 cardGrid" role="list">
              {[
                {
                  title: 'Small Businesses',
                  body: 'Owners who want timely, accurate records for better decisions.',
                },
                {
                  title: 'Nonprofit Organizations',
                  body: 'Nonprofits needing fund-aware organization and reporting preparation.',
                },
                {
                  title: 'Growing Service Companies',
                  body: 'Operations that need consistent tracking, reconciliation, and reporting support.',
                },
                {
                  title: 'Founders and Operators Who Need Cleaner Books',
                  body: 'Leadership teams who want financial clarity without constant catch-up.',
                },
              ].map((w) => (
                <div className="card" role="listitem" key={w.title}>
                  <h3 className="cardTitle">{w.title}</h3>
                  <p className="cardBody">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={SECTION_IDS.process} className="section" aria-label="Process">
          <div className="container">
            <p className="sectionKicker">Process</p>
            <h2 className="sectionTitle">A simple, steady workflow.</h2>
            <p className="sectionLead">
              The goal is to keep your bookkeeping, payroll support, and reporting organized so you
              always know where things stand.
            </p>

            <div className="processSteps" role="list">
              {[
                {
                  title: 'Discovery Call',
                  body: 'Understand your current bookkeeping, payroll, sales tax, and reporting needs.',
                },
                {
                  title: 'Review & Setup',
                  body: 'Review existing records, systems, workflows, and recurring obligations.',
                },
                {
                  title: 'Monthly Support',
                  body: 'Keep books updated, organized, reconciled, and ready for review.',
                },
                {
                  title: 'Tax-Ready Coordination',
                  body: 'Work alongside your current tax preparer or a trusted CPA partner when needed.',
                },
              ].map((step, idx) => (
                <div className="step" role="listitem" key={step.title}>
                  <div className="stepTop">
                    <span className="stepNum" aria-label={`Step ${idx + 1}`}>
                      {idx + 1}
                    </span>
                    <span className="iconBadge" aria-hidden="true">
                      →
                    </span>
                  </div>
                  <h3 className="stepTitle">{step.title}</h3>
                  <p className="stepBody">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={SECTION_IDS.about} className="section sectionAlt" aria-label="About">
          <div className="container">
            <p className="sectionKicker">About</p>
            <h2 className="sectionTitle">Independent support led by Ze Ching Oh.</h2>
            <p className="sectionLead">
              LedgerXtR is an independent accounting practice led by Ze Ching Oh, built to support
              organizations that need reliable day-to-day financial organization without the
              complexity of building a full internal accounting function. The firm focuses on
              practical bookkeeping, payroll support, sales tax organization, and clean financial
              records that help business owners and nonprofit leaders make better decisions.
            </p>
            <p className="sectionLead">
              LedgerXtR can also coordinate with your existing tax preparer, helping ensure your
              books are organized and ready when filing season arrives.
            </p>
          </div>
        </section>

        <section id={SECTION_IDS.book} className="section" aria-label="Book a call">
          <div className="container">
            <p className="sectionKicker">Book a call</p>
            <h2 className="sectionTitle">Let’s get your books under control.</h2>
            <p className="sectionLead">
              Use Microsoft Bookings if you have a link ready, or send a request below and we’ll
              follow up.
            </p>

            <div className="bookingGrid">
              <div className="panel" aria-label="Schedule on Microsoft Bookings">
                <h3 className="panelTitle">Option A: Schedule on Microsoft Bookings</h3>
                <p className="panelBody">
                  Prefer a calendar link? Add your Microsoft Bookings URL and enable direct
                  scheduling.
                </p>
                <p className="hintText">
                  You’ll be redirected to Microsoft Bookings in a new tab.
                </p>
                <a
                  className="btn btnPrimary"
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Schedule on Microsoft Bookings"
                >
                  Schedule on Microsoft Bookings
                </a>
                <p className="hintText">
                  Having trouble? Use this direct link:{' '}
                  <a className="inlineLink" href={BOOKING_URL} target="_blank" rel="noreferrer">
                    Open booking page
                  </a>
                </p>
              </div>

              <div className="panel" aria-label="Request a call form">
                <h3 className="panelTitle">Option B: Request a Call</h3>
                <p className="panelBody">
                  Tell us what you need. This form currently logs to the console (no backend yet).
                </p>

                {submitted ? (
                  <div className="successBanner" role="status" aria-live="polite">
                    Request received. We’ll follow up soon.
                  </div>
                ) : null}
                {submitError ? (
                  <div className="errorText" role="status" aria-live="polite">
                    {submitError}
                  </div>
                ) : null}

                <form className="form" onSubmit={onSubmit} noValidate>
                  <div className="fieldRow">
                    <div>
                      <label htmlFor="fullName">Full name *</label>
                      <input
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            fullName: e.target.value,
                          }))
                        }
                        aria-invalid={Boolean(errors.fullName)}
                        aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      />
                      {errors.fullName ? (
                        <div className="errorText" id="fullName-error">
                          {errors.fullName}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="orgName">Business / Organization name *</label>
                      <input
                        id="orgName"
                        name="orgName"
                        autoComplete="organization"
                        value={form.orgName}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            orgName: e.target.value,
                          }))
                        }
                        aria-invalid={Boolean(errors.orgName)}
                        aria-describedby={errors.orgName ? 'orgName-error' : undefined}
                      />
                      {errors.orgName ? (
                        <div className="errorText" id="orgName-error">
                          {errors.orgName}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="fieldRow">
                    <div>
                      <label htmlFor="email">Email *</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email ? (
                        <div className="errorText" id="email-error">
                          {errors.email}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="phone">Phone</label>
                      <input
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="fieldRow">
                    <div>
                      <label htmlFor="orgType">Organization type</label>
                      <select
                        id="orgType"
                        name="orgType"
                        value={form.orgType}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            orgType: e.target.value as OrgType,
                          }))
                        }
                      >
                        <option>Small Business</option>
                        <option>Nonprofit</option>
                        <option>Service Company</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="timeframe">Preferred meeting timeframe</label>
                      <select
                        id="timeframe"
                        name="timeframe"
                        value={form.timeframe}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            timeframe: e.target.value as MeetingTimeframe,
                          }))
                        }
                      >
                        <option>This week</option>
                        <option>Next week</option>
                        <option>Flexible</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>Services needed *</label>
                    <div className="checkboxGrid" role="group" aria-label="Services needed">
                      {(Object.keys(form.servicesNeeded) as ServiceNeeded[]).map((key) => (
                        <label className="checkItem" key={key}>
                          <input
                            type="checkbox"
                            checked={form.servicesNeeded[key]}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                servicesNeeded: {
                                  ...p.servicesNeeded,
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                          />
                          <span>{key}</span>
                        </label>
                      ))}
                    </div>
                    {errors.servicesNeeded ? (
                      <div className="errorText">{errors.servicesNeeded}</div>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          message: e.target.value,
                        }))
                      }
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message ? (
                      <div className="errorText" id="message-error">
                        {errors.message}
                      </div>
                    ) : null}
                  </div>

                  <button className="btn btnPrimary" type="submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Request a Call'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" aria-label="Footer">
        <div className="container">
          <div className="footerGrid">
            <div>
              <h3 className="footerTitle">LedgerXtR</h3>
              <p className="footerText">
                Independent bookkeeping and accounting support for growing businesses and nonprofit
                organizations—focused on clean records, clear reporting, and tax-ready books.
              </p>
              <p className="finePrint">
                Email: <a href="mailto:hello@ledgerxtr.com">hello@ledgerxtr.com</a> · Domain:{' '}
                <a href="https://ledgerxtr.com" target="_blank" rel="noreferrer">
                  ledgerxtr.com
                </a>
              </p>
            </div>

            <div aria-label="Footer links" className="footerLinks">
              {[
                { label: 'Home', id: SECTION_IDS.home },
                { label: 'Services', id: SECTION_IDS.services },
                { label: 'Who We Help', id: SECTION_IDS.whoWeHelp },
                { label: 'Process', id: SECTION_IDS.process },
                { label: 'About', id: SECTION_IDS.about },
                { label: 'Book a Call', id: SECTION_IDS.book },
              ].map((l) => (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(l.id)
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <p className="finePrint">© {new Date().getFullYear()} LedgerXtR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
