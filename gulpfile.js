const gulp = {
    'gulp': require('gulp'),
    'gulp-sass': require('gulp-sass'),
    'gulp-sass-glob': require('gulp-sass-glob'),
    'gulp-postcss': {
        'gulp-postcss': require('gulp-postcss'),
        'postcss-css-variables': require('postcss-css-variables'),
        'postcss-calc': require('postcss-calc')
    },
    'autoprefixer': require('autoprefixer'),
    'gulp-concat': require('gulp-concat'),
    'gulp-rename': require('gulp-rename'),
    'gulp-uglify': require('gulp-uglify'),
    'gulp-livereload': require('gulp-livereload'),
    'gulp-browserify': require('gulp-browserify')
}

gulp['gulp-sass'].compiler = require('node-sass');

const nodemon = require('nodemon');

const js = [
    'utils/js',
    {
        utils: 'utils/js/utils/*.js',
        modules: 'utils/js/modules/*.js',
        dir: 'utils/js/.dir'
    }
]

const scss = [
    'utils/scss',
    {
        utils: 'utils/scss/**/*.scss',
        modules: 'utils/scss/**/*.scss',
        dir: 'utils/scss/.dir'
    }
]

gulp.gulp.task('scss', () => {
    return gulp.gulp.src([scss[1].utils, scss[1].modules])
        .pipe(gulp['gulp-sass-glob']())
        .pipe(gulp['gulp-sass']({
            outputStyle: 'compressed'
        }).on('error', gulp['gulp-sass'].logError))
        .pipe(gulp['gulp-postcss']['gulp-postcss']([gulp.autoprefixer()]))
        .pipe(gulp['gulp-rename']('~css.css'))
        .pipe(gulp.gulp.dest(scss[1].dir))
        .pipe(gulp['gulp-livereload']())
        .pipe(gulp['gulp-rename']('~css.min.css'))
        .pipe(gulp['gulp-postcss']['gulp-postcss']([gulp['gulp-postcss']['postcss-css-variables'](), gulp['gulp-postcss']['postcss-calc']()]))
        .pipe(gulp.gulp.dest(scss[1].dir));
});

gulp.gulp.task('js', () => {
    return gulp.gulp.src([js[1].utils, js[1].modules])
        /*.pipe(browserify({
            transform: ['babelify'],
            insertGlobals: true,
        }))*/
        .pipe(gulp['gulp-concat']('~js.js'))
        .pipe(gulp.gulp.dest(js[1].dir))
        .pipe(gulp['gulp-livereload']())
        .pipe(gulp['gulp-rename']('~js.min.js'))
        .pipe(gulp['gulp-uglify']())
        .pipe(gulp.gulp.dest(js[1].dir))
        .pipe(gulp['gulp-livereload']());
});

gulp.gulp.task('watch', gulp.gulp.series(['scss', 'js'], () => {
    gulp['gulp-livereload'].listen();

    nodemon({
        script: 'Mooonys.js',
        stdout: true
    }).on('readable', () => {
        this.stdout.on('data', (chunk) => {
            if (/^listening/.test(chunk)) {
                gulp['gulp-livereload'].reload();
            }

            process.stdout.write(chunk);
        });
    });

    gulp.gulp.watch([scss[1].utils, scss[1].modules], gulp.gulp.series(['scss']));
    gulp.gulp.watch([js[1].utils, js[1].modules], gulp.gulp.series(['js']));
}));