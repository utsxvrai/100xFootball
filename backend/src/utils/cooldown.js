function calculateCooldownMinutes(overall) {
  if (overall >= 90) return 1;
  if (overall >= 80) return 3;
  if (overall >= 70) return 5;
  if (overall >= 60) return 7;
  return 9;
}

module.exports = { calculateCooldownMinutes };
