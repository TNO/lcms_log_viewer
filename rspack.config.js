const path = require('path');
const devMode = process.env.NODE_ENV === 'development';
const outputPath = path.resolve(__dirname, devMode ? 'dist' : 'docs');

console.log(`Working in ${devMode ? 'development' : 'production'} mode.`);

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: {
    main: './src/app.ts',
    'pdf.worker': 'pdfjs-dist/build/pdf.worker.entry',
  },
  devServer: {
    port: 1234,
  },
  builtins: {
    define: {
      'process.env.NODE_ENV': "'development'",
      // API_SERVER: devMode ? "'http://localhost:4000'" : undefined,
    },
    html: [
      {
        title: 'LCMS Log Viewer (LLV)',
        publicPath: devMode ? undefined : undefined,
        scriptLoading: 'defer',
        minify: !devMode,
        favicon: './src/favicon.ico',
        meta: {
          viewport: 'width=device-width, initial-scale=1',
          'og:title': 'LCMS Log Viewer',
          'og:description': 'Laad je LCMS log en ervaar de crisis opnieuw.',
          'og:url': 'https://github.com/TNO/lcms_log_viewer',
          'og:site_name': 'LCMS Log Viewer',
          'og:image:alt': 'LCMS Log Viewer',
          'og:image': './src/assets/logo.svg',
          'og:image:type': 'image/svg',
          'og:image:width': '200',
          'og:image:height': '200',
        },
      },
    ],
    minifyOptions: devMode
      ? undefined
      : {
          passes: 3,
          dropConsole: false,
        },
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /^BUILD_ID$/,
        type: 'asset/source',
      },
    ],
  },
  output: {
    publicPath: devMode ? undefined : 'https://tno.github.io/lcms_log_viewer/',
    filename: '[name].js',
    path: outputPath,
  },
};
