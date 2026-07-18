'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FAQS, FAQ_CATEGORIES, FAQ_CATEGORY_META } from '@/data/faq';
import type { FAQCategory } from '@/types/faq';
import ScrollProgress from '@/components/faq/ScrollProgress';
import ScrollTopButton from '@/components/faq/ScrollTopButton';
import FAQHero from '@/components/faq/FAQHero';
import FAQSearch from '@/components/faq/FAQSearch';
import FAQCategoryTabs from '@/components/faq/FAQCategoryTabs';
import FAQSection from '@/components/faq/FAQSection';
import MembershipPlans from '@/components/faq/MembershipPlans';
import FAQEmptyState from '@/components/faq/FAQEmptyState';
import FAQBottomCTA from '@/components/faq/FAQBottomCTA';

const DESC_BY_CATEGORY = Object.fromEntries(FAQ_CATEGORY_META.map((m) => [m.category, m.description])) as Record<
  FAQCategory,
  string
>;

/** Faint floral watermark (decorative, extremely low opacity). */
function FloralWatermark() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full text-primary" fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden="true">
      <circle cx="100" cy="100" r="10" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x = 100 + Math.cos(a) * 34;
        const y = 100 + Math.sin(a) * 34;
        return <ellipse key={i} cx={x} cy={y} rx="20" ry="9" transform={`rotate(${(i * 45)} ${x} ${y})`} />;
      })}
    </svg>
  );
}

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [active, setActive] = useState<FAQCategory | null>(FAQ_CATEGORIES[0]);
  const [offsets, setOffsets] = useState({ nav: 0, sticky: 0 });

  const stickyRef = useRef<HTMLDivElement>(null);
  const sectionEls = useRef<Map<FAQCategory, HTMLElement>>(new Map());

  // Filter across question + answer (live, instant).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [query]);

  // Group into visible sections (category order), dropping empty categories.
  const sections = useMemo(
    () =>
      FAQ_CATEGORIES.map((category) => ({
        category,
        description: DESC_BY_CATEGORY[category],
        items: filtered.filter((f) => f.category === category),
      })).filter((s) => s.items.length > 0),
    [filtered]
  );
  const visibleCategories = useMemo(() => sections.map((s) => s.category), [sections]);

  // Measure the fixed navbar + sticky bar so anchors land below them.
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      const sticky = stickyRef.current?.getBoundingClientRect().height ?? 0;
      setOffsets({ nav, sticky });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const scrollMt = offsets.nav + offsets.sticky + 24;

  // Scroll-spy: highlight the category whose section sits just below the sticky bar.
  useEffect(() => {
    const els = visibleCategories
      .map((c) => sectionEls.current.get(c))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const cat = top?.target.getAttribute('data-category') as FAQCategory | null;
        if (cat) setActive(cat);
      },
      { rootMargin: `-${Math.round(offsets.nav + offsets.sticky + 8)}px 0px -55% 0px`, threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleCategories, offsets]);

  const registerRef = useCallback((category: FAQCategory) => (el: HTMLElement | null) => {
    if (el) {
      el.setAttribute('data-category', category);
      sectionEls.current.set(category, el);
    } else {
      sectionEls.current.delete(category);
    }
  }, []);

  const scrollToCategory = useCallback((category: FAQCategory) => {
    setActive(category);
    sectionEls.current.get(category)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const toggle = useCallback((id: number) => setOpenId((prev) => (prev === id ? null : id)), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-cream via-[#FBF6EF] to-cream">
      <ScrollProgress />

      {/* Faint floral watermarks */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-24 h-[420px] w-[420px] opacity-[0.035]"><FloralWatermark /></div>
        <div className="absolute -left-32 top-[60%] h-[360px] w-[360px] opacity-[0.03]"><FloralWatermark /></div>
      </div>

      <div className="relative mx-auto max-w-[1100px] px-6 pb-24 pt-[116px] sm:px-8 sm:pt-[140px] md:px-10 md:pt-[168px]">
        <FAQHero />

        {/* Sticky search + category nav */}
        <div ref={stickyRef} style={{ top: offsets.nav }} className="sticky z-40 -mx-6 mt-12 bg-cream/85 px-6 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 md:-mx-10 md:px-10">
          <FAQSearch value={query} onChange={setQuery} />
          {visibleCategories.length > 0 && (
            <div className="mt-4">
              <FAQCategoryTabs categories={visibleCategories} active={active} onSelect={scrollToCategory} />
            </div>
          )}
        </div>

        {/* Sections */}
        {sections.length === 0 ? (
          <FAQEmptyState query={query} />
        ) : (
          <div className="mt-14 space-y-20 md:mt-16 md:space-y-24">
            {sections.map((section) => (
              <FAQSection
                key={section.category}
                category={section.category}
                description={section.description}
                items={section.items}
                openId={openId}
                onToggle={toggle}
                registerRef={registerRef(section.category)}
                scrollMt={scrollMt}
                intro={
                  section.category === 'Subscription Membership' ? (
                    <MembershipPlans onLearnMore={() => scrollToCategory('Subscription Membership')} />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Help CTA */}
        <div className="mt-24">
          <FAQBottomCTA />
        </div>
      </div>

      <ScrollTopButton />
    </div>
  );
}
