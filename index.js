const inquirer = require("inquirer");
const chalk = require("chalk");
const url = require("url");
const http = require("http");
const fs = require("fs");
const path = require("path");
const port = 3000;

function converterTipo(arquivo) {
    let extensao = path.extname(arquivo);
    switch (extensao) {
        case ".css":
            return "text/css";
        case ".html":
            return "text/html";
        case ".js":
            return "text/javascript";
        case ".ico":
            return "image/x-icon";
    }
}
const server = http.createServer((req, res) => {
    const urlInfo = url.parse(req.url, true);
    let caminho = urlInfo.pathname;
    let consulta = urlInfo.query;
    let arquivo;
    if (consulta.post) {
        if (caminho === "/cadastrarLead") {
            const novoLead = {
                id: Date.now(),
                nome: consulta.nome,
                telefone: consulta.telefone,
                endereco: consulta.endereco,
                status: consulta.status,
                historico: "",
            };
            cadastrarNovoLead(novoLead);
            res.writeHead(302, { Location: "/cadastrarLead.html" });
            res.end();
            return;
        }
    }
    if (caminho === "/") {
        arquivo = "public/index.html";
    } else {
        arquivo = "public" + caminho;
    }
    if (fs.existsSync(arquivo) && path.extname(arquivo)) {
        const tipoDoArquivo = converterTipo(arquivo);
        let conteudo = fs.readFileSync(arquivo, "utf-8");
        if (caminho === "/consultarLead.html") {
            conteudo = desenharLeads(conteudo);
        }
        res.writeHead(200, { "Content-Type": tipoDoArquivo });
        res.write(conteudo);
        res.end();
    } else {
        fs.readFile("public/404.html", (err, conteudo) => {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.write(conteudo);
            res.end();
        });
    }
});
server.listen(port, () => {
    console.log(`servidor em http://localhost:${port}`);
});

function getLeads() {
    if (!fs.existsSync("db")) {
        fs.mkdirSync("db");
    }
    if (!fs.existsSync("db/leads.json")) {
        fs.writeFileSync("db/leads.json", "[]");
    }
    return JSON.parse(fs.readFileSync("db/leads.json", "utf-8"));
}

function desenharLeads(conteudo) {
    const leads = getLeads();
    let linhas = "";
    leads.forEach((lead) => {
        linhas += `
            <tr>
                <th scope="row">${lead.id}</th>
                <td>${lead.nome}</td>
                <td>${lead.telefone}</td>
                <td>${lead.endereco}</td>
                <td>${lead.status}</td>
                <td>
                    <button class="btn btn-danger">Excluir</button>
                </td>
            </tr>
        `;
    });
    return conteudo.replace("<tbody></tbody>", `<tbody>${linhas}</tbody>`);
}

function cadastrarNovoLead(novoLead) {
    const leads = getLeads();
    if (!leads.some((l) => l.nome === novoLead.nome)) {
        leads.push(novoLead);
        fs.writeFileSync("db/leads.json", JSON.stringify(leads), (err) => {
            console.log(err);
        });
    }
}

