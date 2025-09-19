import React from 'react';
import { Link } from 'react-router-dom';
// Import team images from src so Vite includes them in the build
import imgDheeraj from './Honors/dheeraj.png';
import imgManish from './Honors/manish.png';
import imgMukul from './Honors/mukul.png';
import imgDivesh from './Honors/divesh.png';
import imgNeelesh from './Honors/neelesh.png';
import { Building, Users, Award, Clock, BarChart2, CheckCircle, ExternalLink } from 'lucide-react';

export const Company: React.FC = () => {
  // Team data
  const team = [
    {
      name: 'Dheeraj Gaur',
      role: 'CEO & Founder',
      image: imgDheeraj,
      link: 'https://dheerajgaurofficial.netlify.app/',
    },
    {
      name: 'Manish Kumar',
      role: 'Chief Technology Officer (CTO)',
      image: imgManish,
      link: 'https://www.manishdev.tech/',
    },
    {
      name: 'Mukul Kumar',
      role: 'VP & Director of Engineering',
      image: imgMukul,
      link: 'https://dheerajgaurofficial.netlify.app/',
    },
    {
      name: 'Divesh Singh',
      role: 'Product Manager & Head of Product',
      image: imgDivesh,
      link: 'https://dheerajgaurofficial.netlify.app/',
    },
    {
      name: 'Neelesh Shakya',
      role: 'Technical Architect & Principal Engineer',
      image: imgNeelesh,
      link: 'https://dheerajgaurofficial.netlify.app/',
    },
  ];

  const [ceo, ...others] = team;

  const TeamCard = ({ name, role, image, link }: { name: string; role: string; image: string; link?: string }) => (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4 sm:p-5 lg:p-6 text-center">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 leading-tight">{name}</h3>
        <p className="text-gray-600 font-medium text-sm sm:text-base mb-4 leading-relaxed">{role}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <span>Know more</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 text-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-6 sm:mb-8 bg-white rounded-3xl border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <img 
              src="/logo.png" 
              alt="AlgoBucks Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 object-contain"
            />
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black mb-4 sm:mb-6 lg:mb-8 tracking-tight text-gray-900 leading-tight">
            About <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">AlgoBucks</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto font-medium leading-relaxed">
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
            <div key={index} className="group bg-white border-2 border-gray-100 p-6 sm:p-8 lg:p-10 rounded-3xl text-center shadow-md hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-blue-600 mb-4 sm:mb-6 flex justify-center group-hover:text-blue-700 group-hover:scale-110 transition-all duration-300">
                {stat.icon}
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2 sm:mb-3 text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{stat.value}</h3>
              <p className="text-gray-600 font-semibold text-sm sm:text-base lg:text-lg">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16 lg:mb-20">
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-4 sm:mb-6 lg:mb-8 text-gray-900 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Our Mission</h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed font-medium">
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
                  <CheckCircle className="text-blue-500 mr-3 sm:mr-4 mt-1 w-4 h-4 sm:w-5 sm:h-5 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300 flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-sm sm:text-base lg:text-lg leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-4 sm:mb-6 lg:mb-8 text-gray-900 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Our Vision</h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg leading-relaxed font-medium">
              We envision a world where anyone, anywhere can transform their financial future through access to the best algorithmic trading resources and a supportive community that helps them master cutting-edge trading technologies.
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 lg:p-8">
              <h3 className="font-black mb-4 sm:mb-6 text-gray-900 text-base sm:text-lg lg:text-xl">Core Values</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {['Excellence', 'Innovation', 'Community', 'Integrity', 'Accessibility', 'Growth'].map((value, i) => (
                  <span key={i} className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-blue-700 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-center transform hover:scale-105 active:scale-95">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-center mb-8 sm:mb-12 lg:mb-16 text-gray-900">
            Meet Our <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Team</span>
          </h2>
          
          {/* CEO centered at the top */}
          <div className="max-w-xs sm:max-w-sm lg:max-w-md mx-auto mb-8 sm:mb-12 lg:mb-16">
            <TeamCard name={ceo.name} role={ceo.role} image={ceo.image} link={ceo.link} />
          </div>

          {/* Remaining 4 in responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-6 xl:gap-8">
            {others.map((member) => (
              <TeamCard key={member.name} name={member.name} role={member.role} image={member.image} link={member.link} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 sm:p-8 lg:p-12 xl:p-16 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black mb-4 sm:mb-6 lg:mb-8 text-white leading-tight">Join Our Growing Community</h2>
          <p className="text-blue-100 text-sm sm:text-base lg:text-lg xl:text-xl mb-6 sm:mb-8 lg:mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
            Be part of a community of passionate algorithmic traders improving their skills and financial success every day.
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-black py-3 px-6 sm:py-4 sm:px-8 lg:py-5 lg:px-10 rounded-2xl transition-all duration-200 text-sm sm:text-base lg:text-lg tracking-wide shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-600"
          >
            Start Growing with AlgoBucks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Company;