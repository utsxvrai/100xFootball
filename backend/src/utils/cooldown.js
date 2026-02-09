function calculateCooldownMinutes(overall) {
  if (overall >= 90) return 1;
  if (overall >= 80) return 2;
  if (overall >= 70) return 3;
  if (overall >= 60) return 4;
  return 5;
}

module.exports = { calculateCooldownMinutes };
