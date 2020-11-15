const { Command } = require('commander');
const envinfo = require('envinfo');
const chalk = require('chalk');
const semver = require('semver');
const path = require('path');
const fs = require('fs-extra');
const spawn = require('cross-spawn');
const os = require('os');

let projectName;
function init() {
  const program = new Command();
  program.version('0.0.1');
  program
  .option('-d, --debug', 'output extra debugging')
  .option('-p, --pizza-type <type>', 'flavour of pizza')
  .option('-i, --info', 'Print environment information')

  program
    .arguments('<project-directory>')
    .action(function (projectDirectory) {
      console.log('projectDirectory', projectDirectory);
      projectName = projectDirectory;
    });

  program.parse(process.argv);

  if (program.info) {
    console.log(chalk.bold('Printing additional environment information'));
    console.log(chalk.green(`\n Current version of program is ${program.version()}`))

    return envinfo.run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Browsers: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Internet Explorer'],
        npmPackages: ['react'],
        npmGlobalPackages: ['create-saasify-app']
      }
    ).then(console.log)
  }

  const isNodeVersionValid = verifyNodeVersion();
  if (!isNodeVersionValid) {
    return;
  }

  createSaasifyApp();
}

function verifyNodeVersion() {
  console.log('process.version', process.version);

  const isNodeVersionGreaterThan10 = semver.satisfies(process.version, '>=10');
  console.log('isNodeVersionGreaterThan10', isNodeVersionGreaterThan10);
  if (!isNodeVersionGreaterThan10) {
    console.log(chalk.red(`You are using Node version ${process.version} which is unsupported`));
    console.log(chalk.red(`Please upgrade to atleast version 10`));
    return false;
  }
  return true;

}

function createSaasifyApp() {
  // Step 1: Create project directory
  const root = path.resolve(projectName);
  fs.ensureDirSync(root);

  const appName = path.basename(root);

  const currentDirectory = process.cwd();
  process.chdir(root);

  // Step 2: Create a basic package.json file
  const packageJson = {
    name: appName,
    private: true
  }

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  )


  // Step 3: Install the template npm package
  const templatePackageName = 'file:../saasify-template-bronze/saasify-template-bronze-1.0.0.tgz';
  const templatePackagePath = templatePackageName.split('file:')[1];
  const fullPathToTemplate = path.resolve(currentDirectory, templatePackagePath);
  console.log('fullPathToTemplate', fullPathToTemplate);
  const templatePackageToInstall = `file:${fullPathToTemplate}`;
  const status = installPackage(templatePackageToInstall);
  if (status != 0) {
    // Error
    console.log('An error occurred during template install');
  }

  // Step 4: Copy all files from template into destination directory
  const pathToTemplate = require.resolve('saasify-template-bronze/package.json', { paths: [root] });
  console.log('pathToTemplate', pathToTemplate);

  const saasifyTemplateBronzeDirName = path.dirname(pathToTemplate);
  const saasifyTemplateBronzeTemplateDirName = path.join(saasifyTemplateBronzeDirName, 'template')
  
  if (fs.existsSync(saasifyTemplateBronzeTemplateDirName)) {
    fs.copySync(saasifyTemplateBronzeTemplateDirName, root);
  }

  // Step 5: Merge template.json and package.json

  const templateDotJson = path.join(saasifyTemplateBronzeDirName, 'template.json');
  const templateJson = require(templateDotJson);
  console.log('templateJson', templateJson);

  const packageDotJson = path.join(root, 'package.json');
  const packageJson2 = require(packageDotJson);
  console.log('packageJson2', packageJson2);

  packageJson2.scripts = Object.assign(packageJson2.scripts || {}, templateJson.scripts || {});
  packageJson2.dependencies = Object.assign(packageJson2.dependencies || {}, templateJson.dependencies || {});

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson2, null, 2) + os.EOL
  )

  // Step 6: Run npm install in "root", "client" and "server"
  runNpmInstall(root);
  runNpmInstall(path.join(root, "client"));
  runNpmInstall(path.join(root, "server"));


}

function runNpmInstall(directory) {
  const result = spawn.sync('npm', ['install', '--save'], { stdio: 'inherit', cwd: directory });
  
  return result.status;
}

function installPackage(templatePackageToInstall) {
  const result = spawn.sync('npm', ['install', '--save', '--save-exact', templatePackageToInstall], { stdio: 'inherit' });
  
  return result.status;
}

// module.exports = {
//   init
// }

init();