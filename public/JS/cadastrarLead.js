const forms = document.querySelectorAll(".needs-validation");
Array.from(forms).forEach((form) => {
    form.addEventListener(
        "submit",
        (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                criarLead();
            }
            form.classList.add("was-validated");
        },
        false
    );
});

function criarLead() {
    const nome = document.getElementById("nome");
    const telefone = document.getElementById("telefone");
    const endereco = document.getElementById("endereco");
    const status = document.getElementById("status");
    fetch("/cadastrarLead", {
        method: "POST",
        headers: "{content-type:application/json}",
        body: JSON.stringify({ nome, telefone, endereco, status }),
    });
}
