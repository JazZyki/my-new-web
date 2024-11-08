const { src, dest, watch, series, parallel, gulp } = require('gulp')
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'))
const ftp = require('vinyl-ftp');
const concat = require('gulp-concat')
const terser = require('gulp-terser')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const browsersync = require('browser-sync').create()

const files = {
	scssPath: 'app/scss/**/*.scss',
	jsPath: 'app/js/**/*.js',
}

const paths = {
	imagesSrc: 'app/images/**/*',
	imagesDest: 'dist/images'
}

const source = require('./gulpsource.json')

const user = 'user.name';
const password = 'password';
const host = 'host.server';
const port = 21; // FTP port (default is 21)
const remoteFolder = 'someName'; // Remote path where you want to upload files

function gulpScss() {
	return src(files.scssPath, { sourcemaps: true })
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(concat('style.css'))
		.pipe(postcss([autoprefixer(), cssnano()]))
		.pipe(sourcemaps.write('.'))
		.pipe(dest('dist'))
}

function gulpJs() {
	return src(files.jsPath, { sourcemaps: true })
		.pipe(concat('all.js'))
		.pipe(terser())
		.pipe(dest('dist'))
}

function copyImages() {
	return src(paths.imagesSrc)
		.pipe(dest(paths.imagesDest));
}
function ftpUpload() {
	let conn = ftp.create({
		host: host,
		port: port,
		user: user,
		password: password,
		parallel: 5, // Number of parallel uploads
		log: gutil.log // Optional: For logging
	});

	return src('dist/**/*') // Adjust the source folder as needed
		.pipe(conn.newer(remoteFolder)) // Only upload newer files
		.pipe(conn.dest(remoteFolder));
}

// Export the FTP upload task
exports.ftpUpload = ftpUpload;

function watchTask() {
	watch(
		[files.scssPath, files.jsPath],
		{ interval: 1000, usePolling: true },
		series(parallel(gulpScss, gulpJs), ftpUpload)
	)
}

exports.default = series(parallel(gulpScss, gulpJs, copyImages), ftpUpload, watchTask)
