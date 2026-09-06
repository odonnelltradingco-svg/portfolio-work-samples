'use client';

import { useRef, useState } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  LayoutTemplate,
  ChartNoAxesCombined,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { DemoRibbon, Choice } from '@/components/demo-shared';
import { ExportPreview } from '@/components/export-preview';
import { projectEstimate, money, validateProjectGoal } from '@/lib/demo-model';

const featureOptions = [
  {
    id: 'forms',
    name: 'Contact & enquiry forms',
    detail: 'A clear route from interest to conversation',
    price: 120,
  },
  {
    id: 'reporting',
    name: 'Reporting & CSV export',
    detail: 'Useful summaries and portable records',
    price: 240,
  },
  {
    id: 'content',
    name: 'Content structure',
    detail: 'Organize the copy and pages you provide',
    price: 180,
  },
];
const steps = ['Your scope', 'Your goal', 'Your outline'];

export default function ProjectQuote() {
  const [step, setStep] = useState(1);
  const [furthest, setFurthest] = useState(1);
  const [kind, setKind] = useState('website');
  const [pages, setPages] = useState('3');
  const [features, setFeatures] = useState<string[]>(['forms']);
  const [name, setName] = useState('');
  const [brief, setBrief] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [complete, setComplete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const estimate = projectEstimate(kind, Number(pages), features);
  const errors = validateProjectGoal(name, brief);
  const kindLabel =
    kind === 'website' ? 'Service website' : 'Reporting dashboard';
  const selectedFeatures = featureOptions.filter((feature) =>
    features.includes(feature.id),
  );
  const summary = `SCOPE STUDIO - ORIGINAL DEMONSTRATION\n\nProject: ${name.trim()}\nType: ${kindLabel}\nPages/screens: ${pages}\nFeatures: ${selectedFeatures.map((feature) => feature.name).join(', ') || 'Core scope only'}\n\nPROJECT GOAL\n${brief.trim()}\n\nSAMPLE PRICE BREAKDOWN (USD)\nCore project, including first page/screen: ${money(estimate.basePrice)}\nAdditional pages/screens: ${money(estimate.pageCost)}\n${selectedFeatures.map((feature) => `${feature.name}: ${money(feature.price)}`).join('\n')}${selectedFeatures.length ? '\n' : ''}Starting estimate: ${money(estimate.low)}\nScope allowance: ${money(estimate.high - estimate.low)}\nIllustrative range: ${money(estimate.low)}-${money(estimate.high)}\nIllustrative delivery: ${estimate.days} business days\n\nASSUMPTIONS\nSupplied content and existing compatible hosting. Final scope, integrations and delivery depend on the agreed requirements. Hosting, domains and third-party fees are excluded from these sample figures.\n\nThis is a locally generated sample brief, not a submitted enquiry or binding quote.`;

  function moveTo(nextStep: number) {
    if (nextStep === 3 && (errors.name || errors.brief)) {
      setStep(2);
      setShowErrors(true);
      requestAnimationFrame(() =>
        (errors.name ? nameRef.current : goalRef.current)?.focus(),
      );
      return;
    }
    setShowErrors(false);
    setStep(nextStep);
    setFurthest((current) => Math.max(current, nextStep));
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function loadExample() {
    setName(
      kind === 'website'
        ? 'Northstar Home Services'
        : 'Northstar sales overview',
    );
    setBrief(
      kind === 'website'
        ? 'Help local homeowners compare our services and request a quote from their phone.'
        : 'Help a small team filter paid orders, understand profit and export the records behind the totals.',
    );
    setShowErrors(false);
    nameRef.current?.focus();
  }

  return (
    <div className="quote-app">
      <DemoRibbon label="Guided form · illustrative pricing" />
      <div className="quote-shell">
        <aside className="quote-aside">
          <Link href="/project-quote" className="quote-logo">
            <Layers size={25} aria-hidden="true" />
            scope studio<span> / </span>
          </Link>
          <div>
            <p className="eyebrow">GOOD PROJECTS START CLEAR</p>
            <h1>
              Make room
              <br />
              for your
              <br />
              <em>next idea.</em>
            </h1>
            <p>
              A few thoughtful choices.
              <br />A brief you can build from.
            </p>
          </div>
          <div className="quote-aside-bottom">
            <div>
              <span>01—03</span>
              <strong>From idea to outline.</strong>
            </div>
            <p>
              Original interactive form demonstration.
              <br />
              Your entries stay in this page.
            </p>
          </div>
        </aside>
        <main className="quote-main">
          <header className="quote-top">
            <span>PROJECT PLANNER</span>
            <Link href="/">All examples ↗</Link>
          </header>
          {complete ? (
            <section className="quote-success">
              <div className="success-icon">
                <Check size={32} aria-hidden="true" />
              </div>
              <p className="eyebrow">YOUR SAMPLE BRIEF IS READY</p>
              <h2 ref={headingRef} tabIndex={-1}>
                Clarity looks
                <br />
                good on you.
              </h2>
              <p>
                Your scope, goal and sample pricing are ready to review, copy or
                download. No enquiry has been sent.
              </p>
              <div className="summary-box">
                <h3>{name.trim()}</h3>
                <p>
                  {kindLabel} · {pages} pages/screens
                </p>
                <strong>
                  {money(estimate.low)}–{money(estimate.high)}
                </strong>
                <p>Illustrative range · {estimate.days} business days</p>
                <p className="quote-summary-goal">{brief.trim()}</p>
              </div>
              <div className="quote-success-actions">
                <ExportPreview
                  text={summary}
                  filename="sample-project-brief.txt"
                  title="Your sample project brief"
                  description="Review the complete outline before downloading or copying it. Your information has not been sent anywhere."
                  label="View & export brief"
                  className="quote-next"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setComplete(false);
                    moveTo(1);
                  }}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Edit choices
                </Button>
              </div>
              <p className="quote-fineprint">
                Fictional project details only. Refreshing this page clears your
                entries.
              </p>
            </section>
          ) : (
            <>
              <div className="quote-progress">
                <div>
                  <span>STEP {step} OF 3</span>
                  <strong>{steps[step - 1]}</strong>
                </div>
                <Progress
                  value={(step / 3) * 100}
                  aria-label="Project brief progress"
                />
                <ol className="quote-step-nav" aria-label="Project steps">
                  {steps.map((label, index) => (
                    <li key={label}>
                      <button
                        type="button"
                        disabled={index + 1 > furthest}
                        aria-current={step === index + 1 ? 'step' : undefined}
                        onClick={() => moveTo(index + 1)}
                      >
                        {index + 1}. {label}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              <section className="quote-step" aria-label={steps[step - 1]}>
                {step === 1 ? (
                  <>
                    <p className="eyebrow">LET’S START WITH THE SHAPE</p>
                    <h2 ref={headingRef} tabIndex={-1}>
                      What are we making?
                    </h2>
                    <RadioGroup
                      value={kind}
                      onValueChange={(value) => setKind(String(value))}
                      aria-label="Project type"
                      className="project-types"
                    >
                      {[
                        {
                          id: 'website',
                          title: 'A service website',
                          description: 'A clear home for your business',
                          Icon: LayoutTemplate,
                        },
                        {
                          id: 'dashboard',
                          title: 'A reporting dashboard',
                          description: 'Turn records into useful decisions',
                          Icon: ChartNoAxesCombined,
                        },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={
                            'project-type ' +
                            (kind === item.id ? 'selected' : '')
                          }
                        >
                          <item.Icon size={26} aria-hidden="true" />
                          <strong>{item.title}</strong>
                          <span>{item.description}</span>
                          <RadioGroupItem
                            value={item.id}
                            aria-label={item.title}
                          />
                        </label>
                      ))}
                    </RadioGroup>
                    <Choice
                      id="pages"
                      label="How many pages or screens?"
                      value={pages}
                      onChange={setPages}
                      options={Array.from({ length: 8 }, (_, index) => ({
                        value: String(index + 1),
                        label: `${index + 1} ${index ? 'pages / screens' : 'page / screen'}`,
                      }))}
                    />
                    <h3 className="features-title">
                      What else should it include?
                    </h3>
                    <div className="feature-list">
                      {featureOptions.map((feature) => (
                        <label
                          className="feature-row"
                          key={feature.id}
                          htmlFor={'feature-' + feature.id}
                        >
                          <Checkbox
                            id={'feature-' + feature.id}
                            aria-label={feature.name}
                            checked={features.includes(feature.id)}
                            onCheckedChange={(checked) =>
                              setFeatures((current) =>
                                checked
                                  ? [...new Set([...current, feature.id])]
                                  : current.filter(
                                      (value) => value !== feature.id,
                                    ),
                              )
                            }
                          />
                          <span>
                            <strong>{feature.name}</strong>
                            <small>{feature.detail}</small>
                          </span>
                          <b>+{money(feature.price)}</b>
                        </label>
                      ))}
                    </div>
                    <details className="quote-breakdown">
                      <summary>How the sample price adds up</summary>
                      <dl>
                        <div>
                          <dt>Core project, including first page</dt>
                          <dd>{money(estimate.basePrice)}</dd>
                        </div>
                        <div>
                          <dt>
                            {Number(pages) - 1} additional pages / screens
                          </dt>
                          <dd>{money(estimate.pageCost)}</dd>
                        </div>
                        {selectedFeatures.map((feature) => (
                          <div key={feature.id}>
                            <dt>{feature.name}</dt>
                            <dd>{money(feature.price)}</dd>
                          </div>
                        ))}
                        <div>
                          <dt>Starting estimate</dt>
                          <dd>{money(estimate.low)}</dd>
                        </div>
                        <div>
                          <dt>Scope allowance (25%)</dt>
                          <dd>{money(estimate.high - estimate.low)}</dd>
                        </div>
                      </dl>
                      <p>
                        The range allows for details still to be agreed. Sample
                        figures exclude hosting, domains and third-party fees.
                      </p>
                    </details>
                  </>
                ) : step === 2 ? (
                  <>
                    <p className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</p>
                    <h2 ref={headingRef} tabIndex={-1}>
                      What should it achieve?
                    </h2>
                    <p className="quote-help">
                      Try the form with fictional details. Nothing is sent or
                      saved to an account.
                    </p>
                    <label className="field-label" htmlFor="project-name">
                      Project name
                    </label>
                    <Input
                      ref={nameRef}
                      id="project-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={80}
                      placeholder="e.g. Northstar Studio website"
                      className="input-control"
                      aria-invalid={showErrors && !!errors.name}
                      aria-describedby={
                        showErrors && errors.name ? 'name-error' : undefined
                      }
                    />
                    {showErrors && errors.name && (
                      <p className="quote-field-error" id="name-error">
                        {errors.name}
                      </p>
                    )}
                    <label
                      className="field-label goal-label"
                      htmlFor="project-goal"
                    >
                      The main goal
                    </label>
                    <Textarea
                      ref={goalRef}
                      id="project-goal"
                      value={brief}
                      onChange={(event) => setBrief(event.target.value)}
                      maxLength={600}
                      placeholder="What should visitors or team members be able to do?"
                      className="goal-input"
                      aria-invalid={showErrors && !!errors.brief}
                      aria-describedby={
                        'goal-hint' +
                        (showErrors && errors.brief ? ' goal-error' : '')
                      }
                    />
                    <div className="field-hint" id="goal-hint">
                      <span>
                        At least 15 characters, excluding outer spaces
                      </span>
                      <span>{brief.trim().length}/600</span>
                    </div>
                    {showErrors && errors.brief && (
                      <p className="quote-field-error" id="goal-error">
                        {errors.brief}
                      </p>
                    )}
                    <div className="quote-helper-row">
                      <p>Need a starting point for this demo?</p>
                      <Button variant="outline" onClick={loadExample}>
                        Use sample details
                      </Button>
                    </div>
                    <div className="brief-tip">
                      <strong>Make the outcome specific</strong>
                      <p>
                        “Help local homeowners understand our services and
                        request a quote from their phone.”
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">A STRONG STARTING POINT</p>
                    <h2 ref={headingRef} tabIndex={-1}>
                      Here’s your outline.
                    </h2>
                    <div className="review-brief">
                      <div className="quote-review-head">
                        <span>Your project</span>
                        <Button variant="ghost" onClick={() => moveTo(2)}>
                          <Pencil size={15} aria-hidden="true" />
                          Edit goal
                        </Button>
                      </div>
                      <h3>{name.trim()}</h3>
                      <p>{brief.trim()}</p>
                      <div className="quote-review-head">
                        <span>Your scope</span>
                        <Button variant="ghost" onClick={() => moveTo(1)}>
                          <Pencil size={15} aria-hidden="true" />
                          Edit scope
                        </Button>
                      </div>
                      <dl>
                        <dt>Project</dt>
                        <dd>{kindLabel}</dd>
                        <dt>Pages / screens</dt>
                        <dd>{pages}</dd>
                        <dt>Included options</dt>
                        <dd>
                          {selectedFeatures
                            .map((feature) => feature.name)
                            .join(', ') || 'Core scope only'}
                        </dd>
                        <dt>Illustrative timeline</dt>
                        <dd>{estimate.days} business days</dd>
                      </dl>
                      <div className="quote-review-cost">
                        <dl>
                          <div>
                            <dt>Core project</dt>
                            <dd>{money(estimate.basePrice)}</dd>
                          </div>
                          <div>
                            <dt>Additional pages / screens</dt>
                            <dd>{money(estimate.pageCost)}</dd>
                          </div>
                          <div>
                            <dt>Selected options</dt>
                            <dd>{money(estimate.featureCost)}</dd>
                          </div>
                          <div>
                            <dt>Scope allowance</dt>
                            <dd>Up to {money(estimate.high - estimate.low)}</dd>
                          </div>
                        </dl>
                        <div className="quote-review-total">
                          <span>Illustrative range · USD</span>
                          <strong>
                            {money(estimate.low)}–{money(estimate.high)}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <p className="quote-help">
                      Your brief includes these choices and pricing assumptions.
                      It is a sample outline, not a real enquiry or binding
                      quote.
                    </p>
                  </>
                )}
              </section>
              <footer className="quote-bottom">
                <div>
                  <span>ILLUSTRATIVE ESTIMATE</span>
                  <strong>
                    {money(estimate.low)}–{money(estimate.high)}
                  </strong>
                  <small>USD · Scope dependent · No payment</small>
                </div>
                <output className="sr-only" aria-live="polite">
                  Sample estimate {money(estimate.low)} to{' '}
                  {money(estimate.high)}, {estimate.days} business days.
                </output>
                <div className="quote-step-buttons">
                  {step > 1 && (
                    <Button
                      variant="ghost"
                      aria-label="Previous step"
                      onClick={() => moveTo(step - 1)}
                    >
                      <ArrowLeft size={20} aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    className="quote-next"
                    onClick={() => {
                      if (step === 3) {
                        setComplete(true);
                        requestAnimationFrame(() =>
                          headingRef.current?.focus(),
                        );
                      } else moveTo(step + 1);
                    }}
                  >
                    {step === 3 ? 'Create sample brief' : 'Continue'}
                    <ArrowRight size={19} aria-hidden="true" />
                  </Button>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
