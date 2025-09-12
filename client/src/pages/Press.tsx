import React from 'react';
import { Newspaper, Mic, Tv, Award as AwardIcon, Download } from 'lucide-react';

type PressItem = {
  id: string;
  title: string;
  source: string;
  date: string;
  type: 'article' | 'podcast' | 'video' | 'award';
  url: string;
  excerpt: string;
};

const pressItems: PressItem[] = [
  {
    id: '1',
    title: 'CodeArena Raises $10M Series A to Expand Coding Competition Platform',
    source: 'TechCrunch',
    date: 'June 15, 2023',
    type: 'article',
    url: 'https://techcrunch.com/codearena-series-a',
    excerpt: 'CodeArena, the popular platform for coding competitions, has raised $10 million in Series A funding led by Sequoia Capital to expand its developer tools and global reach.'
  },
  {
    id: '2',
    title: 'How CodeArena is Revolutionizing Technical Hiring',
    source: 'The Verge',
    date: 'April 2, 2023',
    type: 'article',
    url: 'https://theverge.com/codearena-hiring',
    excerpt: 'With its unique approach to assessing coding skills through real-world challenges, CodeArena is changing how companies identify and hire top technical talent.'
  },
  {
    id: '3',
    title: 'The Future of Coding Education: Interview with CodeArena CEO',
    source: 'Software Engineering Daily',
    date: 'March 18, 2023',
    type: 'podcast',
    url: 'https://softwareengineeringdaily.com/codearena-interview',
    excerpt: 'In this episode, we sit down with the CEO of CodeArena to discuss the future of coding education and how competitive programming is evolving.'
  },
  {
    id: '4',
    title: 'CodeArena Wins 2023 Best Educational Platform Award',
    source: 'EdTech Breakthrough',
    date: 'February 5, 2023',
    type: 'award',
    url: 'https://edtechbreakthrough.com/winners/codearena-2023',
    excerpt: 'CodeArena has been recognized as the Best Educational Platform in the 2023 EdTech Breakthrough Awards for its innovative approach to coding education.'
  },
  {
    id: '5',
    title: 'How CodeArena is Helping Developers Land Their Dream Jobs',
    source: 'Forbes',
    date: 'January 22, 2023',
    type: 'article',
    url: 'https://forbes.com/codearena-careers',
    excerpt: 'With its unique blend of learning and competition, CodeArena is helping developers at all levels improve their skills and connect with top tech companies.'
  },
  {
    id: '6',
    title: 'CodeArena Featured on Tech Today',
    source: 'CNBC',
    date: 'December 10, 2022',
    type: 'video',
    url: 'https://cnbc.com/techtoday/codearena-feature',
    excerpt: 'CNBC takes a closer look at how CodeArena is transforming the way developers learn and compete in the tech industry.'
  }
];

const getIconForType = (type: PressItem['type']) => {
  switch (type) {
    case 'article':
      return <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'podcast':
      return <Mic className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'video':
      return <Tv className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'award':
      return <AwardIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    default:
      return <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />;
  }
};

const Press: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Press & Media</h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Latest news, press releases, and media resources about CodeArena.
          </p>
        </div>

        {/* Press Kit */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg sm:rounded-xl p-6 sm:p-8 mb-12 sm:mb-16 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Press Kit</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-white border-opacity-20">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Brand Assets</h3>
                <p className="text-blue-100 text-sm sm:text-base mb-3 sm:mb-4">Download our logos and brand guidelines for media use.</p>
                <div className="space-y-2">
                  <a 
                    href="/press/codearena-brand-assets.zip" 
                    className="flex items-center text-blue-200 hover:text-white transition-colors text-sm sm:text-base"
                    download
                  >
                    <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Download Brand Assets (ZIP)</span>
                  </a>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-white border-opacity-20">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Media Inquiries</h3>
                <p className="text-blue-100 text-sm sm:text-base mb-3 sm:mb-4">
                  For press inquiries, please contact our media relations team at:
                </p>
                <a 
                  href="mailto:press@algobucks.com" 
                  className="text-blue-200 hover:text-white transition-colors text-sm sm:text-base break-all"
                >
                  press@algobucks.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Press Releases */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Press Releases</h2>
          <div className="space-y-4 sm:space-y-6">
            {pressItems
              .filter(item => item.type === 'article' || item.type === 'award')
              .map((item) => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="bg-white rounded-lg p-4 sm:p-6 hover:bg-blue-50 transition-colors border border-gray-200 shadow-sm hover:shadow-md">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="text-blue-600 mt-1 flex-shrink-0">
                        {getIconForType(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                          <span className="font-medium">{item.source}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{item.date}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.excerpt}</p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        </div>

        {/* Media Appearances */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Media Appearances</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {pressItems
              .filter(item => item.type === 'podcast' || item.type === 'video')
              .map((item) => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="bg-white rounded-lg p-4 sm:p-6 h-full hover:bg-blue-50 transition-colors border border-gray-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center mb-3 space-x-3">
                      <div className="text-blue-600 flex-shrink-0">
                        {getIconForType(item.type)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 min-w-0">
                        <span className="font-medium">{item.source}</span>
                        <span className="mx-1">•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.excerpt}</p>
                  </div>
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Press;