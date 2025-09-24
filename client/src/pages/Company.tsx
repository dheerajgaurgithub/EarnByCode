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
    <div className="group bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-sky-200/50 dark:border-green-800/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl dark:hover:shadow-gray-900/60 hover:border-sky-300/70 dark:hover:border-green-700/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sky-900/20 via-transparent to-transparent dark:from-green-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/90 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="w-full h-1 bg-gradient-to-r from-sky-400 to-sky-600 dark:from-green-400 dark:to-green-600 rounded-full"></div>
        </div>
      </div>
      <div className="p-3 sm:p-4 lg:p-5 text-center">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-sky-800 dark:text-green-400 mb-1 leading-tight transition-colors duration-200 group-hover:text-sky-900 dark:group-hover:text-green-300">
          {name}
        </h3>
        <p className="text-sky-600 dark:text-green-300 font-medium text-xs sm:text-sm mb-3 leading-relaxed italic transition-colors duration-200">
          {role}
        </p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 text-white text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl dark:hover:shadow-gray-900/40 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-200 transform hover:scale-110 active:scale-95 group-hover:animate-pulse"
          >
            <span>Know More</span>
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
          </a>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 text-sky-900 dark:text-green-300 py-3 sm:py-4 lg:py-6 px-3 sm:px-4 lg:px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-4 sm:mb-6 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-sky-200/60 dark:border-green-800/40 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:scale-110 hover:rotate-3">
            <img 
              src="/logo.png" 
              alt="AlgoBucks Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
            />
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 tracking-tight text-sky-900 dark:text-green-400 leading-tight transition-colors duration-200">
            About <span className="bg-gradient-to-r from-sky-600 to-sky-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">AlgoBucks</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-sky-700 dark:text-green-300 max-w-4xl mx-auto font-medium leading-relaxed transition-colors duration-200">
            Building the future of algorithmic trading education and coding competition platforms.
          </p>
        </div>
  
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
          {[
            { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />, value: '50,000+', label: 'Active Traders' },
            { icon: <Award className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />, value: '1,000+', label: 'Algorithm Challenges' },
            { icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />, value: '24/7', label: 'Market Analysis' },
          ].map((stat, index) => (
            <div key={index} className="group bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-sky-200/50 dark:border-green-800/30 p-4 sm:p-6 lg:p-8 rounded-2xl text-center shadow-lg hover:shadow-2xl dark:hover:shadow-gray-900/60 hover:border-sky-300/70 dark:hover:border-green-700/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
              <div className="bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center text-sky-600 dark:text-green-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                {stat.icon}
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-sky-800 dark:text-green-400 group-hover:text-sky-900 dark:group-hover:text-green-300 transition-colors duration-300">
                {stat.value}
              </h3>
              <p className="text-sky-600 dark:text-green-300 font-semibold text-sm sm:text-base transition-colors duration-200">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
  
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-sky-200/50 dark:border-green-800/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-sky-900 dark:text-green-400 bg-gradient-to-r from-sky-600 to-sky-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent transition-colors duration-200">
              Our Mission
            </h2>
            <p className="text-sky-700 dark:text-green-300 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed font-medium transition-colors duration-200">
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
                  <div className="bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 rounded-full p-1 mr-2 sm:mr-3 mt-0.5 group-hover:scale-110 transition-all duration-300">
                    <CheckCircle className="text-sky-600 dark:text-green-400 w-3 h-3 sm:w-4 sm:h-4 group-hover:text-sky-700 dark:group-hover:text-green-300 transition-all duration-300" />
                  </div>
                  <span className="text-sky-700 dark:text-green-300 font-medium text-sm sm:text-base leading-relaxed transition-colors duration-200">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-sky-200/50 dark:border-green-800/30 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-sky-900 dark:text-green-400 bg-gradient-to-r from-sky-600 to-sky-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent transition-colors duration-200">
              Our Vision
            </h2>
            <p className="text-sky-700 dark:text-green-300 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed font-medium transition-colors duration-200">
              We envision a world where anyone, anywhere can transform their financial future through access to the best algorithmic trading resources and a supportive community that helps them master cutting-edge trading technologies.
            </p>
            <div className="bg-gradient-to-br from-sky-50/80 to-sky-100/60 dark:from-gray-800/60 dark:to-gray-900/80 border border-sky-200/60 dark:border-green-800/40 rounded-2xl p-3 sm:p-4 lg:p-6 transition-colors duration-200">
              <h3 className="font-bold mb-3 sm:mb-4 text-sky-900 dark:text-green-400 text-sm sm:text-base transition-colors duration-200">
                Core Values
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {['Excellence', 'Innovation', 'Community', 'Integrity', 'Accessibility', 'Growth'].map((value, i) => (
                  <span key={i} className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/90 dark:bg-gray-800/80 text-sky-700 dark:text-green-400 border border-sky-200/60 dark:border-green-800/40 hover:bg-sky-50 dark:hover:bg-gray-700/60 hover:border-sky-300 dark:hover:border-green-700/60 hover:shadow-lg dark:hover:shadow-gray-900/40 transition-all duration-200 text-center transform hover:scale-110 active:scale-95 cursor-pointer">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
  
        {/* Team Section */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 lg:mb-12 text-sky-900 dark:text-green-400 transition-colors duration-200">
            Meet Our <span className="bg-gradient-to-r from-sky-600 to-sky-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">Team</span>
          </h2>
          
          {/* CEO centered at the top */}
          <div className="max-w-sm mx-auto mb-8 sm:mb-10 lg:mb-12">
            <TeamCard name={ceo.name} role={ceo.role} image={ceo.image} link={ceo.link} />
          </div>
  
          {/* Remaining 4 in responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {others.map((member) => (
              <TeamCard key={member.name} name={member.name} role={member.role} image={member.image} link={member.link} />
            ))}
          </div>
        </div>
  
        {/* CTA */}
        <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 dark:from-green-600 dark:via-green-700 dark:to-green-800 rounded-3xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl hover:shadow-3xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6 text-white leading-tight">
              Join Our Growing Community
            </h2>
            <p className="text-sky-100 dark:text-green-100 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10 max-w-4xl mx-auto leading-relaxed font-medium transition-colors duration-200">
              Be part of a community of passionate algorithmic traders improving their skills and financial success every day.
            </p>
            <Link 
              to="/register" 
              className="inline-block bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm text-sky-700 dark:text-green-400 hover:bg-white dark:hover:bg-gray-800/90 active:bg-sky-50 dark:active:bg-gray-700/90 font-bold py-3 px-6 sm:py-4 sm:px-8 lg:py-5 lg:px-10 rounded-2xl transition-all duration-200 text-sm sm:text-base lg:text-lg tracking-wide shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-4 focus:ring-offset-sky-600 dark:focus:ring-offset-green-600 border border-white/20 dark:border-green-800/30"
            >
              Start Growing with AlgoBucks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Company;