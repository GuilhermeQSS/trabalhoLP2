const inquirer = require("inquirer");
const chalk = require("chalk");

const fs = require("fs");

console.log("Módulos inicializados com sucesso");

menu();

function menu() {
    inquirer
        .prompt([
            {
                type: "list",
                name: "action",
                message: "Opções",
                choices: [
                    "Pipelinde de Vendas",
                    "Cadastrar Lead",
                    "Registrar atividade",
                    "Atualizar Lead",
                    "Relatório do funil de vendas",
                    "sair",
                ],
            },
        ])
        .then((resp) => {
            const op = resp["action"];
            console.log(op);
            if (op === "Pipeline de Vendas") {
            } else if (op === "Cadastrar Lead") {
                cadastrarLead();
            } else if (op === "Registrar atividade") {
            } else if (op === "Atualizar Lead") {
            } else if (op === "Relatório do funil de vendas") {
            } else if (op === "sair") {
                process.exit();
            }
        })
        .catch((err) => {
            console.log(err);
        });
}
function cadastrarLead() {
    console.log(chalk.bgGreen.black("Bem-vindo ao CRM"));
    console.log(chalk.green("Opções"));
    criarLead();
}

function criarLead() {
    inquirer
        .prompt([
            {
                name: "nomeLead",
                message: "Digite o nome do lead",
            },
        ])
        .then((resp) => {
            console.log(resp);
            const nomeLead = resp["nomeLead"];
            if (!fs.existsSync("leads")) {
                fs.mkdirSync("leads");
            }
            if (fs.existsSync(`leads/${nomeLead}.json`)) {
                console.log(chalk.bgRed.black("Este lead já existe"));
                criarLead();
                return;
            }
            fs.writeFileSync(
                `leads/${nomeLead}.json`,
                '{"historico":""}',
                (err) => {
                    console.log(err);
                }
            );
            menu();
        })
        .catch((err) => {
            console.log(err);
        });
}
