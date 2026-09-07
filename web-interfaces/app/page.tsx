import Image from 'next/image';
import { SiteLink as Link } from '@/components/site-link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileSpreadsheet,
  CheckCheck,
} from 'lucide-react';
import { analyzeOrders, displayUsd } from '@/lib/order-cleanup';
import { SAMPLE_ORDER_CSV } from '@/lib/order-sample';
import './portfolio.css';

const examples = [
  {
    number: '01',
    href: '/home-care',
    name: 'Sunday Home',
    type: 'SERVICE BUSINESS WEBSITE',
    description:
      'A considered home for a cleaning brand, with clear services and a price visitors can explore.',
    tone: 'sunday',
    image: '/work/sunday-home.jpg',
    features: [
      'Home-size and visit-plan comparison',
      'Exact savings and itemized service preview',
      'English/French interface with retained choices',
    ],
    try: 'Add a deeper clean and compare weekly with one-time pricing.',
    cta: 'Explore the website',
  },
  {
    number: '02',
    href: '/insights',
    name: 'Fieldnote',
    type: 'BUSINESS REPORTING DASHBOARD',
    description:
      'A useful view of sales, with every total connected to the records behind it.',
    tone: 'fieldnote',
    image: '/work/fieldnote.jpg',
    features: [
      'Combined search, date and status filters',
      'Order details with revenue/profit contributions',
      'Preview, copy and export the current view',
    ],
    try: 'Filter by Website, then open an order to follow its numbers.',
    cta: 'Explore the dashboard',
  },
  {
    number: '03',
    href: '/project-quote',
    name: 'Scope Studio',
    type: 'GUIDED PROJECT BRIEF',
    description:
      'A focused form that turns a few choices into a clear, usable project outline.',
    tone: 'scope',
    image: '/work/scope-studio.jpg',
    features: [
      'Three-step flow and optional local drafts',
      'Field-level validation and sample details',
      'Itemized estimate and a complete brief export',
    ],
    try: 'Save a sample draft, refresh, then restore it and finish the outline.',
    cta: 'Build a sample brief',
  },
];

const projectShortcuts = [
  { label: 'Business websites', href: '/home-care' },
  { label: 'Dashboards', href: '/insights' },
  { label: 'Forms & quotes', href: '/project-quote' },
  { label: 'CSV cleanup', href: '/data-cleanup' },
  { label: 'PDF reporting', href: '#csv-report' },
  { label: 'Data analysis', href: '/downloads/fulfillment-eda.html' },
  { label: 'HTML repairs', href: '/downloads/site-repair.html' },
  { label: 'Excel trackers', href: '/downloads/job-tracker.html' },
];

