const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    content_script: './src/content/content-script.js',
    background: './src/background/background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
  },
  target: 'web',
  resolve: {
    extensions: ['.js'],
    alias: {
      '@components': path.resolve(__dirname, 'src/components/'),
      '@managers': path.resolve(__dirname, 'src/managers/'),
      '@utils': path.resolve(__dirname, 'src/utils/'),
      '@content': path.resolve(__dirname, 'src/content/'),
      '@config': path.resolve(__dirname, 'src/config/'),
    }
  },
};
