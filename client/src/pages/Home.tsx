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
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-black dark:via-gray-950 dark:to-green-950 transition-colors duration-300">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/90 via-sky-50/80 to-sky-100/90 dark:from-black/95 dark:via-gray-950/85 dark:to-green-950/90 transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzMzMzMzMyIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20 dark:opacity-10"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative px-2 py-6 sm:px-3 sm:py-8 md:px-4 md:py-10 overflow-hidden">
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-sky-300/30 dark:bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-sky-500/20 dark:bg-green-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>

          <div className="max-w-6xl mx-auto relative">
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-2 sm:mb-3">
                  <div className="relative">
                    <Code className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-800 dark:from-green-400 dark:to-green-600" />
                    <div className="absolute inset-0 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 bg-gradient-to-r from-sky-600 to-sky-800 dark:from-green-400 dark:to-green-600 blur-lg opacity-30"></div>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-sky-600 via-sky-700 to-sky-900 dark:from-green-400 dark:via-green-500 dark:to-green-600 bg-clip-text text-transparent leading-tight">
                    EarnByCode
                  </h1>
                </div>

                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 md:mb-5">
                  <p className="text-xs sm:text-sm md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-700 to-sky-900 dark:from-green-400 dark:to-green-500 px-1 sm:px-2">
                    {t('home.hero.tagline')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-green-200 max-w-xs sm:max-w-sm md:max-w-md mx-auto px-2 sm:px-3 leading-relaxed transition-colors duration-300">
                    {t('home.hero.subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center px-2 sm:px-3 max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                <button
                  onClick={() => handleNavigation('/problems')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-sky-700 dark:from-green-500 dark:to-green-600 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/40 dark:hover:shadow-green-400/30 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-700 to-sky-800 dark:from-green-600 dark:to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/15 dark:bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <a href="/problems" className="relative flex items-center whitespace-nowrap">
                    {t('home.btn.start_coding')}
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </button>

                <button
                  onClick={() => handleNavigation('/contests')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-700 to-sky-800 dark:from-green-600 dark:to-green-700 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-600/40 dark:hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-800 to-sky-900 dark:from-green-700 dark:to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/15 dark:bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <a href="/contests" className="relative flex items-center whitespace-nowrap">
                    <Trophy className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    {t('home.btn.join_contest')}
                  </a>
                </button>

                {!isLoading && !user && (
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-bold text-sky-700 dark:text-green-400 border border-sky-300 dark:border-green-700 bg-white/70 dark:bg-green-950/40 rounded-lg backdrop-blur-sm hover:border-sky-500 dark:hover:border-green-600 hover:bg-sky-50/80 dark:hover:bg-green-900/50 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-sky-100/60 dark:from-green-950/0 dark:to-green-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                    <span className="relative w-full h-full flex items-center justify-center whitespace-nowrap">{t('home.btn.create_account')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-2 py-4 sm:px-3 sm:py-6 md:px-4 md:py-7 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-sky-50/90 dark:from-gray-950/90 dark:to-green-950/90 backdrop-blur-sm transition-colors duration-300"></div>
          <div className="max-w-5xl mx-auto relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
              {stats(t).map((stat) => (
                <div
                  key={stat.label}
                  className="group text-center bg-gradient-to-br from-white/95 to-sky-50/95 dark:from-gray-900/95 dark:to-green-950/95 backdrop-blur-sm border border-sky-200/60 dark:border-green-800/60 rounded-lg p-2 sm:p-3 hover:border-sky-400/60 dark:hover:border-green-600/60 hover:shadow-lg dark:hover:shadow-green-900/20 transition-all duration-300"
                >
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-black bg-gradient-to-r from-sky-600 to-sky-800 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-green-300 text-xs font-medium leading-tight transition-colors duration-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-2 py-6 sm:px-3 sm:py-8 md:px-4 md:py-10 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black bg-gradient-to-r from-gray-800 via-sky-700 to-sky-900 dark:from-green-400 dark:via-green-500 dark:to-green-600 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight">
                {t('home.why.title')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-green-300 max-w-xs sm:max-w-sm md:max-w-md mx-auto px-2 sm:px-3 leading-relaxed transition-colors duration-300">
                {t('home.why.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {features(t).map((feature) => (
                <div
                  key={feature.title}
                  className="group relative bg-gradient-to-br from-white/95 to-sky-50/95 dark:from-gray-900/95 dark:to-green-950/95 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-lg border border-sky-200/60 dark:border-green-800/60 hover:border-sky-400/60 dark:hover:border-green-600/60 hover:shadow-xl dark:hover:shadow-green-900/20 transition-all duration-500 overflow-hidden"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-600/5 via-transparent to-sky-800/5 dark:from-green-400/10 dark:via-transparent dark:to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-sky-500 to-sky-700 dark:from-green-400 dark:to-green-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <feature.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                    </div>

                    <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 dark:text-green-400 mb-1 sm:mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-sky-800 dark:group-hover:from-green-400 dark:group-hover:to-green-500 transition-all duration-300 leading-tight">
                      {feature.title}
                    </h3>

                    <p className="text-gray-600 dark:text-green-300 text-xs leading-relaxed group-hover:text-gray-700 dark:group-hover:text-green-200 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-2 py-6 sm:px-3 sm:py-8 md:px-4 md:py-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/60 to-white/60 dark:from-black/60 dark:to-green-950/60 backdrop-blur-sm transition-colors duration-300"></div>

          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black bg-gradient-to-r from-gray-800 via-sky-700 to-sky-900 dark:from-green-400 dark:via-green-500 dark:to-green-600 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight">
                {t('home.how.title')}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-800 dark:from-green-400 dark:to-green-500 font-semibold">
                {t('home.how.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="group text-center relative">
                <div className="relative mb-3 sm:mb-4 md:mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-sky-500 to-sky-700 dark:from-green-400 dark:to-green-600 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-sky-500/30 dark:shadow-green-400/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-base sm:text-lg md:text-xl font-black text-white">1</span>
                  </div>
                  <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-sky-500 to-sky-700 dark:from-green-400 dark:to-green-600 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 dark:text-green-400 mb-1 sm:mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-sky-800 dark:group-hover:from-green-400 dark:group-hover:to-green-500 transition-all duration-300 leading-tight">
                  {t('home.how.step1.title')}
                </h3>
                <p className="text-gray-600 dark:text-green-300 text-xs leading-relaxed group-hover:text-gray-700 dark:group-hover:text-green-200 transition-colors duration-300 px-1 sm:px-2">
                  {t('home.how.step1.desc')}
                </p>
              </div>

              <div className="group text-center relative">
                <div className="relative mb-3 sm:mb-4 md:mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-sky-600 to-sky-800 dark:from-green-500 dark:to-green-700 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-sky-600/30 dark:shadow-green-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-base sm:text-lg md:text-xl font-black text-white">2</span>
                  </div>
                  <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-sky-600 to-sky-800 dark:from-green-500 dark:to-green-700 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 dark:text-green-400 mb-1 sm:mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-sky-800 dark:group-hover:from-green-400 dark:group-hover:to-green-500 transition-all duration-300 leading-tight">
                  {t('home.how.step2.title')}
                </h3>
                <p className="text-gray-600 dark:text-green-300 text-xs leading-relaxed group-hover:text-gray-700 dark:group-hover:text-green-200 transition-colors duration-300 px-1 sm:px-2">
                  {t('home.how.step2.desc')}
                </p>
              </div>

              <div className="group text-center relative">
                <div className="relative mb-3 sm:mb-4 md:mb-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-sky-700 to-sky-900 dark:from-green-600 dark:to-green-800 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-sky-700/30 dark:shadow-green-600/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-base sm:text-lg md:text-xl font-black text-white">3</span>
                  </div>
                  <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-sky-700 to-sky-900 dark:from-green-600 dark:to-green-800 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 dark:text-green-400 mb-1 sm:mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-sky-800 dark:group-hover:from-green-400 dark:group-hover:to-green-500 transition-all duration-300 leading-tight">
                  {t('home.how.step3.title')}
                </h3>
                <p className="text-gray-600 dark:text-green-300 text-xs leading-relaxed group-hover:text-gray-700 dark:group-hover:text-green-200 transition-colors duration-300 px-1 sm:px-2">
                  {t('home.how.step3.desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-2 py-6 sm:px-3 sm:py-8 md:px-4 md:py-10 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-100/70 via-white/50 to-sky-50/70 dark:from-black/70 dark:via-green-950/50 dark:to-black/70 transition-colors duration-300"></div>
          <div className="absolute top-0 left-1/4 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-sky-400/20 dark:bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-sky-600/20 dark:bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>

          <div className="max-w-4xl mx-auto text-center relative">
            <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black bg-gradient-to-r from-gray-800 via-sky-700 to-sky-900 dark:from-green-400 dark:via-green-500 dark:to-green-600 bg-clip-text text-transparent mb-3 sm:mb-4 md:mb-5 leading-tight">
                {t('home.cta.title')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-green-300 mb-4 sm:mb-6 md:mb-7 leading-relaxed px-1 sm:px-2 transition-colors duration-300">
                {t('home.cta.subtitle')}
              </p>

              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 md:gap-4 justify-center max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                {!isLoading && !user && (
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-sky-700 dark:from-green-500 dark:to-green-600 rounded-lg overflow-hidden shadow-xl hover:shadow-sky-500/50 dark:hover:shadow-green-400/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-700 to-sky-800 dark:from-green-600 dark:to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="relative flex items-center whitespace-nowrap">
                      <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {t('home.cta.get_started')}
                    </span>
                  </button>
                )}

              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}