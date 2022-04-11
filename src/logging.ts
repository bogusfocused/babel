import chalkTemplate from "chalk-template";
import chalk from "chalk";
// TODO: remove node reference
import util from "node:util";
export default {
  error: (message?: any, ...optionalParams: any[]) => {
    console.error(
      chalkTemplate`{red ${util.format(message, ...optionalParams)}}`
    );
  },
  debug: (message?: any, ...optionalParams: any[]) => {
    console.log(
      chalkTemplate`{yellow ${util.format(message, ...optionalParams)}}`
    );
  },
};
