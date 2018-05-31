"use strict";
const meow = require("meow");
const importJsx = require("import-jsx");
const { h, render } = require("ink");

const ui = importJsx("./ui");

const main = () => {
  let unmount;

  const onError = () => {
    unmount();
    process.exit(1);
  };

  const onExit = () => {
    unmount();
    process.exit();
  };

  unmount = render(h(ui, { onError, onExit }));
};

main();
