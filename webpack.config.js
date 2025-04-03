const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    content_script: './content-script.js',
    background: './background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
  },
  target: 'web',
};
