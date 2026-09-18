'use client';

import React, { use, useState, useEffect } from 'react';
import Image from '../../../../components/LuxuryImage';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, User, ArrowLeft, Link as LinkIcon, Heart } from 'lucide-react';
import { BlogPost } from '../../../../types';
import { BLOG_POSTS } from '../../../../data/blog-posts';
import Breadcrumbs from '../../../../components/Breadcrumbs';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const [copied, setCopied] = useState(false);

  // A real 404: the old "Article Not Found" block was served with status 200 (a soft 404).
  if (!post) notFound();

  // Resolve 3 related articles (exclude current)
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Journal', href: '/journal' },
          { label: post.title },
        ]}
      />

      {/* Back button */}
      <Link
        href="/journal"
        className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest text-muted hover:text-secondary transition-colors mb-8"
      >
        <ArrowLeft size={12} />
        <span>Back to Journal</span>
      </Link>

      {/* Article Main */}
      <article className="max-w-4xl mx-auto">
        {/* Title Block */}
        <div className="text-center space-y-4 mb-10">
          <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-semibold inline-block">
            {post.category}
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-wide leading-tight max-w-3xl mx-auto">
            {post.title}
          </h1>

          <div className="flex items-center justify-center space-x-6 text-[10px] text-muted uppercase tracking-widest pt-2">
            <span className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{post.date}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{post.readTime}</span>
            </span>
            <span className="flex items-center space-x-1">
              <User size={12} />
              <span>By {post.author}</span>
            </span>
          </div>
        </div>

        {/* Full-width Hero Image */}
        <div className="relative aspect-[16/9] w-full bg-cream border border-divider/40 mb-12 shadow-sm">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>

        {/* Content Container (Narrow width for premium readability) */}
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Paragraphs */}
          <div className="font-serif text-base md:text-lg leading-relaxed text-primary space-y-6">
            <p>{post.content}</p>
            <p>
              Preserved botanical methods have evolved rapidly in recent years. By swapping local farm-level processes with advanced European organic glycerin systems, eternity arrangements now retain their exact fresh cell structures and fragrance profiles for over 365 days. 
            </p>
          </div>

          {/* Elegant Pull Quote */}
          <div className="border-l-2 border-secondary pl-6 py-2 my-8">
            <p className="font-serif text-lg md:text-xl italic text-secondary leading-relaxed">
              &quot;We wanted to design an arrangement that captures a core botanical memory. An Eternity rose isn&apos;t just decoration—it is a continuous reminder of affection.&quot;
            </p>
            <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mt-2 block">
              — {post.author}, Lead Atelier Stylist
            </span>
          </div>

          <div className="font-serif text-base md:text-lg leading-relaxed text-primary space-y-6">
            <p>
              In interior styling, eternity boxes act as structural anchor points. Whether placed in a master suite, console entryway, or a dining room center, their symmetrical layouts bring a refined weight. We recommend opting for color swatches that blend with your room accents—such as Sleek Black boxes with Blush Pink petals, or Textured Cream boxes with Champagne Gold petals.
            </p>
          </div>

          {/* Social Share bar */}
          <div className="border-y border-divider py-4 flex items-center justify-between mt-12 text-xs text-muted">
            <span className="uppercase tracking-widest font-semibold text-[10px] text-primary">Share Article</span>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-secondary transition-colors" aria-label="Facebook">
                <svg className="w-[16px] h-[16px] fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-secondary transition-colors" aria-label="Twitter">
                <svg className="w-[16px] h-[16px] fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <button onClick={handleCopyLink} className="hover:text-secondary transition-colors flex items-center space-x-1">
                <LinkIcon size={16} />
                {copied && <span className="text-[9px] text-secondary uppercase tracking-wider">Copied</span>}
              </button>
            </div>
          </div>

          {/* Author Bio Card */}
          <div className="bg-cream border border-divider p-6 flex items-center space-x-4 mt-8">
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-secondary/20 flex items-center justify-center font-bold text-secondary border border-secondary/10">
              {post.author.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-primary mb-0.5">{post.author}</h4>
              <p className="text-[11px] text-muted uppercase tracking-widest mb-1.5">Atelier Design Columnist</p>
              <p className="text-[11px] text-muted/80 leading-relaxed">
                Elise covers botanical preservation, sustainable luxury development, and design curation for Lebami.
              </p>
            </div>
          </div>

        </div>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="mt-24 border-t border-divider pt-16">
          <h2 className="font-serif text-2xl md:text-3xl text-primary text-center mb-12">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((p) => (
              <div key={p.slug} className="group flex flex-col bg-white border border-divider/60">
                <Link
                  href={`/journal/${p.slug}`}
                  className="relative aspect-[3/2] bg-cream overflow-hidden border-b border-divider/40"
                >
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </Link>
                <div className="p-6">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-secondary block mb-2">
                    {p.category}
                  </span>
                  <h3 className="font-serif text-base font-semibold text-primary leading-snug hover:text-secondary transition-colors">
                    <Link href={`/journal/${p.slug}`}>{p.title}</Link>
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
