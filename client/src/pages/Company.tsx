import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, Award, Clock, BarChart2, CheckCircle } from 'lucide-react';

export const Company: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-6 sm:mb-8 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm">
            <img 
              src="/logo.png" 
              alt="AlgoBucks Logo" 
              className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain"
            />
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-gray-900">
            About <span className="text-blue-600">AlgoBucks</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto font-medium leading-relaxed px-4">
            Building the future of algorithmic trading education and coding competition platforms.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20">
          {[
            { icon: <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />, value: '50,000+', label: 'Active Traders' },
            { icon: <Award className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />, value: '1,000+', label: 'Algorithm Challenges' },
            { icon: <Clock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />, value: '24/7', label: 'Market Analysis' },
          ].map((stat, index) => (
            <div key={index} className="bg-white border border-gray-200 p-6 sm:p-8 rounded-xl text-center shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
              <div className="text-blue-600 mb-4 flex justify-center group-hover:text-blue-700 transition-colors">
                {stat.icon}
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900">{stat.value}</h3>
              <p className="text-gray-600 font-medium text-sm sm:text-base">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 mb-12 sm:mb-16 lg:mb-20">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Our Mission</h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
              To empower traders and developers of all skill levels to master algorithmic trading through advanced education, practice, and competitive challenges.
            </p>
            <ul className="space-y-3 sm:space-y-4">
              {[
                'Provide cutting-edge algorithmic trading challenges',
                'Foster a collaborative trading community',
                'Offer real-world market problem-solving experience',
                'Promote continuous learning in financial technology'
              ].map((item, i) => (
                <li key={i} className="flex items-start group">
                  <CheckCircle className="text-blue-500 mr-3 mt-0.5 w-4 h-4 sm:w-5 sm:h-5 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Our Vision</h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed">
              We envision a world where anyone, anywhere can transform their financial future through access to the best algorithmic trading resources and a supportive community that helps them master cutting-edge trading technologies.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
              <h3 className="font-bold mb-3 sm:mb-4 text-gray-900 text-sm sm:text-base">Core Values</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {['Excellence', 'Innovation', 'Community', 'Integrity', 'Accessibility', 'Growth'].map((value, i) => (
                  <span key={i} className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-center">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-gray-900">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { name: 'Dheeraj Gaur', role: 'CEO & Founder', image: 'https://dheerajgaurofficial.netlify.app/assets/dp-De2uMj27.png' },
              { name: 'Manish Kumar', role: 'CTO', image: 'https://www.manishdev.tech/_next/image?url=%2Fimages%2Fprofile.jpeg&w=750&q=75' },
              { name: 'Mukul Kumar', role: 'Lead Algorithm Developer', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
              { name: 'Priya Patel', role: 'Trading Community Manager', image: 'https://randomuser.me/api/portraits/women/63.jpg' },
            ].map((member, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-48 sm:h-56 lg:h-64 xl:h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-sm">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">Join Our Growing Community</h2>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Be part of a community of passionate algorithmic traders improving their skills and financial success every day.
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 font-bold py-3 px-6 sm:py-4 sm:px-8 lg:py-5 lg:px-10 rounded-xl transition-all duration-200 text-sm sm:text-base lg:text-lg tracking-wide shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Trading with AlgoBucks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Company;