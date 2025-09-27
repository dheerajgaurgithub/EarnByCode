import React, { useEffect, useState } from 'react';
import { Clock, Tag, User } from 'lucide-react';

const Blog = () => {
  // Default fallback data (used if blog.json is unavailable)
  const fallbackPosts = [
    {
      id: 1,
      title: 'How to Earn on AlgoBucks: A Complete Guide',
      excerpt: 'AlgoBucks is for coders. Learn how to earn through coding contests, problem bounties, streak rewards, and redeeming CodeCoins.',
      author: 'Jane Smith',
      date: 'September 5, 2025',
      readTime: '6 min read',
      category: 'Earning',
      image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
      featured: true
    },
    {
      id: 2,
      title: 'Top 5 Strategies for Competitive Coding',
      excerpt: 'Discover the most effective strategies to improve your competitive coding skills and win more contests.',
      author: 'John Doe',
      date: 'September 3, 2025',
      readTime: '7 min read',
      category: 'Tips',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 3,
      title: 'From Practice to Payouts: Turning ACs into Rewards',
      excerpt: 'Maximize your accepted submissions: complete daily problems, maintain streaks, and convert your activity into tangible rewards.',
      author: 'Alex Johnson',
      date: 'September 1, 2025',
      readTime: '7 min read',
      category: 'Rewards',
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 4,
      title: 'Contest Playbook: Strategies to Win and Earn More',
      excerpt: 'Practical tips for reading problems fast, avoiding WA/TLE, and climbing the leaderboard to unlock higher earnings.',
      author: 'Sarah Chen',
      date: 'August 28, 2025',
      readTime: '10 min read',
      category: 'Contests',
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 5,
      title: 'Payments & KYC: How Payouts Work on AlgoBucks',
      excerpt: 'Understand KYC, bank/UPI setup with OTP verification, and payout timelines so your earnings reach you safely.',
      author: 'Michael Brown',
      date: 'August 25, 2025',
      readTime: '5 min read',
      category: 'Payouts',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 6,
      title: 'Craft a Standout Profile: Showcase Skills and Earn',
      excerpt: 'Use submissions, badges, and social links to build a coder profile that attracts opportunities and boosts rewards.',
      author: 'Emma Wilson',
      date: 'August 20, 2025',
      readTime: '8 min read',
      category: 'Profile',
      image: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=1200&auto=format&fit=crop'
    }
  ];

  const [posts, setPosts] = useState(fallbackPosts);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // Try API first (proxied + cached), then fall back to static JSON
        const apiRes = await fetch('/api/blog?limit=100', { cache: 'no-store' });
        let data;
        if (apiRes.ok) {
          data = await apiRes.json();
        } else {
          const res = await fetch('/blog.json', { cache: 'no-store' });
          if (!res.ok) throw new Error('Failed to fetch blog.json');
          data = await res.json();
        }
        if (alive && Array.isArray(data) && data.length) setPosts(data);
      } catch (e) {
        // keep fallback on any error
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-sky-50 dark:bg-gradient-to-br dark:from-black dark:to-gray-950 text-gray-800 dark:text-green-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <header className="text-center mb-12 lg:mb-16">
          <img src="/logo.png" alt="EarnByCode Logo" className="inline-block mb-4 w-16 h-16 lg:w-24 lg:h-24 object-contain" />
          <h1 className="text-3xl lg:text-5xl font-extrabold bg-gradient-to-r from-sky-600 to-sky-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent mb-4">
            EarnByCode Blog
          </h1>
          <p className="text-base lg:text-lg text-gray-600 dark:text-green-300 max-w-3xl mx-auto leading-relaxed px-4">
            Discover the latest insights, tutorials, and expert tips to maximize your EarnByCode experience
          </p>
        </header>
  
        {/* Blog Posts Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group bg-white dark:bg-gray-900 rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-sky-100 dark:border-green-800/30 hover:border-sky-300 dark:hover:border-green-600/50 transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Image Container */}
                <div className="relative h-48 lg:h-56 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
  
                {/* Content */}
                <div className="p-5 lg:p-6">
                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="inline-flex items-center bg-sky-50 dark:bg-green-900/30 text-sky-700 dark:text-green-300 px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium border border-sky-200 dark:border-green-700">
                      <User className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
                      {post.author}
                    </span>
                    <span className="inline-flex items-center bg-sky-50 dark:bg-green-900/30 text-sky-700 dark:text-green-300 px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium border border-sky-200 dark:border-green-700">
                      <Clock className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
                      {post.date}
                    </span>
                  </div>
  
                  {/* Title */}
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-green-100 mb-3 line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-green-400 transition-colors duration-300">
                    {post.title}
                  </h3>
  
                  {/* Excerpt */}
                  <p className="text-sm lg:text-base text-gray-600 dark:text-green-300 mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
  
                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-sky-100 dark:border-green-800/30">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs lg:text-sm font-semibold bg-gradient-to-r from-sky-100 to-sky-200 dark:from-green-800/50 dark:to-green-700/50 text-sky-800 dark:text-green-300 border border-sky-200 dark:border-green-600/30">
                      <Tag className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
                      {post.category}
                    </span>
                    <span className="text-xs lg:text-sm text-gray-500 dark:text-green-400 font-medium bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
  
        {/* Optional: Load More Button */}
        <div className="text-center mt-12 lg:mt-16">
          <button className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-500 dark:to-green-600 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-600 dark:hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
            Load More Articles
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Blog;