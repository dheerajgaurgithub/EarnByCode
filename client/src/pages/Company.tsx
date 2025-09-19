import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, Award, Clock, BarChart2, CheckCircle } from 'lucide-react';

export const Company: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-4 sm:mb-6 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm">
            <img 
              src="/logo.png" 
              alt="AlgoBucks Logo" 
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 object-contain"
            />
          </div>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 sm:mb-4 lg:mb-6 tracking-tight text-gray-900">
            About <span className="text-blue-600">AlgoBucks</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-4xl mx-auto font-medium leading-relaxed px-2 sm:px-4">
            Building the future of algorithmic trading education and coding competition platforms.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
          {[
            { icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />, value: '50,000+', label: 'Active Traders' },
            { icon: <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />, value: '1,000+', label: 'Algorithm Challenges' },
            { icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />, value: '24/7', label: 'Market Analysis' },
          ].map((stat, index) => (
            <div key={index} className="bg-white border border-gray-200 p-4 sm:p-6 lg:p-8 rounded-xl text-center shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
              <div className="text-blue-600 mb-3 sm:mb-4 flex justify-center group-hover:text-blue-700 transition-colors">
                {stat.icon}
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 text-gray-900">{stat.value}</h3>
              <p className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-12 mb-8 sm:mb-12 lg:mb-16">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900">Our Mission</h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base leading-relaxed">
              To empower traders and developers of all skill levels to master algorithmic trading through advanced education, practice, and competitive challenges.
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {[
                'Provide cutting-edge algorithmic trading challenges',
                'Foster a collaborative trading community',
                'Offer real-world market problem-solving experience',
                'Promote continuous learning in financial technology'
              ].map((item, i) => (
                <li key={i} className="flex items-start group">
                  <CheckCircle className="text-blue-500 mr-2 sm:mr-3 mt-0.5 w-3 h-3 sm:w-4 sm:h-4 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-xs sm:text-sm lg:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900">Our Vision</h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base leading-relaxed">
              We envision a world where anyone, anywhere can transform their financial future through access to the best algorithmic trading resources and a supportive community that helps them master cutting-edge trading technologies.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 lg:p-6">
              <h3 className="font-bold mb-2 sm:mb-3 text-gray-900 text-xs sm:text-sm lg:text-base">Core Values</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 lg:gap-3">
                {['Excellence', 'Innovation', 'Community', 'Integrity', 'Accessibility', 'Growth'].map((value, i) => (
                  <span key={i} className="inline-flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-center">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-center mb-6 sm:mb-8 lg:mb-12 text-gray-900">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
               { 
                name: 'Dheeraj Gaur', 
                role: 'CEO & Founder', 
                image: 'https://drive.google.com/file/d/1fnErXeiPMxgtFMIXkr3zSPU8EOF8M9my/view?usp=drive_link',
                link: 'https://dheerajgaur-portfolio.com' // replace with your portfolio link
              },
              { 
                name: 'Manish Kumar', 
                role: 'CTO', 
                image: 'https://drive.google.com/file/d/1I7OP7SNsu86ogvjTGzcP5y7meJ6SPNHU/view?usp=drive_link',
                link: 'https://manishkumar.dev' // replace with real link
              },
              { 
                name: 'Mukul Kumar', 
                role: 'Lead Algorithm Developer', 
                image: 'https://drive.google.com/file/d/1bAg18e9-Kwdp3k0Ikdpf2rw5ji9w5JUh/view?usp=drive_link',
                link: 'https://mukul-portfolio.com'
              },
              { 
                name: 'Priya Patel', 
                role: 'Trading Community Manager', 
                image: 'https://randomuser.me/api/portraits/women/63.jpg',
                link: 'https://priyapatel.dev'
              },
            ].map((member, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-40 sm:h-48 lg:h-56 xl:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </div>
                <div className="p-3 sm:p-4 lg:p-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-12 text-center shadow-sm">
          <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900">Join Our Growing Community</h2>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-4 sm:mb-6 lg:mb-8 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
            Be part of a community of passionate algorithmic traders improving their skills and financial success every day.
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 font-bold py-2 px-4 sm:py-3 sm:px-6 lg:py-4 lg:px-8 rounded-xl transition-all duration-200 text-xs sm:text-sm lg:text-base tracking-wide shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Trading with AlgoBucks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Company;