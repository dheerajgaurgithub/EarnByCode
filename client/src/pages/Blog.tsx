import React from 'react';
import { ArrowRight, BookOpen, Clock, Tag, User, TrendingUp, BarChart3, Brain, Shield, Bot } from 'lucide-react';

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

  const categories = [
    { name: 'Tutorial', icon: BookOpen, count: 15 },
    { name: 'Tips', icon: TrendingUp, count: 12 },
    { name: 'Insights', icon: BarChart3, count: 8 },
    { name: 'Technology', icon: Brain, count: 10 },
    { name: 'Strategy', icon: Shield, count: 7 }
  ];

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-60 sm:w-80 h-60 sm:h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-60 sm:w-80 h-60 sm:h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 sm:w-60 h-40 sm:h-60 bg-cyan-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 px-2 sm:px-0">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 mb-4 shadow-lg">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 leading-tight">
            AlgoBucks Blog
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest news, tutorials, and insights about algorithmic trading and competitive programming.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-8 sm:mb-10">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-4 sm:mb-5">Featured Article</h2>
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="h-48 sm:h-64 lg:h-full overflow-hidden order-2 lg:order-1">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center order-1 lg:order-2">
                  <div className="flex flex-wrap items-center text-xs text-slate-500 mb-3 gap-2 sm:gap-3">
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1 text-blue-500" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-blue-500" />
                      {featuredPost.date}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Tag className="w-3 h-3 mr-1" />
                      {featuredPost.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 mb-3 hover:text-blue-600 transition-colors cursor-pointer leading-tight">
                    {featuredPost.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 mb-4 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {featuredPost.readTime}
                    </span>
                    <button className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl text-xs sm:text-sm">
                      Read More
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-4 sm:mb-5">Latest Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {regularPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden border border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              >
                <div className="h-32 sm:h-40 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-slate-500 mb-2 gap-1">
                    <span className="flex items-center sm:mr-3">
                      <User className="w-3 h-3 mr-1 text-blue-500" />
                      {post.author}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-blue-500" />
                      {post.date}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-2 hover:text-blue-600 transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-3 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Tag className="w-3 h-3 mr-1" />
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Load More Button */}
        <div className="text-center mb-8 sm:mb-10">
          <button className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs sm:text-sm">
            Load More Articles
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>

        {/* Categories Section */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 text-center mb-4 sm:mb-5">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.name}
                  className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-blue-100 hover:border-blue-300 hover:bg-white/80 transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-100 mb-2 sm:mb-3 group-hover:bg-blue-200 transition-colors duration-300">
                    <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors mb-1">
                    {category.name}
                  </h3>
                  <p className="text-xs text-slate-500">{category.count} articles</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-200/50 shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 mb-4 shadow-lg">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
              Subscribe to our newsletter
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 mb-4 sm:mb-6 max-w-2xl mx-auto leading-relaxed">
              Get the latest articles and news delivered to your inbox every week. Stay ahead in the world of algorithmic trading and never miss an important update.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-lg mx-auto mb-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/80 border border-blue-200 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-xs sm:text-sm"
              />
              <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap text-xs sm:text-sm transform hover:scale-105">
                Subscribe Now
              </button>
            </div>
            <p className="text-xs text-slate-500">
              No spam, unsubscribe at any time. We respect your privacy and will never share your email.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-100">
            <div className="text-lg sm:text-xl font-bold text-blue-600 mb-1">50+</div>
            <div className="text-xs sm:text-sm text-slate-600">Articles</div>
          </div>
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-100">
            <div className="text-lg sm:text-xl font-bold text-blue-600 mb-1">10K+</div>
            <div className="text-xs sm:text-sm text-slate-600">Readers</div>
          </div>
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-100">
            <div className="text-lg sm:text-xl font-bold text-blue-600 mb-1">5</div>
            <div className="text-xs sm:text-sm text-slate-600">Categories</div>
          </div>
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-100">
            <div className="text-lg sm:text-xl font-bold text-blue-600 mb-1">Weekly</div>
            <div className="text-xs sm:text-sm text-slate-600">Updates</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 sm:mt-16 text-center text-slate-500 text-xs">
          <p>&copy; 2025 AlgoBucks. All rights reserved. Made with ❤️ for traders and developers.</p>
        </div>
      </div>
    </div>
  );
};

export default Blog;