import { useState } from 'react'
import './App.css'
import heroPhoto from './images/image_01.jpg'
import clarityPhoto from './images/image_03.jpg'
import { supabase } from './lib/supabaseClient'

const BOOKING_URL =
  'https://bookings.cloud.microsoft/bookwithme/user/f605dc552bc64fc192526c3c83792ea3%40ledgerxtr.com/meetingtype/_FgRgTaOQEyk_G3rlVZV7w2?anonymous&ismsaljsauthenabled'
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

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
  pricing: 'pricing',
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
        business_name: form.orgName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        organization_type: form.orgType,
        preferred_timeframe: form.timeframe,
        services_needed: servicesNeeded,
        message: form.message.trim(),
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
                  href={`#${SECTION_IDS.pricing}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavClick(SECTION_IDS.pricing)
                  }}
                >
                  Pricing
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
                href={`#${SECTION_IDS.pricing}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavClick(SECTION_IDS.pricing)
                }}
              >
                Pricing
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
              LedgerXtR is an independent bookkeeping and accounting support practice led by Ze Ching
              Oh. Based in Madison, Wisconsin, we help small business owners stay organized, understand
              their numbers, and feel confident about their finances.
            </p>
            <p className="sectionLead">
              With years of hands-on accounting and bookkeeping experience, we keep things practical:
              accurate books, consistent reconciliations, and clear monthly reporting—delivered
              virtually so you can work with us from anywhere.
            </p>
            <p className="sectionLead">
              We do not file taxes. Instead, we provide clean, tax-ready financials and coordinate
              with your CPA or tax preparer so year-end is smooth and efficient.
            </p>
          </div>
        </section>

        <section id={SECTION_IDS.pricing} className="section" aria-label="Pricing">
          <div className="container">
            <p className="sectionKicker">Pricing</p>
            <h2 className="sectionTitle">Simple, transparent monthly packages.</h2>
            <p className="sectionLead">
              Pricing depends on your transaction volume and the services you need. We’ll recommend a
              package after a quick consultation—no hidden fees.
            </p>

            <div className="pricingWrap">
              <div className="pricingMedia" aria-label="Financial organization illustration">
                <img
                  className="pricingPhoto"
                  src={clarityPhoto}
                  alt="Organized desk with laptop and financial documents"
                  loading="lazy"
                />
              </div>

              <div className="grid cols3 cardGrid" role="list" aria-label="Pricing tiers">
                {[
                  {
                    title: 'Starter',
                    body: 'Monthly bookkeeping basics: categorization, reconciliation, and core reporting.',
                  },
                  {
                    title: 'Growth',
                    body: 'Adds deeper reporting support and monthly review to improve clarity and consistency.',
                  },
                  {
                    title: 'Full Support',
                    body: 'For complex needs—can include cleanup/catch-up, payroll coordination, and add-ons.',
                  },
                ].map((tier) => (
                  <div className="card" role="listitem" key={tier.title}>
                    <h3 className="cardTitle">{tier.title}</h3>
                    <p className="cardBody">{tier.body}</p>
                    <p className="hintText">
                      Custom quotes available for QuickBooks setup, cleanup/catch-up, payroll, and add-ons
                      (e.g., job costing).
                    </p>
                  </div>
                ))}
              </div>
            </div>
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

            <div className="bookingGrid">
              <div className="panel" aria-label="Schedule on Microsoft Bookings">
                <h3 className="panelTitle">Option A: Schedule on Microsoft Bookings</h3>
                <p className="panelBody">
                  Book time to connect. You’ll be redirected to Microsoft Bookings in a new tab.
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
                  Tell us what you need. We’ll follow up by email to confirm next steps.
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
                { label: 'Pricing', id: SECTION_IDS.pricing },
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
