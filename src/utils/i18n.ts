export type Language = 'en' | 'es';

export const getBrowserLanguage = (): Language => {
  const lang = navigator.language || navigator.languages[0];
  return lang.startsWith('es') ? 'es' : 'en';
};

export const translations = {
  en: {
    title: "Sponsor Verification",
    pausedTitle: "Verification Paused",
    verifyingTitle: "Verifying View...",
    successTitle: "Thank You!",
    successMessage: "You can now proceed to your destination.",
    
    step1: "Click the button below to open the advertisement.",
    step2: "Keep the advertisement tab open and active.",
    step3: "Return to this tab after the timer completes.",
    
    statusNotStarted: "Please view our sponsor's advertisement to unlock your content.",
    statusPaused: "Please return to the advertisement tab to continue the timer.",
    statusVerifying: "Great! Keep the ad open for a few more seconds...",
    
    btnOpen: "Open Advertisement",
    btnReopen: "Ad didn't open? Open again",
    btnContinue: "Continue to Destination",
    
    footer: "We use ad revenue to keep this service free. Thank you for your support!",
    remaining: "remaining",
    wait: "Wait"
  },
  es: {
    title: "Verificación del Patrocinador",
    pausedTitle: "Verificación Pausada",
    verifyingTitle: "Verificando Visualización...",
    successTitle: "¡Gracias!",
    successMessage: "Ahora puedes continuar a tu destino.",
    
    step1: "Haz clic en el botón de abajo para abrir el anuncio.",
    step2: "Mantén la pestaña del anuncio abierta y activa.",
    step3: "Regresa a esta pestaña cuando termine el temporizador.",
    
    statusNotStarted: "Por favor, mira el anuncio de nuestro patrocinador para desbloquear tu contenido.",
    statusPaused: "Por favor, regresa a la pestaña del anuncio para continuar el temporizador.",
    statusVerifying: "¡Genial! Mantén el anuncio abierto unos segundos más...",
    
    btnOpen: "Abrir Anuncio",
    btnReopen: "¿No abrió? Abrir de nuevo",
    btnContinue: "Continuar al Destino",
    
    footer: "Usamos los ingresos publicitarios para mantener este servicio gratuito. ¡Gracias por tu apoyo!",
    remaining: "restantes",
    wait: "Espera"
  }
};
