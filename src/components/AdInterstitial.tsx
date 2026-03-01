import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Clock, AlertTriangle, CheckCircle, RotateCcw, Play, ListOrdered } from 'lucide-react';
import { getBrowserLanguage, translations } from '../utils/i18n';

interface AdInterstitialProps {
  adUrl: string;
  duration: number;
  onClose: () => void;
  title?: string;
  forceNewTab?: boolean; // Kept for compatibility but ignored as we force all now
}

export function AdInterstitial({ adUrl, duration, onClose, title = "Advertisement" }: AdInterstitialProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [adOpened, setAdOpened] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const lastHiddenTime = useRef<number | null>(null);
  
  // Language handling
  const langCode = getBrowserLanguage();
  const t = translations[langCode];

  // Track visibility/focus to count down time only when user is "away" (viewing ad)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsTabActive(!hidden);

      if (hidden) {
        // User left the tab (presumably to view ad)
        lastHiddenTime.current = Date.now();
      } else {
        // User returned
        if (lastHiddenTime.current && adOpened && timeLeft > 0) {
          const delta = (Date.now() - lastHiddenTime.current) / 1000;
          setTimeLeft((prev) => Math.max(0, prev - delta));
          lastHiddenTime.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [adOpened, timeLeft]);

  // Interval timer that runs only when tab is hidden (for side-by-side windows or background throttling mitigation)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (adOpened && !isTabActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adOpened, isTabActive, timeLeft]);

  const handleOpenAd = () => {
    window.open(adUrl, '_blank');
    setAdOpened(true);
  };

  const isComplete = timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-300 uppercase tracking-wider border-l-4 border-blue-500 pl-3">
            {title}
          </span>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-4">
          {!isComplete && (
            <div className="flex items-center gap-2 text-sm font-mono bg-gray-900/50 px-3 py-1.5 rounded-md border border-gray-700">
              <Clock className={`w-4 h-4 ${isTabActive ? 'text-yellow-500' : 'text-green-500 animate-pulse'}`} />
              <span className={isTabActive ? 'text-gray-400' : 'text-white'}>
                {Math.ceil(timeLeft)}s {t.remaining}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-gray-900 to-gray-800 overflow-y-auto">
        
        <div className="max-w-lg w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
          
          {/* State: Completed */}
          {isComplete ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{t.successTitle}</h2>
              <p className="text-gray-400 mb-8">{t.successMessage}</p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {t.btnContinue} <Play className="w-5 h-5 fill-current" />
              </motion.button>
            </motion.div>
          ) : (
            /* State: In Progress or Not Started */
            <div className="flex flex-col items-center">
              
              {/* Icon State */}
              <div className="mb-6 relative">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${
                  adOpened 
                    ? (isTabActive ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-blue-500/30 bg-blue-500/10')
                    : 'border-blue-500/30 bg-blue-500/10'
                }`}>
                  {adOpened && isTabActive ? (
                    <AlertTriangle className="w-10 h-10 text-yellow-500" />
                  ) : (
                    <ExternalLink className="w-10 h-10 text-blue-500" />
                  )}
                </div>
                {adOpened && !isTabActive && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                    Viewing
                  </div>
                )}
              </div>

              {/* Text State */}
              <h2 className="text-2xl font-bold text-white mb-3">
                {adOpened 
                  ? (isTabActive ? t.pausedTitle : t.verifyingTitle) 
                  : t.title}
              </h2>
              
              <p className="text-gray-400 mb-6 min-h-[3rem]">
                {!adOpened && t.statusNotStarted}
                {adOpened && isTabActive && t.statusPaused}
                {adOpened && !isTabActive && t.statusVerifying}
              </p>

              {/* Procedure Steps (Only shown when not started) */}
              {!adOpened && (
                <div className="w-full bg-gray-900/40 rounded-xl p-4 mb-6 text-left border border-gray-700/50">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">1</div>
                      <p className="text-sm text-gray-300">{t.step1}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">2</div>
                      <p className="text-sm text-gray-300">{t.step2.replace('X', duration.toString())}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">3</div>
                      <p className="text-sm text-gray-300">{t.step3}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!adOpened ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenAd}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  {t.btnOpen} <ExternalLink className="w-5 h-5" />
                </motion.button>
              ) : (
                <div className="w-full space-y-4">
                  {isTabActive && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOpenAd}
                      className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all border border-gray-600"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {t.btnReopen}
                    </motion.button>
                  )}
                  
                  <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <p className="mt-8 text-xs text-gray-600 max-w-sm">
          {t.footer}
        </p>
      </div>
    </div>
  );
}
