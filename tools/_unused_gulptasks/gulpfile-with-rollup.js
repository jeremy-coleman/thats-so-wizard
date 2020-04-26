var path = require('path')
var cp = require('child_process')
var gulp = require("gulp");
var del = require("del");
var babel = require("gulp-babel");
var clip = require('gulp-clip-empty-files')
var typescript = require("gulp-typescript");
var rollup = require("./tools/gulptasks/gulp-rollup");
var closure = require('@ampproject/rollup-plugin-closure-compiler')
const {terser} = require('rollup-plugin-terser')

var createTsCompiler = config => {
  const ts_instance = typescript.createProject("tsconfig.json", config || {});
  return ts_instance();
};

async function spawnBin(v) {
  const {spawn} = require('child_process')
  const resolveBinFilePath = (binCommand) => {
    const cmd = process.platform === "win32" ? `${binCommand}.cmd` : binCommand;
    return path.resolve(__dirname, "node_modules", ".bin", cmd);
  };
  spawn(resolveBinFilePath(v), ["app/app/index.html"])
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

gulp.task("babel", () => gulp.src("src/**/*.{ts,tsx,jsx,js}")
    .pipe(babel())
    .pipe(clip())
    .pipe(gulp.dest("app"))
);

gulp.task("media", () => gulp.src("src/**/*.{html,svg,png}")
    .pipe(clip())
    .pipe(gulp.dest("app"))
);

gulp.task('watch', () => {
    gulp.watch("src/**/*.{ts,tsx,jsx,js}", gulp.series("babel"))
    gulp.watch("src/**/*.{html,svg,png}", gulp.series("media"))
})



//gulp.task("dev", gulp.series(gulp.parallel("babel","media"), gulp.parallel("watch", "parcel")))

gulp.task("rollit", function () {
  return (
    gulp.src(["./src/**/*{.js,.jsx,.ts,.tsx}"])
      .pipe(babel())
      .pipe(
        rollup({
          input: "src/app/app.js",
          output: {
            format: "esm",
            dir: "dist"
          },
          external: Object.keys(require("./package.json").dependencies),
          treeshake: {
            moduleSideEffects: false
          },
          inlineDynamicImports: true,
          plugins: [
            terser(),
            closure()
          ]
        })
      )
      .pipe(gulp.dest("dist"))
  );
});


gulp.task("refactor", function () {
  return (
    gulp.src(["./temp/**/*{.js,.jsx,.ts,.tsx}"])
      //.pipe(babel())
      .pipe(
        rollup({
          input: "temp/export.js",
          output: {
            format: "esm",
            dir: "dist"
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
      .pipe(gulp.dest("temp/_updated"))
  );
});




gulp.task("tszz", () => gulp.src("./streams.ts")
    .pipe(
      createTsCompiler({
        module: "esnext",
        isolatedModules: true,
        incremental: true,
        removeComments: true,
        noResolve: true,
      })
    )
    //.pipe(babel())
    .pipe(gulp.dest("temp"))
);