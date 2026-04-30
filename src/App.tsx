import { useState } from 'react'
import './App.css'
import heroPhoto from './images/image_01.jpg'
import { supabase } from './lib/supabaseClient'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

type OrgType = 'Small Business' | 'Nonprofit' | 'Service Company' | 'Other'

type ServiceNeeded =
  | 'Monthly bookkeeping'
  | 'Bank/credit card reconciliations'
  | 'Financial reporting'
  | 'Cleanup / catch-up bookkeeping'
  | 'Accounts payable (Bill.com)'
  | 'Not sure / need guidance'

type YearsInBusiness = 'Just starting' | '0–2 years' | '3–5 years' | '5+ years' | ''
type AccountingSoftware = 'QuickBooks Online' | 'Other' | 'Not currently using one'
type BooksStatus =
  | 'Up to date'
  | 'A few months behind'
  | 'Several months behind'
  | 'Need full cleanup'
type StartTimeline = 'As soon as possible' | 'Within 1 month' | 'Just exploring'
type TransactionVolume = 'Low (<100 transactions)' | 'Medium (100–300)' | 'High (300+)' | ''
type PreferredNextStep = 'Email follow-up' | 'Schedule a call' | 'Not sure yet' | ''

type FormState = {
  fullName: string
  email: string
  businessName: string
  orgType: OrgType
  industry: string
  yearsInBusiness: YearsInBusiness
  servicesNeeded: Record<ServiceNeeded, boolean>
  accountingSoftware: AccountingSoftware
  booksStatus: BooksStatus
  startTimeline: StartTimeline
  transactionVolume: TransactionVolume
  additionalNotes: string
  preferredNextStep: PreferredNextStep
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
  faq: 'faq',
  book: 'book-a-call',
} as const

type FaqItem = { q: string; a: string }

