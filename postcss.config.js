var purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
    plugins: [
        require('postcss-easy-import')(),
        require('postcss-svgo')(),
        //purgecss({content: ['./src/**/*.html', './src/**/*.tsx', './src/**/*.ts', './src/**/*.hbs', './src/**/*.js']}),
        require('postcss-csso')({ restructure: true }),
        require('postcss-discard-duplicates'),
    ]
};