//menu();

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
                    "Consultar Lead",
                    "Relatório do funil de vendas",
                    "sair",
                ],
            },
        ])
        .then((resp) => {
            const op = resp["action"];
            console.log(op);
            if (op === "Pipeline de Vendas") {
                exibirPipeline();
            } else if (op === "Cadastrar Lead") {
                cadastrarLead();
            } else if (op === "Registrar atividade") {
                registrarAtividade();
            } else if (op === "Atualizar Lead") {
            } else if (op === "Consultar Lead") {
                consultarLead();
            } else if (op === "Remover Lead") {
                removerLead();
            } else if (op === "Relatório do funil de vendas") {
            } else if (op === "sair") {
                process.exit();
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

function exibirPipeline() {
    console.log(chalk.gray("Contato inicial"));
    console.log(chalk.gray("Proposta apresentada"));
    console.log(chalk.gray("Negociação"));
    console.log(chalk.gray("Fechamento"));
    menu();
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
            console.log(chalk.green("Lead criado com sucesso"));
            menu();
        })
        .catch((err) => {
            console.log(err);
        });
}

function registrarAtividade(params) {
    inquirer
        .prompt([
            {
                name: "nomeLead",
                message: "Qual lead deseja atualizar?",
            },
        ])
        .then((resp) => {
            const nomeLead = resp["nomeLead"];
            if (!verificaLead(nomeLead)) {
                return registrarAtividade();
            }
            criarAtividade(nomeLead);
        })
        .catch((err) => {
            console.log(err);
        });
}

function verificaLead(nomeLead) {
    if (!fs.existsSync(`leads/${nomeLead}.json`)) {
        console.log(chalk.bgRed.black("Este lead não existe"));
        return false;
    }
    return true;
}

function criarAtividade(nomeLead) {
    inquirer
        .prompt([
            {
                name: "nomeVendedor",
                message: "Digite o nome do vendedor: ",
            },
            {
                type: "list",
                name: "statusFunil",
                message: "Status do funil",
                choices: [
                    "Inicio",
                    "Proposta",
                    "Negociação",
                    "Fechamento",
                    "Historico",
                ],
            },
            {
                name: "historico",
                message: "Digite o historico da atividade",
            },
        ])
        .then((resp) => {
            resp.nomeLead = nomeLead;
            const nomeVendedor = resp["nomeVendedor"];
            const status = resp["statusFunil"];
            const historico = resp["historico"];
            const data = new Date();
            const ano = data.getFullYear();
            const mes = data.getMonth();
            const dia = data.getDate();
            const hora = data.getHours();
            const min = data.getMinutes();
            const seg = data.getSeconds();
            const logAtividade = "log" + dia + mes + ano + hora + min + seg;
            if (!fs.existsSync("atividades")) {
                fs.mkdirSync("atividades");
            }
            let jsonAtividade = `{"nomeVendedor":"${nomeVendedor}","nomeLead":"${nomeLead}","statusFunil":"${status}","historico":"${historico}","log":"${logAtividade}"}`;
            fs.writeFileSync(
                `atividades/${logAtividade}.json`,
                jsonAtividade,
                (err) => {
                    console.log(err);
                }
            );
            console.log(chalk.green("Atividade criada com sucesso"));
            atualizarHistorico(nomeLead, historico);
        })
        .catch((err) => {
            console.log(err);
        });
}

function atualizarHistorico(nomeLead, historico) {
    const leadObj = getLead(nomeLead);
    if (!historico) {
        console.log(chalk.bgRed.black("Ocorreu um erro, tente novamente"));
        menu();
    } else {
        leadObj.historico = leadObj.historico + "\n" + historico;
        fs.writeFileSync(
            `leads/${nomeLead}.json`,
            JSON.stringify(leadObj),
            (err) => {
                console.log(err);
            }
        );
        console.log(chalk.green("Histórico atualizado com sucesso"));
        menu();
    }
}

function getLead(nomeLead) {
    const leadJSON = fs.readFileSync(`leads/${nomeLead}.json`, {
        encoding: "utf-8",
        flag: "r",
    });
    return JSON.parse(leadJSON);
}

function consultarLead() {
    inquirer
        .prompt([
            {
                name: "nomeLead",
                message: "Qual o nome do lead que deseja consultar?",
            },
        ])
        .then((resp) => {
            const nomeLead = resp["nomeLead"];
            if (!verificaLead(nomeLead)) {
                return consultarLead();
            }
            const leadObj = getLead(nomeLead);
            console.log(
                chalk.bgBlue.black(
                    `O histórico do lead ${nomeLead} é: ${leadObj.historico}`
                )
            );
            menu();
        })
        .catch((err) => {
            console.log(err);
        });
}

function removerLead() {
    inquirer
        .prompt([
            {
                name: "nomeLead",
                message: "Digite o nome do lead que deseja remover:",
            },
        ])
        .then((resp) => {
            const nomeLead = resp["nomeLead"];
            if (!verificaLead(nomeLead)) {
                return removerLead();
            }
            inquirer
                .prompt([
                    {
                        type: "confirm",
                        name: "confirmar",
                        message: "Deseja realmente remover o lead? ",
                    },
                ])
                .then((resp) => {
                    if (resp["confirmar"] === true) {
                        fs.unlinkSync(`leads/${nomeLead}.json`, (err) => {
                            console.log(err);
                        });
                        console.log(chalk.green("Lead excluido com sucesso"));
                    }
                    menu();
                });
        })
        .catch((err) => {
            console.log(err);
        });
}
