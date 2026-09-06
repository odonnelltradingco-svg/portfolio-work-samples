'use client';

import { useRef, useState } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import Image from 'next/image';
import {
  ArrowUpRight,
  Check,
  Leaf,
  Sun,
  ArrowRight,
  Sparkles,
  BedDouble,
  Bath,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { DemoRibbon, Choice } from '@/components/demo-shared';
import { cleanEstimate, cleanMoney } from '@/lib/demo-model';

const rhythms = [
  {
    value: 'once',
    label: 'Just once',
    short: 'One visit',
    saving: 'A fresh start',
  },
  {
    value: 'fortnightly',
    label: 'Every 2 weeks',
    short: 'Every two weeks',
    saving: 'Save 10%',
  },
  { value: 'weekly', label: 'Every week', short: 'Weekly', saving: 'Save 15%' },
];
const rooms = [
  {
    number: '01',
    title: 'Kitchen reset',
    description: 'A fresh canvas for the next meal.',
    tasks: [
      'Counters & sink',
      'Appliance exteriors',
      'Floors & finishing touches',
    ],
  },
  {
    number: '02',
    title: 'Bathroom refresh',
    description: 'The little rituals, made lovelier.',
    tasks: ['Fixtures & surfaces', 'Mirrors & glass', 'A thorough floor clean'],
  },
  {
    number: '03',
    title: 'Living, made lighter',
    description: 'Room to settle in and switch off.',
    tasks: [
      'Accessible surface dusting',
      'Vacuuming & mopping',
      'Bedrooms & shared spaces',
    ],
  },
];
const questions = [
  [
    'included',
    'What is included in a standard clean?',
    'The sample service covers kitchen counters, sink and appliance exteriors; bathroom fixtures and mirrors; accessible surface dusting, vacuuming and mopping. Oven interiors, exterior windows, laundry and specialist cleaning are outside this sample scope.',
  ],
  [
    'deep',
    'What does a deeper clean add?',
    'The optional $65 add-on covers extra attention to baseboards and detailed surfaces. When selected, it is included in each previewed visit. The recurring discount also applies to this add-on.',
  ],
  [
    'price',
    'How is my estimate calculated?',
    'Sample pricing is $70 per visit, plus $25 per bedroom and $20 per bathroom. A deeper clean adds $65. Every-two-week visits save 10% and weekly visits save 15% on the combined amount. Prices are shown in US dollars, calculated to the cent.',
  ],
  [
    'real',
    'Can I make a real booking here?',
    'Sunday Home is an original portfolio demonstration with a fictional brand and sample prices. The preview stays in your browser; it does not send personal information, reserve a visit or collect payment.',
  ],
];

export default function HomeCare() {
  const [beds, setBeds] = useState('2');
  const [baths, setBaths] = useState('1');
  const [frequency, setFrequency] = useState('fortnightly');
  const [deep, setDeep] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewButton = useRef<HTMLButtonElement>(null);
  const price = cleanEstimate(Number(beds), Number(baths), frequency, deep);
  const rhythm = rhythms.find((option) => option.value === frequency)!;

  return (
    <div className="home-care">
      <a href="#estimate" className="care-skip">
        Skip to the estimate
      </a>
      <DemoRibbon label="Fictional cleaning brand" />
      <header className="care-nav">
        <Link
          href="/home-care"
          className="care-logo"
          aria-label="Sunday Home — home"
        >
          <Sun size={25} aria-hidden="true" />
          sunday home
        </Link>
        <nav aria-label="Sunday Home">
          <a href="#included">Our clean</a>
          <a href="#questions">Good to know</a>
          <a href="#estimate" className="care-book">
            Find your clean <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main>
        <section className="care-hero" aria-labelledby="care-title">
          <div className="care-hero-copy">
            <p className="eyebrow">A LITTLE MORE ROOM TO LIVE</p>
            <h1 id="care-title">
              A clean home.
              <br />
              <em>A lighter Sunday.</em>
            </h1>
            <p>
              Less time catching up on the house.
              <br />
              More time for the life happening in it.
            </p>
            <a href="#estimate" className="primary-button">
              Build your clean <ArrowRight size={18} aria-hidden="true" />
            </a>
            <div className="care-perks">
              <span>
                <Check size={16} aria-hidden="true" />
                Your rhythm
              </span>
              <span>
                <Check size={16} aria-hidden="true" />
                Clear pricing
              </span>
              <span>
                <Check size={16} aria-hidden="true" />
                Thoughtful details
              </span>
            </div>
          </div>
          <div className="care-photo">
            <Image
              src="/residential-cleaning-hero.png"
              alt="A sunlit living room with white upholstery, oak furniture and leafy greenery"
              width={1536}
              height={1024}
              fetchPriority="high"
              unoptimized
            />
            <div className="care-photo-note">
              <Leaf size={22} aria-hidden="true" />
              <span>
                A fresh start.
                <br />
                <strong>A little more breathing room.</strong>
              </span>
            </div>
          </div>
        </section>

        <section
          className="care-services"
          id="included"
          aria-labelledby="services-title"
        >
          <div className="care-section-intro">
            <div>
              <p className="eyebrow">THE EVERYDAY, TAKEN CARE OF</p>
              <h2 className="section-heading" id="services-title">
                Thoughtful details.
                <br />A comfortable home.
              </h2>
            </div>
            <p>
              From the first cup of coffee to the last light out. A considered
              clean for the spaces you live in most.
            </p>
          </div>
          <div className="care-room-grid">
            {rooms.map((room) => (
              <article className="care-room" key={room.number}>
                <span className="care-room-number">
                  {room.number} / THE DETAILS
                </span>
                <h3>{room.title}</h3>
                <p>{room.description}</p>
                <ul>
                  {room.tasks.map((task) => (
                    <li key={task}>
                      <Check size={16} aria-hidden="true" />
                      {task}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          className="care-estimate"
          id="estimate"
          aria-labelledby="estimate-title"
        >
          <div className="care-estimate-intro">
            <p className="eyebrow">A CLEAN THAT FITS</p>
            <h2 className="section-heading" id="estimate-title">
              Your home.
              <br />
              <em>Your rhythm.</em>
            </h2>
            <p>
              A little reset or a regular ritual. Choose what fits, see the
              price, then take a closer look.
            </p>
            <ol className="care-steps">
              <li>
                <span>1</span>
                <div>
                  <strong>Tell us about your space</strong>
                  <p>Bedrooms and bathrooms set the starting price.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Find your rhythm</strong>
                  <p>Compare one-time and regular visits.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Make it yours</strong>
                  <p>Add the details, then preview your clean.</p>
                </div>
              </li>
            </ol>
            <p className="care-demo-note">
              An interactive portfolio demo. Sample prices in USD. No booking,
              personal details or payment required.
            </p>
          </div>
          <div className="estimate-card">
            <div className="care-card-heading">
              <span className="eyebrow">LET’S MAKE ROOM</span>
              <Sun size={22} aria-hidden="true" />
            </div>
            <h3>Build your clean</h3>
            <div className="form-two">
              <Choice
                id="beds"
                label="Bedrooms"
                value={beds}
                onChange={setBeds}
                options={[1, 2, 3, 4, 5].map((n) => ({
                  value: String(n),
                  label: n + ' bedroom' + (n > 1 ? 's' : ''),
                }))}
              />
              <Choice
                id="baths"
                label="Bathrooms"
                value={baths}
                onChange={setBaths}
                options={[1, 2, 3, 4].map((n) => ({
                  value: String(n),
                  label: n + ' bathroom' + (n > 1 ? 's' : ''),
                }))}
              />
            </div>
            <span className="field-label" id="rhythm-label">
              How often?
            </span>
            <RadioGroup
              className="care-rhythms"
              aria-labelledby="rhythm-label"
              value={frequency}
              onValueChange={(value) => setFrequency(String(value))}
            >
              {rhythms.map((option) => (
                <label
                  className={
                    'care-rhythm' +
                    (frequency === option.value ? ' selected' : '')
                  }
                  key={option.value}
                >
                  <RadioGroupItem
                    value={option.value}
                    aria-label={option.label}
                  />
                  <span className="care-rhythm-label">{option.label}</span>
                  <strong>
                    {cleanMoney(
                      cleanEstimate(
                        Number(beds),
                        Number(baths),
                        option.value,
                        deep,
                      ).total,
                    )}
                    <small>/ visit</small>
                  </strong>
                  <span className="care-rhythm-saving">{option.saving}</span>
                </label>
              ))}
            </RadioGroup>
            <label
              htmlFor="deeper-clean"
              className={'check-row care-deep' + (deep ? ' selected' : '')}
            >
              <Checkbox
                id="deeper-clean"
                checked={deep}
                onCheckedChange={setDeep}
                aria-label="Add a deeper clean"
              />
              <span>
                <strong>
                  A little extra attention{' '}
                  <Sparkles size={16} aria-hidden="true" />
                </strong>
                <small>Baseboards and detailed surfaces.</small>
                <small>+$65 per visit, before any recurring saving.</small>
              </span>
            </label>
            <dl className="care-price-lines">
              <div>
                <dt>Standard clean</dt>
                <dd>{cleanMoney(price.standard)}</dd>
              </div>
              {deep && (
                <div>
                  <dt>Deeper clean</dt>
                  <dd>{cleanMoney(price.extra)}</dd>
                </div>
              )}
              {price.discount > 0 && (
                <div className="care-saving">
                  <dt>Regular-visit saving ({price.discountPercent}%)</dt>
                  <dd>−{cleanMoney(price.discount)}</dd>
                </div>
              )}
            </dl>
            <div className="estimate-total">
              <span>
                Your sample estimate
                <small>{rhythm.short} · USD per visit</small>
              </span>
              <strong>{cleanMoney(price.total)}</strong>
            </div>
            <output className="sr-only" aria-live="polite" aria-atomic="true">
              {rhythm.short}. {beds} bedrooms, {baths} bathrooms.{' '}
              {deep ? 'With a deeper clean. ' : ''}
              {cleanMoney(price.total)} per visit.
            </output>
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger
                render={
                  <Button
                    ref={previewButton}
                    className="primary-button full-button"
                  />
                }
              >
                Preview this clean <ArrowRight size={18} aria-hidden="true" />
              </DialogTrigger>
              <DialogContent
                className="care-preview"
                finalFocus={previewButton}
              >
                <div className="care-preview-mark">
                  <Leaf size={24} aria-hidden="true" />
                  <span>SUNDAY HOME / YOUR PREVIEW</span>
                </div>
                <DialogTitle className="care-preview-title">
                  A little more room
                  <br />
                  <em>for you.</em>
                </DialogTitle>
                <DialogDescription className="care-preview-description">
                  Here’s your sample clean, with every detail in one place.
                  Nothing has been booked.
                </DialogDescription>
                <div className="care-preview-facts">
                  <span>
                    <BedDouble size={19} aria-hidden="true" />
                    {beds} {beds === '1' ? 'bedroom' : 'bedrooms'}
                  </span>
                  <span>
                    <Bath size={19} aria-hidden="true" />
                    {baths} {baths === '1' ? 'bathroom' : 'bathrooms'}
                  </span>
                  <span>
                    <CalendarDays size={19} aria-hidden="true" />
                    {rhythm.short}
                  </span>
                </div>
                <div className="care-preview-includes">
                  <strong>Your clean includes</strong>
                  <ul>
                    <li>
                      <Check size={16} aria-hidden="true" />
                      Kitchen surfaces, sink & appliance exteriors
                    </li>
                    <li>
                      <Check size={16} aria-hidden="true" />
                      Bathroom fixtures, mirrors & floors
                    </li>
                    <li>
                      <Check size={16} aria-hidden="true" />
                      Dusting, vacuuming & mopping
                    </li>
                    {deep && (
                      <li>
                        <Sparkles size={16} aria-hidden="true" />
                        Extra attention to baseboards & detailed surfaces
                      </li>
                    )}
                  </ul>
                </div>
                <dl className="care-price-lines">
                  <div>
                    <dt>Standard clean</dt>
                    <dd>{cleanMoney(price.standard)}</dd>
                  </div>
                  {deep && (
                    <div>
                      <dt>Deeper clean</dt>
                      <dd>{cleanMoney(price.extra)}</dd>
                    </div>
                  )}
                  {price.discount > 0 && (
                    <div className="care-saving">
                      <dt>Recurring saving ({price.discountPercent}%)</dt>
                      <dd>−{cleanMoney(price.discount)}</dd>
                    </div>
                  )}
                </dl>
                <div className="care-preview-total">
                  <span>
                    Sample total<small>USD per visit</small>
                  </span>
                  <strong>{cleanMoney(price.total)}</strong>
                </div>
                <Button
                  className="primary-button full-button"
                  onClick={() => setPreviewOpen(false)}
                >
                  Back to your choices{' '}
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
                <p className="care-preview-note">
                  Fictional brand · Sample pricing · No payment collected
                </p>
              </DialogContent>
            </Dialog>
            <p className="care-card-note">A preview, with no commitment.</p>
          </div>
        </section>

        <section
          id="questions"
          className="care-faq"
          aria-labelledby="questions-title"
        >
          <div>
            <p className="eyebrow">GOOD TO KNOW</p>
            <h2 className="section-heading" id="questions-title">
              A few simple answers.
            </h2>
            <p className="care-faq-intro">Clear details, from the start.</p>
          </div>
          <Accordion>
            {questions.map(([id, question, answer]) => (
              <AccordionItem value={id} key={id}>
                <AccordionTrigger className="faq-question">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="faq-answer">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <footer className="care-footer">
        <span className="care-logo">
          <Sun size={23} aria-hidden="true" />
          sunday home
        </span>
        <span>Original website demonstration by Pierce O&apos;Donnell</span>
        <a href="https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be">
          Discuss your website on Upwork ↗
        </a>
      </footer>
    </div>
  );
}
