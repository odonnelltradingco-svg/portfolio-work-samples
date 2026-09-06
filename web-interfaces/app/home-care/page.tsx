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
import { cleanEstimate } from '@/lib/demo-model';
import {
  careCopy,
  careMoney,
  careRoomCount,
  type CareLanguage,
} from '@/lib/home-care-copy';

export default function HomeCare() {
  const [language, setLanguage] = useState<CareLanguage>('en');
  const copy = careCopy[language];
  const formatMoney = (amount: number) => careMoney(amount, language);
  const [beds, setBeds] = useState('2');
  const [baths, setBaths] = useState('1');
  const [frequency, setFrequency] = useState('fortnightly');
  const [deep, setDeep] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewButton = useRef<HTMLButtonElement>(null);
  const price = cleanEstimate(Number(beds), Number(baths), frequency, deep);
  const rhythm = copy.rhythms.find((option) => option.value === frequency)!;

  return (
    <div className="home-care" lang={language}>
      <a href="#estimate" className="care-skip">
        {copy.skip}
      </a>
      <DemoRibbon label={copy.brand} copy={copy} />
      <div className="care-language-bar">
        <span>{copy.language}</span>
        <div
          className="care-language-switch"
          role="group"
          aria-label={copy.language}
        >
          <button
            type="button"
            lang="en"
            aria-pressed={language === 'en'}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
          <button
            type="button"
            lang="fr"
            aria-pressed={language === 'fr'}
            onClick={() => setLanguage('fr')}
          >
            Français
          </button>
        </div>
      </div>
      <header className="care-nav">
        <Link href="/home-care" className="care-logo" aria-label={copy.home}>
          <Sun size={25} aria-hidden="true" />
          sunday home
        </Link>
        <nav aria-label="Sunday Home">
          <a href="#included">{copy.ourClean}</a>
          <a href="#questions">{copy.goodToKnow}</a>
          <a href="#estimate" className="care-book">
            {copy.findClean} <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main>
        <section className="care-hero" aria-labelledby="care-title">
          <div className="care-hero-copy">
            <p className="eyebrow">{copy.heroEyebrow}</p>
            <h1 id="care-title">
              {copy.heroFirst}
              <br />
              <em>{copy.heroSecond}</em>
            </h1>
            <p>
              {copy.heroTextFirst}
              <br />
              {copy.heroTextSecond}
            </p>
            <a href="#estimate" className="primary-button">
              {copy.buildClean} <ArrowRight size={18} aria-hidden="true" />
            </a>
            <div className="care-perks">
              {copy.perks.map((perk) => (
                <span key={perk}>
                  <Check size={16} aria-hidden="true" />
                  {perk}
                </span>
              ))}
            </div>
          </div>
          <div className="care-photo">
            <Image
              src="/residential-cleaning-hero.png"
              alt={copy.photoAlt}
              width={1536}
              height={1024}
              fetchPriority="high"
              unoptimized
            />
            <div className="care-photo-note">
              <Leaf size={22} aria-hidden="true" />
              <span>
                {copy.photoFirst}
                <br />
                <strong>{copy.photoSecond}</strong>
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
              <p className="eyebrow">{copy.servicesEyebrow}</p>
              <h2 className="section-heading" id="services-title">
                {copy.servicesFirst}
                <br />
                {copy.servicesSecond}
              </h2>
            </div>
            <p>{copy.servicesIntro}</p>
          </div>
          <div className="care-room-grid">
            {copy.rooms.map((room) => (
              <article className="care-room" key={room.number}>
                <span className="care-room-number">
                  {room.number} / {copy.details}
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
            <p className="eyebrow">{copy.estimateEyebrow}</p>
            <h2 className="section-heading" id="estimate-title">
              {copy.estimateFirst}
              <br />
              <em>{copy.estimateSecond}</em>
            </h2>
            <p>{copy.estimateIntro}</p>
            <ol className="care-steps">
              {copy.steps.map(([title, detail], index) => (
                <li key={index}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="care-demo-note">{copy.demoNote}</p>
          </div>
          <div className="estimate-card">
            <div className="care-card-heading">
              <span className="eyebrow">{copy.cardEyebrow}</span>
              <Sun size={22} aria-hidden="true" />
            </div>
            <h3>{copy.buildClean}</h3>
            <div className="form-two">
              <Choice
                id="beds"
                label={copy.bedrooms}
                language={language}
                value={beds}
                onChange={setBeds}
                options={[1, 2, 3, 4, 5].map((n) => ({
                  value: String(n),
                  label: careRoomCount(n, 'beds', language),
                }))}
              />
              <Choice
                id="baths"
                label={copy.bathrooms}
                language={language}
                value={baths}
                onChange={setBaths}
                options={[1, 2, 3, 4].map((n) => ({
                  value: String(n),
                  label: careRoomCount(n, 'baths', language),
                }))}
              />
            </div>
            <span className="field-label" id="rhythm-label">
              {copy.howOften}
            </span>
            <RadioGroup
              className="care-rhythms"
              aria-labelledby="rhythm-label"
              value={frequency}
              onValueChange={(value) => setFrequency(String(value))}
            >
              {copy.rhythms.map((option) => (
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
                    {formatMoney(
                      cleanEstimate(
                        Number(beds),
                        Number(baths),
                        option.value,
                        deep,
                      ).total,
                    )}
                    <small>{copy.visit}</small>
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
                aria-label={copy.addDeep}
              />
              <span>
                <strong>
                  {copy.extraAttention}{' '}
                  <Sparkles size={16} aria-hidden="true" />
                </strong>
                <small>{copy.deepDetail}</small>
                <small>{copy.deepPrice}</small>
              </span>
            </label>
            <dl className="care-price-lines">
              <div>
                <dt>{copy.standard}</dt>
                <dd>{formatMoney(price.standard)}</dd>
              </div>
              {deep && (
                <div>
                  <dt>{copy.deeper}</dt>
                  <dd>{formatMoney(price.extra)}</dd>
                </div>
              )}
              {price.discount > 0 && (
                <div className="care-saving">
                  <dt>
                    {copy.regularSaving} ({price.discountPercent}
                    {language === 'fr' ? ' %' : '%'})
                  </dt>
                  <dd>−{formatMoney(price.discount)}</dd>
                </div>
              )}
            </dl>
            <div className="estimate-total">
              <span>
                {copy.sampleEstimate}
                <small>
                  {rhythm.short} · {copy.usdVisit}
                </small>
              </span>
              <strong>{formatMoney(price.total)}</strong>
            </div>
            <output className="sr-only" aria-live="polite" aria-atomic="true">
              {rhythm.short}. {careRoomCount(Number(beds), 'beds', language)},{' '}
              {careRoomCount(Number(baths), 'baths', language)}.{' '}
              {deep ? copy.withDeep + ' ' : ''}
              {formatMoney(price.total)} USD {copy.perVisit}
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
                {copy.preview} <ArrowRight size={18} aria-hidden="true" />
              </DialogTrigger>
              <DialogContent
                className="care-preview"
                finalFocus={previewButton}
                lang={language}
                closeLabel={copy.close}
              >
                <div className="care-preview-mark">
                  <Leaf size={24} aria-hidden="true" />
                  <span>{copy.previewMark}</span>
                </div>
                <DialogTitle className="care-preview-title">
                  {copy.previewFirst}
                  <br />
                  <em>{copy.previewSecond}</em>
                </DialogTitle>
                <DialogDescription className="care-preview-description">
                  {copy.previewDescription}
                </DialogDescription>
                <div className="care-preview-facts">
                  <span>
                    <BedDouble size={19} aria-hidden="true" />
                    {careRoomCount(Number(beds), 'beds', language)}
                  </span>
                  <span>
                    <Bath size={19} aria-hidden="true" />
                    {careRoomCount(Number(baths), 'baths', language)}
                  </span>
                  <span>
                    <CalendarDays size={19} aria-hidden="true" />
                    {rhythm.short}
                  </span>
                </div>
                <div className="care-preview-includes">
                  <strong>{copy.includes}</strong>
                  <ul>
                    {copy.includedTasks.map((task) => (
                      <li key={task}>
                        <Check size={16} aria-hidden="true" />
                        {task}
                      </li>
                    ))}
                    {deep && (
                      <li>
                        <Sparkles size={16} aria-hidden="true" />
                        {copy.includedDeep}
                      </li>
                    )}
                  </ul>
                </div>
                <dl className="care-price-lines">
                  <div>
                    <dt>{copy.standard}</dt>
                    <dd>{formatMoney(price.standard)}</dd>
                  </div>
                  {deep && (
                    <div>
                      <dt>{copy.deeper}</dt>
                      <dd>{formatMoney(price.extra)}</dd>
                    </div>
                  )}
                  {price.discount > 0 && (
                    <div className="care-saving">
                      <dt>
                        {copy.recurringSaving} ({price.discountPercent}
                        {language === 'fr' ? ' %' : '%'})
                      </dt>
                      <dd>−{formatMoney(price.discount)}</dd>
                    </div>
                  )}
                </dl>
                <div className="care-preview-total">
                  <span>
                    {copy.sampleTotal}
                    <small>{copy.usdVisit}</small>
                  </span>
                  <strong>{formatMoney(price.total)}</strong>
                </div>
                <Button
                  className="primary-button full-button"
                  onClick={() => setPreviewOpen(false)}
                >
                  {copy.back} <ArrowRight size={18} aria-hidden="true" />
                </Button>
                <p className="care-preview-note">{copy.previewNote}</p>
              </DialogContent>
            </Dialog>
            <p className="care-card-note">{copy.cardNote}</p>
          </div>
        </section>

        <section
          id="questions"
          className="care-faq"
          aria-labelledby="questions-title"
        >
          <div>
            <p className="eyebrow">{copy.faqEyebrow}</p>
            <h2 className="section-heading" id="questions-title">
              {copy.faqTitle}
            </h2>
            <p className="care-faq-intro">{copy.faqIntro}</p>
          </div>
          <Accordion>
            {copy.questions.map(([id, question, answer]) => (
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
        <span>{copy.credit}</span>
        <a href="https://www.upwork.com/freelancers/~01fb4a3dd2fdc715be">
          {copy.contact}
        </a>
      </footer>
    </div>
  );
}
