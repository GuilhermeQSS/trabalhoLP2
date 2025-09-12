const inquirer = require("inquirer");
const chalk = require("chalk");
const url = require("url");
const http = require("http");
const fs = require("fs");
const path = require("path");
const port = 3000;
const status = [
    "Inicial",
    "Proposta",
    "Negociação",
    "Fechamento",
    "Finalizada",
];
function converterTipo(arquivo) {
    let extensao = path.extname(arquivo);
    switch (extensao) {
        case ".css":
            return "text/css";
        case ".html":
            return "text/html";
        case ".js":
            return "text/javascript";
    }
}
const server = http.createServer((req, res) => {
    const urlInfo = url.parse(req.url, true);
    let caminho = urlInfo.pathname;
    let consulta = urlInfo.query;
    let arquivo;
    if (consulta.post) {
        switch (caminho) {
            case "/cadastrarLead":
                const novoLead = {
                    id: Date.now(),
                    nome: consulta.nome,
                    telefone: consulta.telefone,
                    endereco: consulta.endereco,
                    status: 0,
                    historico: "",
                };
                cadastrarNovoLead(novoLead);
                res.writeHead(302, { Location: "/cadastrarLead.html" });
                res.end();
                break;
            case "/deletarLead":
                deletarLead(consulta.id);
                res.writeHead(302, { Location: "/deletarLead.html" });
                res.end();
                break;
            case "/alterarLead":
                const alteracao = {
                    id: consulta.id,
                    campo: consulta.campo,
                    novoConteudo: consulta.novoConteudo,
                };
                alterarLead(alteracao);
                res.writeHead(302, { Location: "/alterarLead.html" });
                res.end();
                break;
            case "/registrarAtividade":
                if (consulta.avancar) {
                    avancarLead(consulta.idLead);
                }
                gravarHistorico(consulta.idLead, consulta.historico);
                gerarAtividade(
                    consulta.idLead,
                    consulta.nomeVendedor,
                    consulta.historico
                );
                res.writeHead(302, { Location: "/registrarAtividade.html" });
                res.end();
                break;
        }
    } else {
        if (caminho === "/") {
            arquivo = "public/index.html";
        } else {
            arquivo = "public" + caminho;
        }
        if (fs.existsSync(arquivo) && path.extname(arquivo)) {
            const tipoDoArquivo = converterTipo(arquivo);
            let conteudo = fs.readFileSync(arquivo, "utf-8");
            const renderizadores = {
                "/consultarLead.html": desenharTabelaLeads,
                "/deletarLead.html": desenharOpcoesDeLead,
                "/registrarAtividade.html": desenharOpcoesComStatus,
                "/alterarLead.html": desenharOpcoesDeLead,
                "/pipelineDeVendas.html": desenharContagemDeStatus,
                "/relFunilDeVendas.html": desenharLeadsOrdenado,
            };
            if (renderizadores[caminho]) {
                conteudo = renderizadores[caminho](conteudo);
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
    }
});
server.listen(port, () => {
    console.log(`servidor em http://localhost:${port}`);
});

function getLeads() {
    let leads = [];
    if (!fs.existsSync("db")) {
        fs.mkdirSync("db");
    }
    if (!fs.existsSync("db/leads")) {
        fs.mkdirSync("db/leads");
    }
    fs.readdirSync("db/leads").forEach((arquivo) => {
        leads.push(JSON.parse(fs.readFileSync("db/leads/" + arquivo)));
    });
    return leads;
}

function getLead(id) {
    return JSON.parse(fs.readFileSync(`db/leads/${id}.json`));
}

function desenharTabelaLeads(conteudo) {
    const leads = getLeads();
    let linhas = "";
    leads.forEach((lead) => {
        linhas += `
            <tr>
                <th scope="row">${lead.id}</th>
                <td>${lead.nome}</td>
                <td>${lead.telefone}</td>
                <td>${lead.endereco}</td>
                <td>${status[lead.status]}</td>
            </tr>
        `;
    });
    return conteudo.replace("<tbody></tbody>", `<tbody>${linhas}</tbody>`);
}

function desenharOpcoesDeLead(conteudo) {
    const leads = getLeads();
    let linhas = "";
    leads.forEach((lead) => {
        linhas += `
        <option value="${lead.id}">${lead.nome}</option>
        `;
    });
    return conteudo.replace(
        "<option></option>",
        `<option selected disabled value="">
            Escolha um nome...
        </option>
        ${linhas}`
    );
}

function desenharLeadsOrdenado(conteudo) {
    let leads = getLeads();
    let linhas = "";
    let historico = "";
    leads = leads.sort((a, b) => b.status - a.status);
    const cores = {
        0: "info",
        1: "success",
        2: "warning",
        3: "danger",
    };
    leads.forEach((lead) => {
        historico = "";
        if (lead.historico) {
            lead.historico.split(";").forEach((hist) => {
                historico += `<li>${hist}</li>`;
            });
        }
        linhas += `
            <div class="border border-5 rounded-5 m-2 p-4 bg-light">
                <div class="d-flex mb-3 justify-content-between align-items-center">
                    <span>${lead.nome}</span>
                    <span class="badge bg-${cores[lead.status]}">
                        ${status[lead.status]}
                    </span>
                </div>
                <button class="btn btn-secondary mb-3" type="button" data-bs-toggle="collapse" data-bs-target="#${
                    lead.id
                }" aria-expanded="false" aria-controls="collapseExample">
                    Historico
                </button>
                <div class="collapse" id="${lead.id}">
                    <div class="card card-body">
                        <ol>
                            ${historico}
                        </ol>
                    </div>
                </div>
            </div>
        `;
    });

    return conteudo.replace("<div></div>", `${linhas}`);
}

function desenharOpcoesComStatus(conteudo) {
    const leads = getLeads();
    let linhas = "";
    leads.forEach((lead) => {
        if (lead.status != 4) {
            linhas += `
            <option value="${lead.id}">${lead.nome} - ${
                status[lead.status]
            }</option>
            `;
        }
    });
    return conteudo.replace(
        "<option></option>",
        `<option selected disabled value="">
            Escolha um nome...
        </option>
        ${linhas}`
    );
}

function desenharContagemDeStatus(conteudo) {
    const leads = getLeads();
    let qtde = [0, 0, 0, 0];
    leads.forEach((lead) => {
        if (lead.status != 4) {
            qtde[lead.status]++;
        }
    });
    return conteudo.replace(
        "<tbody></tbody>",
        `<tbody>
            <tr>
                <td>${qtde[0]}</td>
                <td>${qtde[1]}</td>
                <td>${qtde[2]}</td>
                <td>${qtde[3]}</td>
            </tr>
        </tbody>`
    );
}

function cadastrarNovoLead(novoLead) {
    if (!fs.existsSync("db")) {
        fs.mkdirSync("db");
    }
    if (!fs.existsSync("db/leads")) {
        fs.mkdirSync("db/leads");
    }
    if (!fs.existsSync(`db/leads/${novoLead.id}.json`)) {
        fs.writeFileSync(
            `db/leads/${novoLead.id}.json`,
            JSON.stringify(novoLead),
            (err) => {
                console.log(err);
            }
        );
    }
}

function deletarLead(id) {
    fs.unlinkSync(`db/leads/${id}.json`);
}

function gerarAtividade(idLead, nomeVendedor, historico) {
    if (!fs.existsSync("db")) {
        fs.mkdirSync("db");
    }
    if (!fs.existsSync("db/atividades")) {
        fs.mkdirSync("db/atividades");
    }
    const data = new Date();
    const ano = data.getFullYear();
    const mes = data.getMonth();
    const dia = data.getDate();
    const hora = data.getHours();
    const min = data.getMinutes();
    const seg = data.getSeconds();
    const log =
        "log" +
        "_" +
        hora +
        "-" +
        min +
        "-" +
        seg +
        ";" +
        dia +
        "-" +
        mes +
        "-" +
        ano;
    const lead = getLead(idLead);
    const atividade = {
        nomeVendedor: nomeVendedor,
        nomeLead: lead.nome,
        status: lead.status,
        historico: historico,
    };
    fs.writeFileSync(
        `db/atividades/${log}.json`,
        JSON.stringify(atividade),
        (err) => {
            console.log(err);
        }
    );
}

function alterarLead(alteracao) {
    let lead = JSON.parse(fs.readFileSync(`db/leads/${alteracao.id}.json`));
    switch (alteracao.campo) {
        case "nome":
            lead.nome = alteracao.novoConteudo;
            break;
        case "telefone":
            lead.telefone = alteracao.novoConteudo;
            break;
        case "endereco":
            lead.endereco = alteracao.novoConteudo;
            break;
    }
    fs.writeFileSync(
        `db/leads/${alteracao.id}.json`,
        JSON.stringify(lead),
        (err) => {
            console.log(err);
        }
    );
}

function avancarLead(id) {
    let lead = getLead(id);
    lead.status++;
    fs.writeFileSync(`db/leads/${id}.json`, JSON.stringify(lead), (err) => {
        console.log(err);
    });
}

function gravarHistorico(idLead, historico) {
    let lead = getLead(idLead);
    if (lead.historico) {
        lead.historico += ";" + historico;
    } else {
        lead.historico = historico;
    }

    fs.writeFileSync(`db/leads/${idLead}.json`, JSON.stringify(lead), (err) => {
        console.log(err);
    });
}
//menu();

// function menu() {
//     inquirer
//         .prompt([
//             {
//                 type: "list",
//                 name: "action",
//                 message: "Opções",
//                 choices: [
//                     "Pipelinde de Vendas",
//                     "Cadastrar Lead",
//                     "Registrar atividade",
//                     "Atualizar Lead",
//                     "Consultar Lead",
//                     "Relatório do funil de vendas",
//                     "sair",
//                 ],
//             },
//         ])
//         .then((resp) => {
//             const op = resp["action"];
//             console.log(op);
//             if (op === "Pipeline de Vendas") {
//                 exibirPipeline();
//             } else if (op === "Cadastrar Lead") {
//                 cadastrarLead();
//             } else if (op === "Registrar atividade") {
//                 registrarAtividade();
//             } else if (op === "Atualizar Lead") {
//             } else if (op === "Consultar Lead") {
//                 consultarLead();
//             } else if (op === "Remover Lead") {
//                 removerLead();
//             } else if (op === "Relatório do funil de vendas") {
//             } else if (op === "sair") {
//                 process.exit();
//             }
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// }

// function exibirPipeline() {
//     console.log(chalk.gray("Contato inicial"));
//     console.log(chalk.gray("Proposta apresentada"));
//     console.log(chalk.gray("Negociação"));
//     console.log(chalk.gray("Fechamento"));
//     menu();
// }

// function cadastrarLead() {
//     console.log(chalk.bgGreen.black("Bem-vindo ao CRM"));
//     console.log(chalk.green("Opções"));
//     criarLead();
// }

// function criarLead() {
//     inquirer
//         .prompt([
//             {
//                 name: "nomeLead",
//                 message: "Digite o nome do lead",
//             },
//         ])
//         .then((resp) => {
//             console.log(resp);
//             const nomeLead = resp["nomeLead"];
//             if (!fs.existsSync("leads")) {
//                 fs.mkdirSync("leads");
//             }
//             if (fs.existsSync(`leads/${nomeLead}.json`)) {
//                 console.log(chalk.bgRed.black("Este lead já existe"));
//                 criarLead();
//                 return;
//             }
//             fs.writeFileSync(
//                 `leads/${nomeLead}.json`,
//                 '{"historico":""}',
//                 (err) => {
//                     console.log(err);
//                 }
//             );
//             console.log(chalk.green("Lead criado com sucesso"));
//             menu();
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// }

// function registrarAtividade(params) {
//     inquirer
//         .prompt([
//             {
//                 name: "nomeLead",
//                 message: "Qual lead deseja atualizar?",
//             },
//         ])
//         .then((resp) => {
//             const nomeLead = resp["nomeLead"];
//             if (!verificaLead(nomeLead)) {
//                 return registrarAtividade();
//             }
//             criarAtividade(nomeLead);
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// }

// function verificaLead(nomeLead) {
//     if (!fs.existsSync(`leads/${nomeLead}.json`)) {
//         console.log(chalk.bgRed.black("Este lead não existe"));
//         return false;
//     }
//     return true;
// }

// function criarAtividade(nomeLead) {
//     inquirer
//         .prompt([
//             {
//                 name: "nomeVendedor",
//                 message: "Digite o nome do vendedor: ",
//             },
//             {
//                 type: "list",
//                 name: "statusFunil",
//                 message: "Status do funil",
//                 choices: [
//                     "Inicio",
//                     "Proposta",
//                     "Negociação",
//                     "Fechamento",
//                     "Historico",
//                 ],
//             },
//             {
//                 name: "historico",
//                 message: "Digite o historico da atividade",
//             },
//         ])
//         .then((resp) => {
//             resp.nomeLead = nomeLead;
//             const nomeVendedor = resp["nomeVendedor"];
//             const status = resp["statusFunil"];
//             const historico = resp["historico"];
//             const data = new Date();
//             const ano = data.getFullYear();
//             const mes = data.getMonth();
//             const dia = data.getDate();
//             const hora = data.getHours();
//             const min = data.getMinutes();
//             const seg = data.getSeconds();
//             const logAtividade = "log" + dia + mes + ano + hora + min + seg;
//             if (!fs.existsSync("atividades")) {
//                 fs.mkdirSync("atividades");
//             }
//             let jsonAtividade = `{"nomeVendedor":"${nomeVendedor}","nomeLead":"${nomeLead}","statusFunil":"${status}","historico":"${historico}","log":"${logAtividade}"}`;
//             fs.writeFileSync(
//                 `atividades/${logAtividade}.json`,
//                 jsonAtividade,
//                 (err) => {
//                     console.log(err);
//                 }
//             );
//             console.log(chalk.green("Atividade criada com sucesso"));
//             atualizarHistorico(nomeLead, historico);
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// }

// function atualizarHistorico(nomeLead, historico) {
//     const leadObj = getLead(nomeLead);
//     if (!historico) {
//         console.log(chalk.bgRed.black("Ocorreu um erro, tente novamente"));
//         menu();
//     } else {
//         leadObj.historico = leadObj.historico + "\n" + historico;
//         fs.writeFileSync(
//             `leads/${nomeLead}.json`,
//             JSON.stringify(leadObj),
//             (err) => {
//                 console.log(err);
//             }
//         );
//         console.log(chalk.green("Histórico atualizado com sucesso"));
//         menu();
//     }
// }

// function getLead(nomeLead) {
//     const leadJSON = fs.readFileSync(`leads/${nomeLead}.json`, {
//         encoding: "utf-8",
//         flag: "r",
//     });
//     return JSON.parse(leadJSON);
// }

// function consultarLead() {
//     inquirer
//         .prompt([
//             {
//                 name: "nomeLead",
//                 message: "Qual o nome do lead que deseja consultar?",
//             },
//         ])
//         .then((resp) => {
//             const nomeLead = resp["nomeLead"];
//             if (!verificaLead(nomeLead)) {
//                 return consultarLead();
//             }
//             const leadObj = getLead(nomeLead);
//             console.log(
//                 chalk.bgBlue.black(
//                     `O histórico do lead ${nomeLead} é: ${leadObj.historico}`
//                 )
//             );
//             menu();
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// }

// function removerLead() {
//     inquirer
//         .prompt([
//             {
//                 name: "nomeLead",
//                 message: "Digite o nome do lead que deseja remover:",
//             },
//         ])
//         .then((resp) => {
//             const nomeLead = resp["nomeLead"];
//             if (!verificaLead(nomeLead)) {
//                 return removerLead();
//             }
//             inquirer
//                 .prompt([
//                     {
//                         type: "confirm",
//                         name: "confirmar",
//                         message: "Deseja realmente remover o lead? ",
//                     },
//                 ])
//                 .then((resp) => {
//                     if (resp["confirmar"] === true) {
//                         fs.unlinkSync(`leads/${nomeLead}.json`, (err) => {
//                             console.log(err);
//                         });
//                         console.log(chalk.green("Lead excluido com sucesso"));
//                     }
//                     menu();
//                 });
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// }
