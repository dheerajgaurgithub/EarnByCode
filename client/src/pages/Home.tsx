// React import not required with automatic JSX runtime
import { Code, ArrowRight, Trophy, Zap, Target, DollarSign, Brain } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

// Mock data for the component (values stay same; labels via i18n)
const stats = (t: (k: string) => string) => [
  { label: t('home.stats.active_coders'), value: '50K+' },
  { label: t('home.stats.problems_solved'), value: '2M+' },
  { label: t('home.stats.total_prizes'), value: '$1M+' },
  { label: t('home.stats.live_contests'), value: '24/7' }
];

const features = (t: (k: string) => string) => [
  {
    icon: Zap,
    title: t('home.features.realtime.title'),
    description: t('home.features.realtime.desc')
  },
  {
    icon: DollarSign,
    title: t('home.features.earn_money.title'),
    description: t('home.features.earn_money.desc')
  },
  {
    icon: Target,
    title: t('home.features.matching.title'),
    description: t('home.features.matching.desc')
  },
  {
    icon: Brain,
    title: t('home.features.ai.title'),
    description: t('home.features.ai.desc')
  }
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();

  const handleNavigation = (path: string) => {
    console.log(`Navigate to: ${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-black dark:via-gray-950 dark:to-black transition-colors duration-300">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/80 dark:from-black/90 dark:via-gray-950/70 dark:to-black/90 transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzMzMzMzMyIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30 dark:opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative px-3 py-8 sm:px-4 sm:py-12 overflow-hidden">
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-400/20 dark:bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-600/20 dark:bg-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>

          <div className="max-w-6xl mx-auto relative">
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <div className="relative">
                    <Code className="h-6 w-6 sm:h-8 sm:w-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600" />
                    <div className="absolute inset-0 h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 blur-lg opacity-30"></div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent leading-tight">
                    AlgoBucks
                  </h1>
                </div>

                <div className="space-y-2 mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-400 dark:to-blue-500 px-2">
                    {t('home.hero.tagline')}
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 max-w-md sm:max-w-lg mx-auto px-3 leading-relaxed transition-colors duration-300">
                    {t('home.hero.subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center px-3 max-w-sm sm:max-w-md mx-auto">
                <button
                  onClick={() => handleNavigation('/problems')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg overflow-hidden shadow-xl hover:shadow-blue-500/50 dark:hover:shadow-blue-400/30 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 dark:from-blue-600 dark:to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/10 dark:bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <a href="/problems" className="relative flex items-center whitespace-nowrap">
                    {t('home.btn.start_coding')}
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </button>

                <button
                  onClick={() => handleNavigation('/contests')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-blue-800 dark:from-blue-600 dark:to-blue-700 rounded-lg overflow-hidden shadow-xl hover:shadow-blue-600/50 dark:hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-700 dark:to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 dark:bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <a href="/contests" className="relative flex items-center whitespace-nowrap">
                    <Trophy className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    {t('home.btn.join_contest')}
                  </a>
                </button>

                {!isLoading && !user && (
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 rounded-lg backdrop-blur-sm hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-100/50 dark:from-blue-950/0 dark:to-blue-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                    <span className="relative w-full h-full flex items-center justify-center whitespace-nowrap">{t('home.btn.create_account')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-3 py-6 sm:px-4 sm:py-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-gray-950/80 dark:to-black/80 backdrop-blur-sm transition-colors duration-300"></div>
          <div className="max-w-5xl mx-auto relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {stats(t).map((stat) => (
                <div
                  key={stat.label}
                  className="group text-center bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-gray-900/90 dark:to-gray-950/90 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-2 sm:p-3 hover:border-blue-400/50 dark:hover:border-blue-600/50 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all duration-300"
                >
                  <div className="text-base sm:text-lg md:text-xl font-black bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-xs font-medium leading-tight transition-colors duration-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-3 py-8 sm:px-4 sm:py-12 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
                {t('home.why.title')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md sm:max-w-lg mx-auto px-3 leading-relaxed transition-colors duration-300">
                {t('home.why.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {features(t).map((feature) => (
                <div
                  key={feature.title}
                  className="group relative bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-gray-900/95 dark:to-gray-950/95 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400/50 dark:hover:border-blue-600/50 hover:shadow-xl dark:hover:shadow-blue-900/20 transition-all duration-500 overflow-hidden"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-800/5 dark:from-blue-400/10 dark:via-transparent dark:to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-blue-400 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 dark:group-hover:from-blue-400 dark:group-hover:to-blue-500 transition-all duration-300 leading-tight">
                      {feature.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-3 py-8 sm:px-4 sm:py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-white/50 dark:from-black/50 dark:to-gray-950/50 backdrop-blur-sm transition-colors duration-300"></div>

          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
                {t('home.how.title')}
              </h2>
              <p className="text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-500 font-semibold">
                {t('home.how.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="group text-center relative">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 dark:shadow-blue-400/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-lg sm:text-xl font-black text-white">1</span>
                  </div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-blue-400 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 dark:group-hover:from-blue-400 dark:group-hover:to-blue-500 transition-all duration-300 leading-tight">
                  {t('home.how.step1.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 px-2">
                  {t('home.how.step1.desc')}
                </p>
              </div>

              <div className="group text-center relative">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-600/30 dark:shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-lg sm:text-xl font-black text-white">2</span>
                  </div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-blue-400 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 dark:group-hover:from-blue-400 dark:group-hover:to-blue-500 transition-all duration-300 leading-tight">
                  {t('home.how.step2.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 px-2">
                  {t('home.how.step2.desc')}
                </p>
              </div>

              <div className="group text-center relative">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-700 to-blue-900 dark:from-blue-600 dark:to-blue-800 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-700/30 dark:shadow-blue-600/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-lg sm:text-xl font-black text-white">3</span>
                  </div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-700 to-blue-900 dark:from-blue-600 dark:to-blue-800 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-blue-400 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 dark:group-hover:from-blue-400 dark:group-hover:to-blue-500 transition-all duration-300 leading-tight">
                  {t('home.how.step3.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 px-2">
                  {t('home.how.step3.desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-3 py-8 sm:px-4 sm:py-12 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 via-white/40 to-blue-50/60 dark:from-black/60 dark:via-gray-950/40 dark:to-black/60 transition-colors duration-300"></div>
          <div className="absolute top-0 left-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-400/20 dark:bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-600/20 dark:bg-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>

          <div className="max-w-4xl mx-auto text-center relative">
            <div className="max-w-sm sm:max-w-md md:max-w-lg mx-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
                {t('home.cta.title')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed px-2 transition-colors duration-300">
                {t('home.cta.subtitle')}
              </p>

              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-md mx-auto">
                {!isLoading && !user && (
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg overflow-hidden shadow-xl hover:shadow-blue-500/50 dark:hover:shadow-blue-400/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 dark:from-blue-600 dark:to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="relative flex items-center whitespace-nowrap">
                      <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {t('home.cta.get_started')}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => handleNavigation('/contests')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 rounded-lg backdrop-blur-sm hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-100/50 dark:from-blue-950/0 dark:to-blue-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <span className="relative whitespace-nowrap">{t('home.cta.browse_contests')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}