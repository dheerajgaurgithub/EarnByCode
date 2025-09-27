import React from 'react';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';
import imgDheeraj from './Honors/dheeraj.png';
import imgManish from './Honors/manish.png';
import imgMukul from './Honors/mukul.png';
import imgDivesh from './Honors/divesh.png';
import imgNeelesh from './Honors/neelesh.png';

export const Company: React.FC = () => {
  const CEO_LINK = 'https://dheerajgaurofficial.netlify.app/';
  const ceo = { name: 'Dheeraj Gaur', role: 'CEO & Founder', image: imgDheeraj, link: CEO_LINK } as const;
  
  const otherTeamMembers = [
    { name: 'Manish Kumar', role: 'Chief Technology Officer (CTO)', image: imgManish, link: 'https://manishdev.tech/' },
    { name: 'Mukul Kumar', role: 'VP & Director of Engineering', image: imgMukul, link: CEO_LINK },
    { name: 'Divesh Singh', role: 'Product Manager & Head of Product', image: imgDivesh, link: CEO_LINK },
    { name: 'Neelesh Shakya', role: 'Technical Architect & Principal Engineer', image: imgNeelesh, link: CEO_LINK },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-gray-950 dark:to-gray-900 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6 sm:mb-8 lg:mb-10">
          <img src="/logo.png" alt="EarnByCode Logo" className="inline-block mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-green-100 mb-2">About EarnByCode</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-green-300 mt-2 max-w-2xl mx-auto leading-relaxed px-2">
            EarnByCode is a coding practice and contests platform. Solve problems, compete in timed contests,
            and track your progress with submissions and leaderboards.
          </p>
        </header>

        <section className="mb-6 sm:mb-8 lg:mb-10 bg-white dark:bg-gray-900 rounded-xl border border-sky-200 dark:border-green-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-green-100">What we do</h2>
          <ul className="space-y-2 sm:space-y-3">
            <li className="flex items-start gap-2 text-xs sm:text-sm lg:text-base text-gray-700 dark:text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-green-500 mt-2 flex-shrink-0"></span>
              Curated coding problems with examples and constraints
            </li>
            <li className="flex items-start gap-2 text-xs sm:text-sm lg:text-base text-gray-700 dark:text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-green-500 mt-2 flex-shrink-0"></span>
              Integrated code editor and judge with multi-language support
            </li>
            <li className="flex items-start gap-2 text-xs sm:text-sm lg:text-base text-gray-700 dark:text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-green-500 mt-2 flex-shrink-0"></span>
              Contests with rankings and results
            </li>
            <li className="flex items-start gap-2 text-xs sm:text-sm lg:text-base text-gray-700 dark:text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-green-500 mt-2 flex-shrink-0"></span>
              Submissions history and profile stats
            </li>
          </ul>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
          <Link to="/problems" className="group block p-4 sm:p-5 rounded-xl bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 hover:border-sky-300 dark:hover:border-green-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                <span className="text-lg sm:text-xl">💻</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-green-100 mb-1">Explore Problems</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400">Practice by difficulty and topic.</p>
              </div>
            </div>
          </Link>
          <Link to="/contests" className="group block p-4 sm:p-5 rounded-xl bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 hover:border-sky-300 dark:hover:border-green-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                <span className="text-lg sm:text-xl">🏆</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-green-100 mb-1">Join Contests</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400">Compete and view results.</p>
              </div>
            </div>
          </Link>
          <Link to="/discuss" className="group block p-4 sm:p-5 rounded-xl bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 hover:border-sky-300 dark:hover:border-green-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                <span className="text-lg sm:text-xl">💬</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-green-100 mb-1">Community Discuss</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400">Ask questions and share insights.</p>
              </div>
            </div>
          </Link>
          <Link to="/leaderboard" className="group block p-4 sm:p-5 rounded-xl bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 hover:border-sky-300 dark:hover:border-green-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                <span className="text-lg sm:text-xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 dark:text-green-100 mb-1">Leaderboard</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400">See where you stand.</p>
              </div>
            </div>
          </Link>
        </section>

        {/* Team */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-green-100 text-center">Our Team</h2>
          
          {/* CEO Section */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-xl max-w-xs shadow-sm hover:shadow-md transition-shadow">
              <div className="relative inline-block mb-3 sm:mb-4">
                <img src={ceo.image} alt={ceo.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-sky-200 dark:border-green-700 shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-sky-500 dark:bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-bold">👑</span>
                </div>
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-green-100 mb-1">{ceo.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400 mb-2">{ceo.role}</p>
              <a href={ceo.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs sm:text-sm text-sky-600 dark:text-green-400 hover:text-sky-700 dark:hover:text-green-300 font-medium transition-colors">
                <span>View Profile</span>
                <span className="text-xs">↗</span>
              </a>
            </div>
          </div>
          
          {/* Other Team Members */}
          <div className="bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {otherTeamMembers.map((member) => (
                <div key={member.name} className="text-center group">
                  <div className="relative inline-block mb-2 sm:mb-3">
                    <img src={member.image} alt={member.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-sky-200 dark:border-green-700 group-hover:border-sky-300 dark:group-hover:border-green-600 transition-colors shadow-sm" />
                  </div>
                  <h4 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 dark:text-green-100 mb-1 leading-tight">{member.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-green-400 mb-2 leading-tight">{member.role}</p>
                  <a href={member.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-green-400 hover:text-sky-700 dark:hover:text-green-300 font-medium transition-colors">
                    <span>Profile</span>
                    <span className="text-xs">↗</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-sky-200 dark:border-green-800 p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">📧</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 text-gray-900 dark:text-green-100">Contact Us</h2>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-green-300 leading-relaxed">
                For general queries and press inquiries: 
                <a href="mailto:replyearnbycode@gmail.com" className="ml-1 text-sky-600 dark:text-green-400 hover:text-sky-700 dark:hover:text-green-300 font-medium underline transition-colors">
                  replyearnbycode@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Company;