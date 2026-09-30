export const softEase = [0.22, 1, 0.36, 1] as const;

export const enterTransition = {
  duration: 0.28,
  ease: softEase,
};

export const popTransition = {
  duration: 0.2,
  ease: softEase,
};
