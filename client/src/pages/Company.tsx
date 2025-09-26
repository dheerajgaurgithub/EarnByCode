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
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-green-200 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-100 dark:bg-green-900/40 mb-3">
            <img src="./logo.png" alt="./logo.png" />
          </div>
          <h1 className="text-2xl font-bold">About AlgoBucks</h1>
          <p className="text-sm text-slate-600 dark:text-green-300 mt-2 max-w-2xl mx-auto">
            AlgoBucks is a coding practice and contests platform. Solve problems, compete in timed contests,
            and track your progress with submissions and leaderboards.
          </p>
        </header>

        <section className="space-y-2 mb-8">
          <h2 className="text-lg font-semibold">What we do</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-green-300 space-y-1">
            <li>Curated coding problems with examples and constraints</li>
            <li>Integrated code editor and judge with multi-language support</li>
            <li>Contests with rankings and results</li>
            <li>Submissions history and profile stats</li>
          </ul>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <Link to="/problems" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Explore Problems</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">Practice by difficulty and topic.</p>
          </Link>
          <Link to="/contests" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Join Contests</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">Compete and view results.</p>
          </Link>
          <Link to="/discuss" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Community Discuss</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">Ask questions and share insights.</p>
          </Link>
          <Link to="/leaderboard" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Leaderboard</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">See where you stand.</p>
          </Link>
        </section>

        {/* Team */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-6">Team</h2>
          
          {/* CEO Section */}
          <div className="flex justify-center mb-8">
            <div className="text-center p-6 border border-sky-200 dark:border-green-800 rounded-xl max-w-sm">
              <img src={ceo.image} alt={ceo.name} className="w-20 h-20 rounded-full object-cover border-2 border-sky-200 dark:border-green-800 mx-auto mb-3" />
              <h3 className="text-base font-semibold">{ceo.name}</h3>
              <p className="text-sm text-slate-600 dark:text-green-400">{ceo.role}</p>
              <a href={ceo.link} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 dark:text-green-400 underline">View profile</a>
            </div>
          </div>
          
          {/* Other Team Members */}
          <div className="border border-sky-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex flex-wrap justify-center gap-8">
              {otherTeamMembers.map((member) => (
                <div key={member.name} className="text-center">
                  <img src={member.image} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-sky-200 dark:border-green-800 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold">{member.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-green-400 max-w-24">{member.role}</p>
                  <a href={member.link} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 dark:text-green-400 underline">View profile</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <p className="text-sm text-slate-700 dark:text-green-300">
            For general queries and press: <a href="mailto:press@algobucks.com" className="text-sky-600 dark:text-green-400 underline">press@algobucks.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default Company;