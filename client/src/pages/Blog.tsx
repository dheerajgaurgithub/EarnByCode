import React from 'react';
import { Clock, Tag, User } from 'lucide-react';

const Blog = () => {
  // Sample blog posts data with updated 2025 dates
  const blogPosts = [
    {
      id: 1,
      title: 'Getting Started with Algorithmic Trading',
      excerpt: 'Learn the basics of algorithmic trading and how to get started with AlgoBucks platform. A comprehensive guide for beginners.',
      author: 'Jane Smith',
      date: 'September 5, 2025',
      readTime: '5 min read',
      category: 'Tutorial',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
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
      title: 'The Future of Algorithmic Trading',
      excerpt: 'Explore the latest trends and future predictions in the world of algorithmic trading and financial technology.',
      author: 'Alex Johnson',
      date: 'September 1, 2025',
      readTime: '8 min read',
      category: 'Insights',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 4,
      title: 'Machine Learning in Trading: A Deep Dive',
      excerpt: 'Understanding how machine learning algorithms are revolutionizing financial markets and trading strategies.',
      author: 'Sarah Chen',
      date: 'August 28, 2025',
      readTime: '12 min read',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 5,
      title: 'Risk Management Strategies for Algo Traders',
      excerpt: 'Essential risk management techniques every algorithmic trader should know to protect their investments.',
      author: 'Michael Brown',
      date: 'August 25, 2025',
      readTime: '9 min read',
      category: 'Strategy',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 6,
      title: 'Building Your First Trading Bot',
      excerpt: 'Step-by-step guide to creating your first automated trading system from scratch using Python.',
      author: 'Emma Wilson',
      date: 'August 20, 2025',
      readTime: '15 min read',
      category: 'Tutorial',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
  ];

  const posts = blogPosts;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-green-200 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold">AlgoBucks Blog</h1>
          <p className="text-sm text-slate-600 dark:text-green-300 mt-2 max-w-2xl mx-auto">News, tutorials, and tips to get more out of AlgoBucks.</p>
        </header>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/20 transition"
              >
                <div className="h-32 sm:h-40 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-slate-600 dark:text-green-300 mb-2 gap-2">
                    <span className="flex items-center bg-sky-50 dark:bg-green-900/30 px-2 py-1 rounded">
                      <User className="w-3 h-3 mr-1" />
                      {post.author}
                    </span>
                    <span className="flex items-center bg-sky-50 dark:bg-green-900/30 px-2 py-1 rounded">
                      <Clock className="w-3 h-3 mr-1" />
                      {post.date}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold mb-2">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-green-300 mb-2 sm:mb-3 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-sky-100 dark:bg-green-800/50 text-sky-800 dark:text-green-300">
                      <Tag className="w-3 h-3 mr-1" />
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-green-300">{post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Blog;