export default function Home() {
  const cleanup = analyzeOrders(SAMPLE_ORDER_CSV).summary;
  return (
    <main className="portfolio-work">
      <header className="portfolio-nav">
        <Link href="/" className="wordmark">
          PO<span> / </span>Selected work
        </Link>
        <a className="text-link" href="#contact-title">
          Discuss a project ↓
        </a>
      </header>
      <section className="portfolio-intro">
        <p className="eyebrow">PIERCE O’DONNELL / INTERACTIVE PORTFOLIO</p>
        <h1>
          Useful websites.
          <br />
          <em>Working details.</em>
        </h1>
        <p>
          I build responsive websites and practical business tools. These
          original examples show the design, the decisions and the interactions.
          Open one and try it.
        </p>
        <div className="portfolio-intro-actions">
          <a href="#selected-work" className="primary-button">
            Explore the work <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a
            href="https://odonnellos.online/studio"
            className="secondary-button"
          >
            Visit O’Donnell OS Studio{' '}
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>
      <nav className="work-project-index" aria-labelledby="project-index-title">
        <h2 id="project-index-title">Explore by project</h2>
        <ul>
          {projectShortcuts.map((shortcut) => (
            <li key={shortcut.href}>
              <a href={shortcut.href}>
                {shortcut.label}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <a
          className="work-index-resume"
          href="/downloads/pierce-odonnell-professional-resume.pdf"
        >
          View one-page resume (PDF)
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </nav>
      <section
        className="work-walkthrough"
        id="walkthrough"
        aria-labelledby="walkthrough-title"
      >
        <div className="work-walkthrough-copy">
          <p className="eyebrow">A QUICK LOOK AT THE WORK</p>
          <h2 id="walkthrough-title">Six views. 36 seconds.</h2>
          <p>
            See my live product, original website and workflow demonstrations,
            then explore the working examples below.
          </p>
          <p className="work-walkthrough-note">
            Silent, with on-screen captions. Actual screenshots; demonstration
            brands and data are fictional.
          </p>
          <a href="/downloads/selected-work.mp4" download>
            Download the video (5.5 MB)
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className="work-walkthrough-player">
          <video
            controls
            playsInline
            preload="none"
            width={1920}
            height={1080}
            poster="/work/selected-work-poster.jpg"
            aria-label="Pierce O’Donnell selected work, 36-second silent video"
            aria-describedby="walkthrough-summary"
          >
            <source src="/downloads/selected-work.mp4" type="video/mp4" />
            <track
              src="/downloads/selected-work.vtt"
              kind="captions"
              srcLang="en"
              label="On-screen text"
            />
            <a href="/downloads/selected-work.mp4" download>
              Download the portfolio video.
            </a>
          </video>
          <details id="walkthrough-summary">
            <summary>Read the video summary</summary>
            <ol>
              <li>
                <strong>O’Donnell OS:</strong> my original live product, shown
                with sample data.
              </li>
              <li>
                <strong>Sunday Home:</strong> a service website with a guided
                estimate and a clear next step.
              </li>
              <li>
                <strong>Fieldnote:</strong> sales filters, individual records
                and exports.
              </li>
              <li>
                <strong>Scope Studio:</strong> a guided form and downloadable
                project outline.
              </li>
              <li>
                <strong>Orderly:</strong> CSV review that preserves source
                values and explains exceptions.
              </li>
              <li>
                <strong>O’Donnell OS Studio:</strong> my studio website. Share
                your goal, site or file, and deadline using the contact options
                below.
              </li>
            </ol>
          </details>
        </div>
      </section>
      <section id="selected-work" aria-labelledby="selected-work-title">
        <div className="work-intro-rule">
          <h2 id="selected-work-title">
            Three different workflows. All interactive.
          </h2>
          <p>
            Original demonstration projects with fictional brands and data. The
            screenshots below come from the working interfaces.
          </p>
        </div>
        <div className="work-gallery">
          {examples.map((example) => (
            <article
              className={'work-project ' + example.tone}
              key={example.href}
            >
              <Link
                href={example.href}
                className="work-image-link"
                aria-label={'Open ' + example.name}
              >
                <Image
                  src={example.image}
                  alt={example.name + ' working interface screenshot'}
                  width={1135}
                  height={example.tone === 'scope' ? 1162 : 900}
                  unoptimized
                />
              </Link>
              <div className="work-project-body">
                <p className="work-project-type">
                  {example.number} / {example.type}
                </p>
                <h3>{example.name}</h3>
                <p>{example.description}</p>
                <ul>
                  {example.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="work-project-try">
                  <span>TRY THIS</span>
                  <p>{example.try}</p>
                  <Link href={example.href}>
                    {example.cta}
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="work-cleanup" aria-labelledby="cleanup-title">
        <div>
          <p className="eyebrow">AUTOMATION / A WORKFLOW YOU CAN INSPECT</p>
          <h2 id="cleanup-title">
            Orderly.
            <br />
            The useful side of messy data.
          </h2>
          <p>
            An interactive CSV workbench that keeps a clear trail from original
            export to accepted orders. Paste or choose a file, inspect the
            exceptions, and reconcile separate totals.
          </p>
          <Link href="/data-cleanup" className="primary-button">
            Try the cleanup workbench{' '}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <span className="work-cleanup-note">
            Original browser demo + runnable Python source. Fictional sample;
            local processing.
          </span>
          <a
            className="work-cleanup-case-link"
            href="/downloads/orderly-case-study.pdf"
            download
          >
            One-page case study (PDF){' '}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div
          className="work-cleanup-proof"
          aria-label="Results calculated from the included fictional CSV"
        >
          <div className="work-cleanup-file">
            <FileSpreadsheet size={26} aria-hidden="true" />
            <span>
              sample-orders.csv
              <small>{cleanup.input_records} original records</small>
            </span>
            <CheckCheck size={21} aria-hidden="true" />
          </div>
          <dl>
            <div>
              <dt>Accepted</dt>
              <dd>{cleanup.accepted_records}</dd>
            </div>
            <div>
              <dt>Need review</dt>
              <dd>{cleanup.rejected_records}</dd>
            </div>
            <div>
              <dt>Paid order total</dt>
              <dd>{displayUsd(cleanup.collected_revenue_usd)}</dd>
            </div>
          </dl>
          <p>
            Source lines preserved. Invalid rows explained.
            <br />
            Pending and refunded values kept separate.
          </p>
          <Link href="/data-cleanup">
            Open the working review <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section
        className="work-original"
        aria-labelledby="original-product-title"
      >
        <div>
          <p className="eyebrow">BEYOND THE DEMOS / MY ORIGINAL PRODUCT</p>
          <h2 id="original-product-title">
            O’Donnell OS.
            <br />
            Connected business workflows.
          </h2>
          <p>
            My own application connects inventory, sales, customers, fulfillment
            and reporting. In its seven-step public preview, follow one sample
            item from purchase through inventory and a simulated marketplace
            sale, then inspect costs, fees, shipping and profit. No sign-in is
            needed; the preview uses sample data.
          </p>
          <div className="work-original-links">
            <a href="https://odonnellos.online/demo">
              Follow the seven-step demo{' '}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <a href="https://odonnellos.online/studio">
              Explore my studio <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <a
          href="https://odonnellos.online/demo"
          className="work-original-image"
          aria-label="Explore the O'Donnell OS product demo"
        >
          <Image
            src="/work/odonnell-os.jpg"
            alt="Actual O'Donnell OS product website"
            width={1265}
            height={1000}
            unoptimized
          />
        </a>
      </section>
      <section className="work-downloads" aria-labelledby="downloads-title">
        <div className="work-intro-rule">
          <h2 id="downloads-title">Take a closer look.</h2>
          <p>
            Keep a concise work sample, inspect the source, or run the examples
            yourself.
          </p>
        </div>
        <div className="work-download-grid">
          <a href="/downloads/selected-web-projects.pdf" download>
            <span>PROJECT CASE STUDIES · PDF</span>
            <h3>Four projects. The work behind each.</h3>
            <p>
              Actual screens, my contribution and a useful interaction to try.
              Four pages with live links.
            </p>
            <strong>
              Download the project pack{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
          </a>
          <a href="/downloads/pierce-odonnell-resume.pdf" download>
            <span>VISUAL RESUME & LIVE WORK · PDF</span>
            <h3>Experience, services and working examples.</h3>
            <p>
              A two-page overview of my original product, web development work
              and delivery approach.
            </p>
            <strong>
              Download the visual resume{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
          </a>
          <a href="/downloads/csv-cleanup-sample.zip" download>
            <span>PYTHON AUTOMATION · ZIP</span>
            <h3>Messy CSV in. Traceable results out.</h3>
            <p>
              A runnable sample with source, fictional input, cleaned rows, an
              exception report and eight checks. Python 3.10+; no extra
              packages.
            </p>
            <strong>
              Download the sample <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
          </a>
          <a id="csv-report" href="/downloads/csv-to-pdf-sample.zip" download>
            <span>CSV TO PDF · RUNNABLE PYTHON SAMPLE</span>
            <h3>Clear order reports. Calculations you can follow.</h3>
            <p>
              Fictional order reports with preserved accented names and the
              complete source. Includes a repeatable folder workflow, file
              history, duplicate handling and readable errors, with ten
              conversion and twelve workflow checks.
            </p>
            <strong>
              Download the report and source{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
          </a>
          <Link href="/downloads/fulfillment-eda.html">
            <span>PYTHON & PANDAS · ANALYSIS NOTEBOOK</span>
            <h3>From messy orders to explained findings.</h3>
            <p>
              A complete analysis of 243 fictional records, with review
              decisions, three focused figures and an executed notebook you can
              rerun.
            </p>
            <strong>
              Read the visual report{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
          </Link>
          <Link href="/downloads/site-repair.html">
            <span>WEBSITE REPAIR · SOURCE & VERIFICATION</span>
            <h3>Three fixes. One portable website.</h3>
            <p>
              A focused HTML repair demonstration: exact filename case, portable
              assets and a corrected page link. Same content and design, with
              every change and reference accounted for.
            </p>
            <strong>
              Inspect the repair case study{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
          </Link>
          <Link href="/downloads/job-tracker.html">
            <span>EXCEL & PYTHON · TRACKER CLEANUP</span>
            <h3>Organized jobs. Every original retained.</h3>
            <p>
              An editable workbook with active jobs, retained archives and a
              review queue. Eighteen fictional records, clear decisions and
              runnable cleanup source.
            </p>
            <strong>
              Inspect the tracker sample{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
          </Link>
        </div>
        <nav
          className="work-resume-formats"
          aria-label="Additional resume formats"
        >
          <span>Prefer a quick summary?</span>
          <a href="/downloads/pierce-odonnell-professional-resume.pdf" download>
            One-page resume (PDF)
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <a href="/downloads/pierce-odonnell-professional-resume.txt" download>
            Editable resume (TXT)
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </nav>
        <a
          className="work-source-browse"
          href="https://github.com/odonnelltradingco-svg/portfolio-work-samples"
        >
          Browse source and automatic checks on GitHub
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </section>
      <section className="work-contact" aria-labelledby="contact-title">
        <div>
          <h2 id="contact-title">Start with one small project.</h2>
          <p>
            Introductory offers for new direct clients, priced in US dollars.
            Each includes one revision. We agree the scope and delivery before
            work starts.
          </p>
          <dl
            className="work-starter-offers"
            aria-label="Introductory project prices"
          >
            <div>
              <dt>
                <strong>One HTML reference repair</strong>
                <span>
                  Fix one broken image or link on one static HTML page.
                </span>
              </dt>
              <dd>$10</dd>
            </div>
            <div>
              <dt>
                <strong>One product CSV cleanup</strong>
                <span>
                  Up to 200 rows and 10 columns, with a separate review report.
                </span>
              </dt>
              <dd>$25</dd>
            </div>
            <div>
              <dt>
                <strong>A three-section React landing page</strong>
                <span>
                  Adapt my existing design using your supplied text and images.
                </span>
              </dt>
              <dd>$99</dd>
            </div>
          </dl>
          <p className="work-offer-boundaries">
            Hosting, domains, extra pages, custom forms and booking systems are
            separate. Existing proposal and contract prices still apply.
          </p>
          <p className="work-offer-intake">
            Send your goal, existing website or file, and preferred deadline.
          </p>
        </div>
        <div className="work-contact-actions">
          <a
            href="https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be"
            className="primary-button"
          >
            Discuss it on Upwork <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <a
            href="https://www.linkedin.com/services/page/b6872a346b4a4a740b"
            className="secondary-button"
          >
            New inquiries on LinkedIn{' '}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
      <footer className="portfolio-footer">
        <p>
          Original work by Pierce O’Donnell. Demo brands and data are fictional.
        </p>
        <a href="https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be">
          Upwork projects: message and hire me on Upwork.
        </a>
      </footer>
    </main>
  );
}