function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="faqList">
      {items.map((item) => (
        <details className="faqItem" key={item.q}>
          <summary className="faqQ">{item.q}</summary>
          <div className="faqA">{item.a}</div>
        </details>
      ))}
    </div>
  )
}

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
    email: '',
    businessName: '',
    orgType: 'Small Business',
    industry: '',
    yearsInBusiness: '',
    servicesNeeded: {
      'Monthly bookkeeping': false,
      'Bank/credit card reconciliations': false,
      'Financial reporting': false,
      'Cleanup / catch-up bookkeeping': false,
      'Accounts payable (Bill.com)': false,
      'Not sure / need guidance': false,
    },
    accountingSoftware: 'QuickBooks Online',
    booksStatus: 'Need full cleanup',
    startTimeline: 'Just exploring',
    transactionVolume: '',
    additionalNotes: '',
    preferredNextStep: '',
  })

  function onNavClick(id: string) {
    setMobileOpen(false)
    scrollToId(id)
  }

  function validate(next: FormState): FormErrors {
    const nextErrors: FormErrors = {}

    if (!next.fullName.trim()) nextErrors.fullName = 'Please enter your full name.'
    if (!next.email.trim()) nextErrors.email = 'Please enter your email.'
    else if (!isValidEmail(next.email)) nextErrors.email = 'Please enter a valid email.'

    const servicesPicked = Object.values(next.servicesNeeded).some(Boolean)
    if (!servicesPicked) nextErrors.servicesNeeded = 'Select at least one service.'

    if (!next.orgType.trim()) nextErrors.orgType = 'Please select an organization type.'
    if (!next.accountingSoftware.trim())
      nextErrors.accountingSoftware = 'Please select your accounting software.'
    if (!next.booksStatus.trim()) nextErrors.booksStatus = 'Please select a books status.'
    if (!next.startTimeline.trim()) nextErrors.startTimeline = 'Please select a start timeframe.'

    return nextErrors
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(false)
    setSubmitError(null)

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (!SUPABASE_URL.trim() || !SUPABASE_ANON_KEY.trim()) {
      setSubmitError(
        'Form delivery is not configured yet. Please try again later.',
      )
      return
    }

    const servicesNeeded = (Object.keys(form.servicesNeeded) as ServiceNeeded[]).filter(
      (k) => form.servicesNeeded[k],
    )

    setSubmitting(true)
    try {
      // Supabase insert happens here.
      const payload = {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        organization_type: form.orgType,
        services_needed: servicesNeeded,
        business_name: form.businessName.trim() || null,
        industry: form.industry.trim() || null,
        years_in_business: form.yearsInBusiness || null,
        accounting_software: form.accountingSoftware,
        books_status: form.booksStatus,
        start_timeline: form.startTimeline,
        transaction_volume: form.transactionVolume || null,
        additional_notes: form.additionalNotes.trim() || null,
        preferred_next_step: form.preferredNextStep || null,
        // Back-compat columns (if still present / required in your table):
        preferred_timeframe: form.startTimeline,
        message: form.additionalNotes.trim() || '',
        phone: null,
        source: 'ledgerxtr.com',
        status: 'new',
      }

      console.log('LedgerXtR form payload:', payload)

      const { data, error } = await supabase
        .from('ledgerxtr_call_requests')
        .insert([payload])
        .select()

      if (error) {
        console.error('LedgerXtR Supabase insert error:', error)
        setSubmitError(
          error.message ||
            'Something went wrong sending your request. Please try again, or email us at info@ledgerxtr.com.',
        )
        return
      }

      console.log('LedgerXtR Supabase insert success:', data)

      setSubmitted(true)
      setForm({
        fullName: '',
        email: '',
        businessName: '',
        orgType: 'Small Business',
        industry: '',
        yearsInBusiness: '',
        servicesNeeded: {
          'Monthly bookkeeping': false,
          'Bank/credit card reconciliations': false,
          'Financial reporting': false,
          'Cleanup / catch-up bookkeeping': false,
          'Accounts payable (Bill.com)': false,
          'Not sure / need guidance': false,
        },
        accountingSoftware: 'QuickBooks Online',
        booksStatus: 'Need full cleanup',
        startTimeline: 'Just exploring',
        transactionVolume: '',
        additionalNotes: '',
        preferredNextStep: '',
      })
      setErrors({})
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
                  Accounting Service That Gives You Peace of Mind
                </h1>
                <p className="heroSubtitle">
                  Professional, reliable, and friendly bookkeeping services for small businesses and
                  individuals—specializing in virtual outsourced accounting services.
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
                    'Monthly bookkeeping + reconciliations',
                    'Cleanup / catch-up when books are behind',
                    'Payroll coordination and reporting support',
                    'Tax-ready financials (coordination with your CPA)',
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
                <img
                  className="heroPhoto"
                  src={heroPhoto}
                  alt="Workspace with accounting tools and paperwork"
                  loading="eager"
                />
                <div className="heroCardInner">
                  <p className="sectionKicker">Clarity, consistency, readiness</p>
                  <h2 className="sectionTitle" style={{ marginTop: 0 }}>
                    Clean records that stay clean.
                  </h2>
                  <p className="sectionLead">
                    We help you stay organized, understand your numbers, and feel confident about your
                    finances—without stress, confusion, or surprises.
                  </p>

                  <div className="heroMetric" aria-label="Highlights">
                    <div className="metricBox">
                      <p className="metricLabel">Focus</p>
                      <p className="metricValue">Bookkeeping</p>
                    </div>
                    <div className="metricBox">
                      <p className="metricLabel">Support</p>
                      <p className="metricValue">Payroll + Cleanup</p>
                    </div>
                    <div className="metricBox">
                      <p className="metricLabel">Outcome</p>
                      <p className="metricValue">Tax-ready financials</p>
                    </div>
                    <div className="metricBox">
                      <p className="metricLabel">Delivery</p>
                      <p className="metricValue">Virtual services</p>
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
            <h2 className="sectionTitle">Clarity, time back, and clean records.</h2>
            <p className="sectionLead">
              Outsourcing your bookkeeping helps you stay focused on running your business while
              keeping your financials accurate and up to date.
            </p>

            <div className="grid cols3 cardGrid" role="list">
              {[
                {
                  title: 'Save Time',
                  body: 'Focus on running your business—not wrestling with spreadsheets.',
                },
                {
                  title: 'Gain Clarity',
                  body: 'Understand where your money is going and what your numbers mean each month.',
                },
                {
                  title: 'Tax-Ready',
                  body: 'Seamless coordination with your CPA or tax preparer—no last-minute scrambling.',
                },
                {
                  title: 'Reduce Stress',
                  body: 'Sleep better knowing your financials are accurate and current.',
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
            <h2 className="sectionTitle">Comprehensive services, tailored to your needs.</h2>
            <p className="sectionLead">
              From cleanup to monthly maintenance, LedgerXtR provides outsourced accounting services
              for nonprofits and growing businesses.
            </p>

            <div className="grid cols3 cardGrid" role="list">
              {[
                {
                  title: 'Monthly Accounting (Bookkeeping)',
                  body: 'Ongoing categorization, reconciliation, and reporting to keep books accurate and up to date.',
                },
                {
                  title: 'Financial Reporting',
                  body: 'Monthly Profit & Loss and Balance Sheet reports to help you understand performance.',
                },
                {
                  title: 'QuickBooks Online Setup',
                  body: 'Getting your accounting software set up correctly from day one. (Custom quote)',
                },
                {
                  title: 'Cleanup / Catch-up',
                  body: 'Behind on your books? We’ll get everything organized and up to date. (Custom quote)',
                },
                {
                  title: 'Payroll Coordination',
                  body: 'Help with payroll workflows, employee payment tracking, and related reporting support. (Custom quote)',
                },
                {
                  title: 'Strategy Session',
                  body: 'A 1:1 review to discuss financial health, priorities, and next steps.',
                },
                {
                  title: 'Tax-Ready Coordination',
                  body: 'We don’t file taxes, but we provide clean financials and coordinate with your CPA or tax preparer.',
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
            <h2 className="sectionTitle">Who we work with.</h2>
            <p className="sectionLead">
              We support nonprofits, foundations, freelancers, startups, and growing businesses
              across a variety of industries—delivered virtually from Madison, Wisconsin.
            </p>

            <div className="grid cols2 cardGrid" role="list">
              {[
                {
                  title: 'Nonprofits & Foundations',
                  body: 'Organizations that need clean records and clear reports for leadership and stakeholders.',
                },
                {
                  title: 'Small Businesses',
                  body: 'Owners who want accurate books, consistent reporting, and confidence in the numbers.',
                },
                {
                  title: 'Freelancers & Solo Operators',
                  body: 'Simple bookkeeping support that keeps finances organized and predictable.',
                },
                {
                  title: 'Startups & Growing Teams',
                  body: 'Fast-moving businesses that want clean, scalable bookkeeping as they grow.',
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
            <h2 className="sectionTitle">Simple, steady bookkeeping support.</h2>
            <p className="sectionLead">
              A practical approach that keeps your books accurate, organized, and ready for your
              CPA or tax preparer.
            </p>

            <div className="processSteps" role="list">
              {[
                {
                  title: 'Discovery Call',
                  body: 'Understand your business, your current bookkeeping, and what “good” should look like.',
                },
                {
                  title: 'Review & Setup',
                  body: 'Review existing records and set up or improve your accounting system and workflows.',
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
            <h2 className="sectionTitle">Who we are.</h2>
            <p className="sectionLead">
              LedgerXtR provides bookkeeping and financial support services for growing businesses that
              need reliable oversight without hiring full-time staff.
            </p>
            <p className="sectionLead">
              Our services focus on accurate bookkeeping, reconciliations, and clear monthly financial
              reporting to help clients make informed decisions and stay prepared year-round. Services are
              provided virtually from Madison, Wisconsin.
            </p>
            <p className="sectionLead">
              We do not offer tax preparation; instead, we deliver organized, tax-ready financials and
              coordinate with your CPA or tax professional for an efficient year-end close.
            </p>
          </div>
        </section>

        <section id={SECTION_IDS.faq} className="section sectionAlt" aria-label="Frequently asked questions">
          <div className="container">
            <p className="sectionKicker">FAQ</p>
            <h2 className="sectionTitle">Frequently asked questions.</h2>
            <p className="sectionLead">Quick answers to common questions.</p>

            <Faq
              items={[
                {
                  q: "What's included in monthly outsourced accounting?",
                  a: 'Monthly accounting includes transaction categorization, bank and credit card reconciliation, and basic financial reports. Higher tiers can include additional services like payroll coordination and specialized support.',
                },
                {
                  q: 'Will you prepare and file my taxes?',
                  a: 'No. We do not file taxes, but we provide clean, tax-ready financials and work closely with your CPA or tax preparer.',
                },
                {
                  q: 'How often will we communicate?',
                  a: 'We provide monthly reports and are available via email throughout the month. Many clients also choose a quick monthly check-in call to review their numbers.',
                },
                {
                  q: 'Can you clean up or catch up my books?',
                  a: 'Yes. If your books are behind or messy, we offer cleanup and catch-up services to bring everything current and accurate.',
                },
                {
                  q: 'Do you offer virtual bookkeeping services?',
                  a: 'Yes. Services are provided remotely, allowing us to work with clients anywhere.',
                },
                {
                  q: 'Can you work with my existing CPA or accountant?',
                  a: 'Absolutely. We regularly collaborate with CPAs and tax professionals to ensure smooth year-end and tax preparation.',
                },
              ]}
            />
          </div>
        </section>

        <section id={SECTION_IDS.book} className="section" aria-label="Book a call">
          <div className="container">
            <p className="sectionKicker">Book a call</p>
            <h2 className="sectionTitle">Let’s get your books under control.</h2>
            <p className="sectionLead">
              Schedule a discovery call, or send a request below and we’ll follow up.
            </p>

            <div className="bookingGrid single">
              <div className="panel" aria-label="Request a call form">
                <h3 className="panelTitle">Request a Call</h3>
                <p className="panelBody">
                  Thank you for your interest in LedgerXtR.
                  <br />
                  Please complete the short form below so we can better understand your needs. We will
                  follow up by email.
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
                  <h4 className="panelTitle" style={{ marginTop: 4 }}>
                    Contact Information
                  </h4>
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
                  </div>

                  <div className="fieldRow">
                    <div>
                      <label htmlFor="businessName">Business name</label>
                      <input
                        id="businessName"
                        name="businessName"
                        autoComplete="organization"
                        value={form.businessName}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            businessName: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor="orgType">Type of organization *</label>
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
                        aria-invalid={Boolean(errors.orgType)}
                      >
                        <option>Small Business</option>
                        <option>Nonprofit</option>
                        <option>Sole Proprietor</option>
                        <option>Other</option>
                      </select>
                      {errors.orgType ? <div className="errorText">{errors.orgType}</div> : null}
                    </div>
                  </div>

                  <div className="fieldRow">
                    <div>
                      <label htmlFor="industry">Industry</label>
                      <input
                        id="industry"
                        name="industry"
                        value={form.industry}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            industry: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor="yearsInBusiness">How long have you been in business?</label>
                      <select
                        id="yearsInBusiness"
                        name="yearsInBusiness"
                        value={form.yearsInBusiness}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            yearsInBusiness: e.target.value as YearsInBusiness,
                          }))
                        }
                      >
                        <option value="">Select…</option>
                        <option>Just starting</option>
                        <option>0–2 years</option>
                        <option>3–5 years</option>
                        <option>5+ years</option>
                      </select>
                    </div>
                  </div>

                  <div className="fieldRow">
                    <div>
                      <label htmlFor="accountingSoftware">Are you currently using accounting software? *</label>
                      <select
                        id="accountingSoftware"
                        name="accountingSoftware"
                        value={form.accountingSoftware}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            accountingSoftware: e.target.value as AccountingSoftware,
                          }))
                        }
                        aria-invalid={Boolean(errors.accountingSoftware)}
                      >
                        <option>QuickBooks Online</option>
                        <option>Other</option>
                        <option>Not currently using one</option>
                      </select>
                      {errors.accountingSoftware ? (
                        <div className="errorText">{errors.accountingSoftware}</div>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="booksStatus">How up to date are your books? *</label>
                      <select
                        id="booksStatus"
                        name="booksStatus"
                        value={form.booksStatus}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            booksStatus: e.target.value as BooksStatus,
                          }))
                        }
                        aria-invalid={Boolean(errors.booksStatus)}
                      >
                        <option>Up to date</option>
                        <option>A few months behind</option>
                        <option>Several months behind</option>
                        <option>Need full cleanup</option>
                      </select>
                      {errors.booksStatus ? <div className="errorText">{errors.booksStatus}</div> : null}
                    </div>
                  </div>

                  <div className="fieldRow">
                    <div>
                      <label htmlFor="startTimeline">When are you looking to get started? *</label>
                      <select
                        id="startTimeline"
                        name="startTimeline"
                        value={form.startTimeline}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            startTimeline: e.target.value as StartTimeline,
                          }))
                        }
                        aria-invalid={Boolean(errors.startTimeline)}
                      >
                        <option>As soon as possible</option>
                        <option>Within 1 month</option>
                        <option>Just exploring</option>
                      </select>
                      {errors.startTimeline ? (
                        <div className="errorText">{errors.startTimeline}</div>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="transactionVolume">Estimated monthly transaction volume</label>
                      <select
                        id="transactionVolume"
                        name="transactionVolume"
                        value={form.transactionVolume}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            transactionVolume: e.target.value as TransactionVolume,
                          }))
                        }
                      >
                        <option value="">Select…</option>
                        <option>Low (&lt;100 transactions)</option>
                        <option>Medium (100–300)</option>
                        <option>High (300+)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>What services are you looking for? *</label>
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
                    <label htmlFor="additionalNotes">Anything else you’d like us to know?</label>
                    <textarea
                      id="additionalNotes"
                      name="additionalNotes"
                      value={form.additionalNotes}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          additionalNotes: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="preferredNextStep">Preferred next step</label>
                    <select
                      id="preferredNextStep"
                      name="preferredNextStep"
                      value={form.preferredNextStep}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          preferredNextStep: e.target.value as PreferredNextStep,
                        }))
                      }
                    >
                      <option value="">Select…</option>
                      <option>Email follow-up</option>
                      <option>Schedule a call</option>
                      <option>Not sure yet</option>
                    </select>
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
                Independent bookkeeping and financial support practice for growing businesses and nonprofit
                organizations—focused on clean records, clear reporting, and tax-ready books.
              </p>
              <p className="finePrint">
                Email: <a href="mailto:info@ledgerxtr.com">info@ledgerxtr.com</a> · Domain:{' '}
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
