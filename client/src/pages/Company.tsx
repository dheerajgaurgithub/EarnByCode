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
    <div className="group bg-white dark:bg-gray-950/90 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/60 hover:border-blue-300 dark:hover:border-gray-700/80 transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-3 sm:p-4 text-center">
        <h3 className="text-sm sm:text-base font-semibold text-blue-700 dark:text-blue-300 mb-1 leading-tight transition-colors duration-200">{name}</h3>
        <p className="text-gray-500 dark:text-blue-400 font-normal text-xs sm:text-sm mb-3 leading-relaxed italic transition-colors duration-200">{role}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg dark:hover:shadow-gray-900/40 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <span>Know more</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-blue-300 py-4 sm:py-6 px-3 sm:px-4 lg:px-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-4 sm:mb-6 bg-white dark:bg-gray-950/80 rounded-2xl border border-blue-100 dark:border-gray-800/60 shadow-md hover:shadow-lg dark:hover:shadow-gray-900/40 transition-all duration-300">
            <img 
              src="/logo.png" 
              alt="AlgoBucks Logo" 
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain"
            />
          </div>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6 tracking-tight text-gray-900 dark:text-blue-300 leading-tight transition-colors duration-200">
            About <span className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">AlgoBucks</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-blue-400 max-w-3xl mx-auto font-medium leading-relaxed transition-colors duration-200">
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
            <div key={index} className="group bg-white dark:bg-gray-950/90 border border-gray-100 dark:border-gray-800/60 p-4 sm:p-6 rounded-2xl text-center shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/60 hover:border-blue-200 dark:hover:border-gray-700/80 transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-blue-600 dark:text-blue-300 mb-3 sm:mb-4 flex justify-center group-hover:text-blue-700 dark:group-hover:text-blue-200 group-hover:scale-110 transition-all duration-300">
                {stat.icon}
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 text-gray-900 dark:text-blue-300 group-hover:text-blue-900 dark:group-hover:text-blue-200 transition-colors duration-300">{stat.value}</h3>
              <p className="text-gray-600 dark:text-blue-400 font-medium text-xs sm:text-sm transition-colors duration-200">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="bg-white dark:bg-gray-950/90 border border-gray-100 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900 dark:text-blue-300 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent transition-colors duration-200">Our Mission</h2>
            <p className="text-gray-600 dark:text-blue-400 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed font-medium transition-colors duration-200">
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
                  <CheckCircle className="text-blue-500 dark:text-blue-300 mr-2 sm:mr-3 mt-0.5 w-3 h-3 sm:w-4 sm:h-4 group-hover:text-blue-600 dark:group-hover:text-blue-200 group-hover:scale-110 transition-all duration-300 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-blue-400 font-medium text-xs sm:text-sm leading-relaxed transition-colors duration-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-950/90 border border-gray-100 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900 dark:text-blue-300 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent transition-colors duration-200">Our Vision</h2>
            <p className="text-gray-600 dark:text-blue-400 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed font-medium transition-colors duration-200">
              We envision a world where anyone, anywhere can transform their financial future through access to the best algorithmic trading resources and a supportive community that helps them master cutting-edge trading technologies.
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-gray-900/60 dark:to-gray-950/80 border border-blue-200 dark:border-gray-800/60 rounded-xl p-3 sm:p-4 lg:p-6 transition-colors duration-200">
              <h3 className="font-bold mb-3 sm:mb-4 text-gray-900 dark:text-blue-300 text-sm sm:text-base transition-colors duration-200">Core Values</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {['Excellence', 'Innovation', 'Community', 'Integrity', 'Accessibility', 'Growth'].map((value, i) => (
                  <span key={i} className="inline-flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold bg-white dark:bg-gray-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-gray-800/60 hover:bg-blue-50 dark:hover:bg-gray-800/60 hover:border-blue-300 dark:hover:border-gray-700/80 hover:shadow-sm dark:hover:shadow-gray-900/40 transition-all duration-200 text-center transform hover:scale-105 active:scale-95">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-6 sm:mb-8 lg:mb-12 text-gray-900 dark:text-blue-300 transition-colors duration-200">
            Meet Our <span className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">Team</span>
          </h2>
          
          {/* CEO centered at the top */}
          <div className="max-w-xs mx-auto mb-6 sm:mb-8 lg:mb-12">
            <TeamCard name={ceo.name} role={ceo.role} image={ceo.image} link={ceo.link} />
          </div>

          {/* Remaining 4 in responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {others.map((member) => (
              <TeamCard key={member.name} name={member.name} role={member.role} image={member.image} link={member.link} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-12 text-center shadow-lg hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-white leading-tight">Join Our Growing Community</h2>
          <p className="text-blue-100 dark:text-blue-200 text-xs sm:text-sm lg:text-base mb-4 sm:mb-6 lg:mb-8 max-w-3xl mx-auto leading-relaxed font-medium transition-colors duration-200">
            Be part of a community of passionate algorithmic traders improving their skills and financial success every day.
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-white dark:bg-gray-950/90 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-900/80 active:bg-blue-100 dark:active:bg-gray-800/80 font-bold py-2 px-4 sm:py-3 sm:px-6 lg:py-4 lg:px-8 rounded-xl transition-all duration-200 text-xs sm:text-sm lg:text-base tracking-wide shadow-md hover:shadow-lg dark:hover:shadow-gray-900/40 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-600 dark:focus:ring-offset-blue-500"
          >
            Start Growing with AlgoBucks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Company;