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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 py-3 sm:py-4 lg:py-5 px-3 sm:px-4 lg:px-5 transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-48 sm:w-56 h-48 sm:h-56 bg-sky-200/10 dark:bg-green-800/10 rounded-full blur-3xl animate-pulse transition-colors duration-300"></div>
        <div className="absolute -bottom-40 -left-32 w-48 sm:w-56 h-48 sm:h-56 bg-sky-300/10 dark:bg-green-700/10 rounded-full blur-3xl animate-pulse transition-colors duration-300"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-44 h-32 sm:h-44 bg-sky-400/10 dark:bg-green-600/10 rounded-full blur-3xl"></div>
      </div>
  
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-r from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 mb-3 sm:mb-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 dark:from-green-400 dark:via-green-300 dark:to-green-500 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight">
            AlgoBucks Blog
          </h1>
          <p className="text-sm sm:text-base text-sky-700 dark:text-green-300 max-w-3xl mx-auto leading-relaxed font-medium transition-colors duration-300">
            Stay updated with the latest news, tutorials, and insights about algorithmic trading and competitive programming.
          </p>
        </div>
  
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-green-400 mb-3 sm:mb-4 transition-colors duration-300">Featured Article</h2>
            <div className="bg-gradient-to-r from-sky-50/80 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden border border-sky-200/50 dark:border-green-800/30 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="h-48 sm:h-64 lg:h-full overflow-hidden order-2 lg:order-1">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-3 sm:p-4 lg:p-6 xl:p-8 flex flex-col justify-center order-1 lg:order-2">
                  <div className="flex flex-wrap items-center text-xs sm:text-sm text-sky-600 dark:text-green-300 mb-2 sm:mb-3 gap-2 sm:gap-3">
                    <span className="flex items-center bg-sky-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                      <User className="w-3 h-3 mr-1 text-sky-600 dark:text-green-400" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center bg-sky-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3 mr-1 text-sky-600 dark:text-green-400" />
                      {featuredPost.date}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-sky-200 dark:bg-green-800/50 text-sky-800 dark:text-green-300">
                      <Tag className="w-3 h-3 mr-1" />
                      {featuredPost.category}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-900 dark:text-green-400 mb-2 sm:mb-3 hover:text-sky-700 dark:hover:text-green-300 transition-colors cursor-pointer leading-tight">
                    {featuredPost.title}
                  </h3>
                  <p className="text-sm sm:text-base text-sky-700 dark:text-green-300 mb-3 sm:mb-4 leading-relaxed font-medium">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-sky-600 dark:text-green-300 flex items-center bg-sky-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {featuredPost.readTime}
                    </span>
                    <button className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 text-sm">
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
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-green-400 mb-3 sm:mb-4 transition-colors duration-300">Latest Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {regularPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden border border-sky-200/50 dark:border-green-800/30 hover:border-sky-300/70 dark:hover:border-green-700/50 hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 hover:-translate-y-2 hover:scale-105 group cursor-pointer"
              >
                <div className="h-32 sm:h-40 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-sky-600 dark:text-green-300 mb-2 gap-2">
                    <span className="flex items-center bg-sky-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                      <User className="w-2.5 h-2.5 mr-1 text-sky-600 dark:text-green-400" />
                      {post.author}
                    </span>
                    <span className="flex items-center bg-sky-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                      <Clock className="w-2.5 h-2.5 mr-1 text-sky-600 dark:text-green-400" />
                      {post.date}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-sky-900 dark:text-green-400 mb-2 hover:text-sky-700 dark:hover:text-green-300 transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-sky-700 dark:text-green-300 mb-2 sm:mb-3 line-clamp-3 leading-relaxed font-medium">{post.excerpt}</p>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-sky-200 dark:bg-green-800/50 text-sky-800 dark:text-green-300">
                      <Tag className="w-2.5 h-2.5 mr-1" />
                      {post.category}
                    </span>
                    <span className="text-xs text-sky-600 dark:text-green-300 flex items-center bg-sky-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                      <BookOpen className="w-2.5 h-2.5 mr-1" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
  
        {/* Load More Button */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <button className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 text-sm">
            Load More Articles
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
  
        {/* Categories Section */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-green-400 text-center mb-3 sm:mb-4 transition-colors duration-300">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.name}
                  className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-sky-200/50 dark:border-green-800/30 hover:border-sky-300/70 dark:hover:border-green-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 group cursor-pointer hover:-translate-y-2 hover:scale-105 hover:shadow-xl dark:hover:shadow-gray-900/60"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                    <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 text-sky-600 dark:text-green-400 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-sky-800 dark:text-green-400 group-hover:text-sky-600 dark:group-hover:text-green-300 transition-colors mb-1">
                    {category.name}
                  </h3>
                  <p className="text-xs text-sky-600 dark:text-green-300">{category.count} articles</p>
                </div>
              );
            })}
          </div>
        </div>
  
        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-sky-50/80 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 border border-sky-200/50 dark:border-green-800/30 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 mb-6 sm:mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 mb-3 sm:mb-4 shadow-xl transform hover:scale-110 hover:rotate-3 transition-all duration-300">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-sky-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-900 dark:text-green-400 mb-2 sm:mb-3 transition-colors duration-300">
              Subscribe to our newsletter
            </h2>
            <p className="text-sm sm:text-base text-sky-700 dark:text-green-300 mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed font-medium transition-colors duration-300">
              Get the latest articles and news delivered to your inbox every week. Stay ahead in the world of algorithmic trading and never miss an important update.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-xl mx-auto mb-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-sky-200/60 dark:border-green-700/40 text-sky-900 dark:text-green-200 placeholder-sky-500 dark:placeholder-green-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-400 focus:border-transparent shadow-lg hover:shadow-xl text-sm font-medium transition-all duration-300"
              />
              <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap text-sm transform hover:scale-105">
                Subscribe Now
              </button>
            </div>
            <p className="text-xs text-sky-600 dark:text-green-300 font-medium">
              No spam, unsubscribe at any time. We respect your privacy and will never share your email.
            </p>
          </div>
        </div>
  
        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="text-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-sky-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-600 dark:text-green-400 mb-1">50+</div>
            <div className="text-xs sm:text-sm text-sky-700 dark:text-green-300 font-semibold">Articles</div>
          </div>
          <div className="text-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-sky-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-600 dark:text-green-400 mb-1">10K+</div>
            <div className="text-xs sm:text-sm text-sky-700 dark:text-green-300 font-semibold">Readers</div>
          </div>
          <div className="text-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-sky-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-600 dark:text-green-400 mb-1">5</div>
            <div className="text-xs sm:text-sm text-sky-700 dark:text-green-300 font-semibold">Categories</div>
          </div>
          <div className="text-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-sky-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-600 dark:text-green-400 mb-1">Weekly</div>
            <div className="text-xs sm:text-sm text-sky-700 dark:text-green-300 font-semibold">Updates</div>
          </div>
        </div>
  
        {/* Footer */}
        {/* <div className="text-center text-sky-600 dark:text-green-300 text-xs sm:text-sm font-medium">
          <p>&copy; 2025 AlgoBucks. All rights reserved. Made with ❤️ for coders and developers.</p>
        </div> */}
      </div>
    </div>
  );
}

export default Blog;