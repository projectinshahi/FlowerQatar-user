'use client';

import React, { useState, useEffect } from 'react';
import Image from '../../components/LuxuryImage';
import Link from 'next/link';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import Breadcrumbs from '../../components/Breadcrumbs';
import { BlogPost } from '../../types';
import { BLOG_POSTS } from '../../data/blog-posts';

export default function JournalPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(BLOG_POSTS);

  // Apply category filtering
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredPosts(BLOG_POSTS);
    } else {
      setFilteredPosts(BLOG_POSTS.filter((p) => p.category === selectedCategory));
    }
  }, [selectedCategory]);

  const featuredPost = BLOG_POSTS[0]; // first post is featured
  const listPosts = filteredPosts.filter((p) => p.slug !== featuredPost.slug || selectedCategory !== 'All');

  const CATEGORIES = ['All', 'Gifting', 'Weddings', 'Decor', 'Care'];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 font-sans text-primary">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'The Journal', href: '/journal' }]} />

      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-16 mt-4">
        <span className="text-xs uppercase tracking-[0.25em] text-secondary font-light block mb-2">
          Atelier Lifestyle
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-wide">
          The Journal
        </h1>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Read essays on floral preservation botany, wedding floral planning, luxury gift etiquette, and interior styling guides.
        </p>
      </div>

      {/* 1. CATEGORY TABS */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-divider pb-6 mb-12">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 text-xs tracking-wider uppercase border rounded-none transition-all duration-300 ${
              selectedCategory === cat
                ? 'bg-primary text-white border-primary font-medium shadow-sm'
                : 'border-divider hover:border-primary text-muted bg-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2. FEATURED POST (Shown only when 'All' is selected) */}
      {selectedCategory === 'All' && featuredPost && (
        <section className="mb-16">
          <span className="text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold mb-4 block">
            Latest Feature
          </span>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-cream border border-divider/60 p-6 md:p-8">
            <Link
              href={`/journal/${featuredPost.slug}`}
              className="lg:col-span-7 relative aspect-[16/10] bg-white overflow-hidden border border-divider/40"
            >
              <Image
                src={featuredPost.image}
                alt={featuredPost.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </Link>

            <div className="lg:col-span-5 space-y-4 lg:pl-4">
              <span className="bg-secondary/15 text-secondary border border-secondary/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-medium inline-block">
                {featuredPost.category}
              </span>
              
              <h2 className="font-serif text-2xl md:text-3.5xl text-primary leading-tight hover:text-secondary transition-colors font-medium">
                <Link href={`/journal/${featuredPost.slug}`}>
                  {featuredPost.title}
                </Link>
              </h2>
              
              <p className="text-xs text-muted/80 leading-relaxed">
                {featuredPost.excerpt}
              </p>

              <div className="flex items-center space-x-4 text-[10px] text-muted uppercase tracking-widest pt-2">
                <span className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{featuredPost.date}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{featuredPost.readTime}</span>
                </span>
              </div>

              <div className="pt-4">
                <Link
                  href={`/journal/${featuredPost.slug}`}
                  className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] font-bold text-secondary hover:text-primary transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. POST GRID */}
      {listPosts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-divider bg-cream">
          <p className="text-xs text-muted italic">No blog posts found under this category.</p>
        </div>
      ) : (
        <section>
          <div className="flex flex-col mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold mb-2">
              Atelier Anthology
            </span>
            <h2 className="font-serif text-xl md:text-2xl text-primary">
              {selectedCategory === 'All' ? 'More Articles' : `${selectedCategory} Articles`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listPosts.map((post) => (
              <div key={post.slug} className="group flex flex-col bg-white border border-divider/60">
                <Link
                  href={`/journal/${post.slug}`}
                  className="relative aspect-[3/2] bg-cream overflow-hidden border-b border-divider/40"
                >
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </Link>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-secondary block">
                      {post.category}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-primary leading-snug hover:text-secondary transition-colors">
                      <Link href={`/journal/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs text-muted/80 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-divider/50 text-[10px] text-muted uppercase tracking-widest">
                    <span>{post.date}</span>
                    <span className="flex items-center space-x-1 font-semibold text-secondary">
                      <span>{post.readTime}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
