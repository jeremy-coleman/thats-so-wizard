var gulp = require("gulp");
var fs = require("fs");
const { builtinModules } = require("module");
var del = require("del");
var jetpack = require('fs-jetpack')

var postcss = require("gulp-postcss");
var concat = require("gulp-concat");
var sass = require("gulp-sass");
var merge = require("merge-stream");
var less = require("gulp-less");
var stylus = require("gulp-stylus");
var babel = require("gulp-babel");
var typescript = require("gulp-typescript");
var rollup = require("./gulp-rollup");

var createTsCompiler = config => {
  const ts_instance = typescript.createProject("tsconfig.json", config || {});
  return ts_instance();
};

function getFileSize(filePath) {
  var size = fs.statSync(filePath).size;
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Number(Math.pow(1024, i))).toFixed(2) +
    " " +
    ["B", "KB", "MB", "GB", "TB"][i]
  );
}

function clean(done) {
  del(["dist"]);
  done;
}

gulp.task("clean:dist", clean);

gulp.task("tsc", () => gulp.src("src/**/*.{ts,tsx,jsx,js}")
    .pipe(
      createTsCompiler({
        module: "esnext",
        isolatedModules: true,
        incremental: true,
        removeComments: true,
        noResolve: true,
      })
    )
    .pipe(babel())
    .pipe(gulp.dest("app"))
);

gulp.task("rollit", function () {
  return (
    gulp
      .src(["./src/**/*{.js,.jsx,.ts,.tsx}"])
      .pipe(
        createTsCompiler({
          module: "esnext",
          isolatedModules: true,
          incremental: true,
          removeComments: true
        })
      )
      .pipe(babel())
      .pipe(
        rollup({
          input: "src/app/app.js",
          output: {
            format: "esm"
          },
          external: Object.keys(require("./package.json").dependencies),
          treeshake: {
            moduleSideEffects: false
          },
          inlineDynamicImports: true,
          plugins: [
            //terser(),
            //closure()

          ]
        })
      )
      .pipe(gulp.dest("dist"))
  );
});

gulp.task("postcss", async () => {
  var stylusStream = gulp
    .src(["src/**/*.styl"])
    .pipe(concat("stylus-temp.styl"))
    .pipe(stylus())
    .pipe(postcss());

  var lessStream = gulp
    .src(["src/**/*.less"])
    .pipe(concat("less-temp.less"))
    .pipe(less())
    .pipe(postcss());

  var scssStream = gulp
    .src(["src/**/*.scss", "src/**/*.sass"])
    .pipe(sass({ outputStyle: "compressed" }))
    .on("error", sass.logError)
    .pipe(postcss());

  var cssStream = gulp.src("./src/**/*.css").pipe(postcss());

  return merge(stylusStream, lessStream, scssStream, cssStream)
    .pipe(concat("styles.min.css"))
    .pipe(postcss())
    .pipe(gulp.dest("dist/client"));
  //.pipe(livereload());
});

async function writeEslintRules(){
  var ruleObject = {}
  const allEslintRules = require('all-eslint-rules');
  const rules = Array.from(allEslintRules())
  rules.forEach(rule => {
    ruleObject[rule] = 0
  })
  jetpack.write("rules.json", ruleObject)
}

gulp.task("write-eslint-rules", writeEslintRules)