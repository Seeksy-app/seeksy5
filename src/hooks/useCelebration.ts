import confetti from 'canvas-confetti';

const motivationalQuotes = [
  "🔥 Another one booked!",
  "💪 You're on fire today!",
  "🚀 Keep that momentum going!",
  "⭐ Crushing it!",
  "🎯 Bullseye! Great work!",
  "💰 Money moves!",
  "🏆 Champion status!",
  "⚡ Lightning fast!",
  "🌟 Star performer!",
  "🎉 Let's gooo!"
];

export const useCelebration = () => {
  const triggerConfetti = () => {
    // Fire confetti from both sides
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.7 },
    });

    fire(0.2, {
      spread: 60,
      origin: { x: 0.5, y: 0.7 },
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      origin: { x: 0.8, y: 0.7 },
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.6 },
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.7 },
    });
  };

  const getRandomQuote = () => {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  };

  const celebrate = () => {
    triggerConfetti();
    return getRandomQuote();
  };

  return { celebrate, triggerConfetti, getRandomQuote };
};
