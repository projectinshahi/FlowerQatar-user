'use client';

import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ROSE_COLORS, BOX_COLORS } from '../../../data/products';
import { ChevronRight, ChevronLeft, ShoppingBag, Gift, Sparkles, Check, ShieldCheck } from 'lucide-react';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { qar } from '../../../lib/utils';

export default function CustomArrangementPage() {
  const { addToCart } = useApp();

  // Customizer Builder States
  const [step, setStep] = useState(1);
  const [boxShape, setBoxShape] = useState<'Round' | 'Square' | 'Heart'>('Round');
  const [selectedBoxColor, setSelectedBoxColor] = useState(BOX_COLORS[0]);
  const [selectedRoseColor, setSelectedRoseColor] = useState(ROSE_COLORS[0]);
  const [roseCount, setRoseCount] = useState<4 | 9 | 16 | 25 | 36 | 49>(16);
  const [selectedLid, setSelectedLid] = useState<'Branded Lid' | 'Clear Acrylic' | 'Custom Message'>('Branded Lid');
  const [customLidText, setCustomLidText] = useState('');
  const [cardMessage, setCardMessage] = useState('');

  // Stepper steps definition
  const STEPS = [
    { num: 1, label: 'Box Shape & Color' },
    { num: 2, label: 'Rose Color' },
    { num: 3, label: 'Arrangement Density' },
    { num: 4, label: 'Lid Finishing' },
    { num: 5, label: 'Gift Card' },
  ];

  // Price follows the selection: base price by quantity, plus the lid premium.
  const basePrices = {
    4: 79,
    9: 149,
    16: 249,
    25: 349,
    36: 449,
    49: 549,
  };
  const calculatedPrice =
    basePrices[roseCount] + (selectedLid === 'Clear Acrylic' ? 25 : selectedLid === 'Custom Message' ? 50 : 0);

  const handleNext = () => {
    if (step < 5) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleAddToCart = () => {
    let compositeLid = selectedLid as string;
    if (selectedLid === 'Custom Message' && customLidText.trim()) {
      compositeLid = `Custom Lid: "${customLidText.trim()}"`;
    }

    addToCart({
      product: {
        slug: `custom-${boxShape.toLowerCase()}-${roseCount}`,
        name: `Custom Preserved ${boxShape} Arrangement (${roseCount} Roses)`,
        price: calculatedPrice,
      },
      quantity: 1,
      roseColor: selectedRoseColor.name,
      boxColor: selectedBoxColor.name,
      boxShape: boxShape,
      size: `${roseCount} Roses`,
      lid: compositeLid,
      card: cardMessage.trim() || undefined,
      price: calculatedPrice,
    });
  };

  // Helper to render the circular arrangements in preview
  const renderRosePreviewGrid = () => {
    const totalRoses = roseCount;
    const color = selectedRoseColor.hex;

    if (boxShape === 'Square') {
      // Symmetrical Grid layouts
      const gridCols = Math.sqrt(totalRoses);
      const roses = Array.from({ length: totalRoses });
      return (
        <div
          className="grid gap-1.5 p-6 rounded-none bg-transparent w-full max-w-[240px] aspect-square items-center justify-center border border-divider/40 bg-white"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {roses.map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full shadow-inner border border-black/10 transform hover:scale-105 duration-350"
              style={{
                backgroundColor: color,
                boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
              }}
            />
          ))}
        </div>
      );
    }

    if (boxShape === 'Round') {
      // Circular spiral placement mockup
      const roses = Array.from({ length: totalRoses });
      return (
        <div className="relative w-full max-w-[240px] aspect-square rounded-full border border-divider/40 bg-white p-4 shadow-md flex items-center justify-center">
          {roses.map((_, i) => {
            let angle = 0;
            let radius = 0;

            if (totalRoses === 4) {
              angle = (i * 90) + 45;
              radius = 28;
            } else if (totalRoses === 9) {
              if (i === 0) { radius = 0; }
              else {
                angle = (i - 1) * 45;
                radius = 32;
              }
            } else {
              // General distribution algorithm
              const phi = i * 137.5; // Golden angle
              radius = Math.sqrt(i) * (70 / Math.sqrt(totalRoses));
              angle = phi;
            }

            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div
                key={i}
                className="w-5.5 h-5.5 rounded-full absolute border border-black/10 transition-all duration-300"
                style={{
                  backgroundColor: color,
                  transform: `translate(${x}px, ${y}px)`,
                  boxShadow: 'inset -2px -2px 5px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
            );
          })}
        </div>
      );
    }

    if (boxShape === 'Heart') {
      // Render heart contour placement mockup
      const roses = Array.from({ length: totalRoses });
      return (
        <div className="relative w-full max-w-[240px] aspect-square border border-divider/40 bg-white rounded-2xl flex items-center justify-center p-6 shadow-md">
          {/* heart SVG outline behind */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <svg viewBox="0 0 24 24" className="w-48 h-48 fill-dark">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="relative w-full h-full flex flex-wrap gap-1.5 items-center justify-center">
            {roses.map((_, i) => (
              <div
                key={i}
                className="w-5.5 h-5.5 rounded-full border border-black/10 hover:scale-110 duration-200"
                style={{
                  backgroundColor: color,
                  boxShadow: 'inset -2px -2px 5px rgba(0,0,0,0.2), 0 1.5px 3.5px rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Custom arrangement', href: '/custom' }]} />

      {/* Stepper Status HUD */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-divider z-0 transform -translate-y-1/2" />
          {STEPS.map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <button
                onClick={() => setStep(s.num)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold tracking-wide transition-all ${
                  step === s.num
                    ? 'bg-secondary border-secondary text-white shadow-md scale-110'
                    : step > s.num
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-divider text-muted hover:border-primary'
                }`}
              >
                {step > s.num ? <Check size={12} /> : s.num}
              </button>
              <span className="text-[9px] uppercase tracking-wider text-muted mt-2 font-medium bg-white px-1 hidden md:block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
        
        {/* Left Sticky Preview Column (Col: 6) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-8 bg-cream border border-divider/60 relative md:min-h-[500px]">
          
          <div className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">
            Live Preview Mockup
          </div>

          {/* Interactive Composite rendering */}
          <div
            className="w-full flex items-center justify-center flex-col transition-all duration-500 scale-100"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.08))' }}
          >
            {/* Box shape boundary mockup */}
            <div
              className={`p-6 border-4 flex items-center justify-center transition-all duration-500 bg-white ${
                boxShape === 'Round'
                  ? 'rounded-full border-primary/95'
                  : boxShape === 'Heart'
                  ? 'rounded-[2rem] border-primary/95'
                  : 'rounded-none border-primary/95'
              }`}
              style={{
                borderColor: selectedBoxColor.hex,
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                minWidth: '260px',
                minHeight: '260px',
              }}
            >
              {renderRosePreviewGrid()}
            </div>

            {/* Lid preview text overlay */}
            <div className="mt-8 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted font-semibold block">
                Atelier Preserved Box Spec
              </span>
              <p className="text-sm font-serif font-bold text-primary">
                {selectedBoxColor.name} {boxShape} Box
              </p>
              <p className="text-xs text-secondary">
                {roseCount} Preserved {selectedRoseColor.name} Roses
              </p>
              {selectedLid !== 'Branded Lid' && (
                <p className="text-[10px] text-muted italic">
                  Finishing: {selectedLid} {customLidText ? `("${customLidText}")` : ''}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Right Stepper Config Control Panel (Col: 6) */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-divider/60 p-8 bg-white shadow-xs">
          
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold block">
              Step {step} of 5
            </span>
            
            {/* STEP 1: Shape and Box color */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="font-serif text-2xl text-primary mb-4">Select Container Box Shape</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { shape: 'Round', desc: 'Timeless Parisian classic' },
                      { shape: 'Square', desc: 'Modern geometric elegance' },
                      { shape: 'Heart', desc: 'The ultimate romantic statement' },
                    ] as const).map((item) => (
                      <button
                        key={item.shape}
                        onClick={() => setBoxShape(item.shape)}
                        className={`p-4 border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 rounded-none ${
                          boxShape === item.shape
                            ? 'border-secondary bg-cream text-primary ring-1 ring-secondary shadow-sm'
                            : 'border-divider bg-transparent text-muted hover:border-primary'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider font-semibold">{item.shape}</span>
                        <span className="text-[9px] leading-relaxed text-muted/80 hidden sm:block">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-serif text-xl text-primary mb-4">Select Box Finish Material</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {BOX_COLORS.map((box) => (
                      <button
                        key={box.name}
                        onClick={() => setSelectedBoxColor(box)}
                        className={`px-4 py-2 text-xs tracking-wider uppercase border transition-all duration-300 flex items-center space-x-2 rounded-none ${
                          selectedBoxColor.name === box.name
                            ? 'border-primary bg-primary text-white font-medium'
                            : 'border-divider bg-white text-muted hover:border-primary'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-black/10 inline-block" style={{ backgroundColor: box.hex }} />
                        <span>{box.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Rose Color */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl text-primary">Select Rose Preserved Petal Color</h3>
                <p className="text-xs text-muted/80 leading-relaxed">
                  Choose from our vibrant volcanic-soil preserved Ecuadorian roses.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {ROSE_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedRoseColor(color)}
                      className={`p-3 border text-center flex flex-col items-center space-y-2.5 transition-all duration-300 relative rounded-none ${
                        selectedRoseColor.name === color.name
                          ? 'border-secondary bg-cream text-primary ring-1 ring-secondary shadow-sm'
                          : 'border-divider bg-white text-muted hover:border-primary'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-full border border-black/10 inline-block shadow-inner" style={{ backgroundColor: color.hex }} />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-center leading-tight">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Density Quantity */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl text-primary">Choose Floral Density & Count</h3>
                <p className="text-xs text-muted/80 leading-relaxed">
                  The density determines the volume of eternity Ecuadorian roses packed into your custom arrangement.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {([
                    { count: 4, label: 'Le Quartet', price: 'QAR 79' },
                    { count: 9, label: 'Atelier Nine', price: 'QAR 149' },
                    { count: 16, label: 'Classic Sweet', price: 'QAR 249' },
                    { count: 25, label: 'Grande Premium', price: 'QAR 349' },
                    { count: 36, label: 'Majestic Luxe', price: 'QAR 449' },
                    { count: 49, label: 'Royal Emperor', price: 'QAR 549' },
                  ] as const).map((item) => (
                    <button
                      key={item.count}
                      onClick={() => setRoseCount(item.count)}
                      className={`p-4 border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 rounded-none ${
                        roseCount === item.count
                          ? 'border-secondary bg-cream text-primary ring-1 ring-secondary shadow-sm'
                          : 'border-divider bg-transparent text-muted hover:border-primary'
                      }`}
                    >
                      <span className="text-lg font-bold text-primary">{item.count}</span>
                      <span className="text-[9px] uppercase tracking-widest text-muted font-semibold block">{item.label}</span>
                      <span className="text-xs font-semibold text-secondary">{item.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Lid finishing */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl text-primary">Select Lid Packaging</h3>
                <p className="text-xs text-muted/80 leading-relaxed">
                  Finish your arrangement with standard branded rigid covers or clear showcase acrylic.
                </p>
                <div className="space-y-2.5 pt-2">
                  {([
                    { title: 'Signature Branded Cardboard Lid', desc: 'Standard presentation cover, embossed in gold.', value: 'Branded Lid', extra: '+QAR 0' },
                    { title: 'Clear Acrylic Showcase Lid', desc: 'Keep your roses completely visible while protecting dust.', value: 'Clear Acrylic', extra: '+QAR 25' },
                    { title: 'Embossed Gold Foil Custom Message', desc: 'Emboss a name or anniversary message onto the lid.', value: 'Custom Message', extra: '+QAR 50' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedLid(opt.value)}
                      className={`w-full p-4 border text-left flex justify-between items-center transition-all duration-300 rounded-none ${
                        selectedLid === opt.value
                          ? 'border-secondary bg-cream text-primary ring-1 ring-secondary shadow-sm'
                          : 'border-divider bg-white text-muted hover:border-primary'
                      }`}
                    >
                      <div>
                        <span className="text-xs uppercase tracking-wider font-semibold block mb-0.5">{opt.title}</span>
                        <span className="text-[10px] text-muted/80 block leading-relaxed">{opt.desc}</span>
                      </div>
                      <span className="text-xs font-semibold text-secondary ml-4 whitespace-nowrap">{opt.extra}</span>
                    </button>
                  ))}
                </div>

                {selectedLid === 'Custom Message' && (
                  <div className="pt-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary block mb-2">
                      Custom Lid Text (max 30 letters)
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={customLidText}
                      onChange={(e) => setCustomLidText(e.target.value)}
                      placeholder="e.g. HAPPY ANNIVERSARY SAVANNAH"
                      className="w-full px-3 py-2 text-xs border border-divider focus:border-secondary outline-none bg-white placeholder-gray text-primary rounded-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Greeting card */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl text-primary">Add Personalized Greeting Card</h3>
                <p className="text-xs text-muted/80 leading-relaxed">
                  Compose a customized message that our calligraphers will print onto thick textured cream cards.
                </p>
                <div className="pt-2">
                  <textarea
                    rows={5}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="Enter card message here... (e.g. Wishing you a year as beautiful as these roses. Happy Birthday!)"
                    className="w-full p-3 text-xs border border-divider focus:border-secondary outline-none bg-white placeholder-gray/60 font-sans text-primary leading-relaxed rounded-none"
                  />
                  <div className="flex items-center space-x-2 mt-3 text-secondary text-[10px] uppercase tracking-widest font-semibold">
                    <Gift size={14} />
                    <span>Includes luxury envelopes & ribbons</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Footer Controls */}
          <div className="mt-12 pt-6 border-t border-divider flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className={`flex items-center space-x-2 text-xs uppercase tracking-widest transition-colors py-2 px-4 border rounded-none ${
                step === 1
                  ? 'text-muted/30 border-divider cursor-not-allowed'
                  : 'text-primary border-divider hover:border-primary'
              }`}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-muted block">Subtotal</span>
              <span className="text-lg font-bold text-secondary">{qar(calculatedPrice)}</span>
            </div>

            {/* Next or Add to Cart Button */}
            {step < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 text-xs uppercase tracking-widest bg-primary hover:bg-secondary text-white hover:text-white transition-colors duration-500 py-2.5 px-5 rounded-none"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex items-center space-x-2 text-xs uppercase tracking-widest bg-primary hover:bg-secondary text-white transition-colors duration-500 py-2.5 px-5 shadow-md font-semibold rounded-none"
              >
                <ShoppingBag size={14} />
                <span>Add Arrangement</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Trust factors */}
      <section className="mt-20 border-t border-divider/60 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto font-sans text-primary">
        <div className="space-y-2">
          <Sparkles className="text-secondary mx-auto w-6 h-6 mb-2" />
          <h4 className="text-xs uppercase tracking-wider font-semibold">Proprietary Preservation</h4>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            Our luxury Ecuadorian blooms sustain cellular structure and scent for over 365 days.
          </p>
        </div>
        <div className="space-y-2">
          <Gift className="text-secondary mx-auto w-6 h-6 mb-2" />
          <h4 className="text-xs uppercase tracking-wider font-semibold">Premium Gift Sets</h4>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            Includes wax-sealed envelopes, thick-cut cardstock, and hot foil branding.
          </p>
        </div>
        <div className="space-y-2">
          <ShieldCheck className="text-secondary mx-auto w-6 h-6 mb-2" />
          <h4 className="text-xs uppercase tracking-wider font-semibold">100% Satisfaction</h4>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            Secure, premium logistics ensuring every single rose lands fully bloomed.
          </p>
        </div>
      </section>

    </div>
  );
}
