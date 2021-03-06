module.exports = {
  entry: {
    main: './index.js',
  },
  mode: 'development',
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [[
            "@babel/plugin-transform-react-jsx",
            {pragma: "ToyReact.createElement"}
          ]]
        }
      }
    }]
  },
  optimization: {
    minimize: false,
  }
}