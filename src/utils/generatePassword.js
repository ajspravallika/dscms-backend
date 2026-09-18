function generateTempPassword(length = 10) {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%';
  const all = upper + lower + digits + symbols;
  let pwd = upper[Math.floor(Math.random()*upper.length)] + lower[Math.floor(Math.random()*lower.length)] + digits[Math.floor(Math.random()*digits.length)] + symbols[Math.floor(Math.random()*symbols.length)];
  for (let i = 4; i < length; i++) pwd += all[Math.floor(Math.random()*all.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}
module.exports = generateTempPassword;