// confetti.ts - Tiện ích bắn pháo giấy chúc mừng hoàn thành thử thách
import confetti from 'canvas-confetti';

/**
 * Bắn loạt pháo giấy nhiều màu sắc rực rỡ, pháo hoa nổ hai bên và từ giữa màn hình.
 */
export function fireCelebrationConfetti() {
  // Đợt 1: Bắn pháo hoa rực rỡ từ hai bên mép dưới màn hình (Cannons)
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

  // Chùm pháo phối hợp nhiều góc và độ bung
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#10B981', '#06B6D4', '#F59E0B', '#EF4444', '#8B5CF6'],
  });

  fire(0.2, {
    spread: 60,
    colors: ['#FFD700', '#FF69B4', '#00CED1', '#32CD32', '#FF4500'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.9,
    colors: ['#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A78BFA'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    shapes: ['star', 'circle'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#FFD700', '#FFA500', '#10B981'],
  });

  // Đợt 2: Hiệu ứng pháo rơi 2 bên góc trái và phải sau 250ms
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      zIndex: 9999,
      colors: ['#34D399', '#38BDF8', '#FBBF24', '#F43F5E'],
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      zIndex: 9999,
      colors: ['#34D399', '#38BDF8', '#FBBF24', '#F43F5E'],
    });
  }, 250);

  // Đợt 3: Mưa pháo giấy rơi chậm nhẹ từ đỉnh màn hình sau 600ms
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 160,
      origin: { x: 0.5, y: 0.2 },
      startVelocity: 30,
      gravity: 0.8,
      ticks: 350,
      zIndex: 9999,
      colors: ['#FBBF24', '#10B981', '#06B6D4', '#EC4899', '#8B5CF6'],
      scalar: 1.1,
    });
  }, 600);
}
