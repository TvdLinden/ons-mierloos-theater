/** @type {import('prettier').Options} */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  tabWidth: 2,
  printWidth: 100,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: [],
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
  ],
};
