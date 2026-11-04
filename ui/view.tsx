import logo from "./icon.png";
import React, { useState } from "react";
import "./style.css";
export type Run = {
  timestamp: string;
  Repositorio: string;
  Workflow: string;
  Resultado: string;
  Execucao: string;
  Tentativa: string;
  Link: string;
};
const names: Record<string, string> = {
  success: "Sucesso",
  failure: "Falha",
  cancelled: "Cancelada",
};
const parts = (r: Run) => (r.Repositorio.split("/").pop() || "").split("-");
const choices = (a: string[]) => Array.from(new Set(a)).sort();
function Filter({
  label,
  values,
  value,
  change,
}: {
  label: string;
  values: string[];
  value: string;
  change: (v: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => change(e.target.value)}>
        <option value="">Todos</option>
        {values.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
export function View({ rows, label }: { rows: Run[]; label: string }) {
  const [portfolio, P] = useState(""),
    [system, S] = useState(""),
    [repo, R] = useState(""),
    [out, O] = useState("");
  const scope = rows.filter((r) => !portfolio || parts(r)[0] === portfolio);
  const apps = scope.filter((r) => !system || parts(r)[1] === system);
  const data = apps.filter((r) => !repo || r.Repositorio === repo);
  const selected = data
    .filter((r) => !out || r.Resultado === out)
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return (
    <main>
      <header><img src={logo} alt="B3 Portfólio" className="brand"/>
        <small>B3　/　INTELIGÊNCIA DE DELIVERY</small>
        <h1>Pulso de delivery</h1>
        <p>Do portfólio à tentativa de execução.</p>
        <b>{label}</b>
      </header>
      <section className="filters">
        <Filter
          label="Portfólio"
          values={choices(rows.map((r) => parts(r)[0]))}
          value={portfolio}
          change={(v) => {
            P(v);
            S("");
            R("");
          }}
        />
        <Filter
          label="Aplicação"
          values={choices(scope.map((r) => parts(r)[1]))}
          value={system}
          change={(v) => {
            S(v);
            R("");
          }}
        />
        <Filter
          label="Repositório"
          values={choices(apps.map((r) => r.Repositorio))}
          value={repo}
          change={R}
        />
      </section>
      <p>
        Portfólio e aplicação inferidos pelo nome do repositório. Classificação
        pendente de validação no catálogo.
      </p>
      <section className="cards">
        {[
          ["", "Tentativas"],
          ["success", "Sucessos"],
          ["failure", "Falhas"],
          ["cancelled", "Canceladas"],
        ].map(([key, title]) => (
          <button
            key={title}
            data-kind={key}
            aria-pressed={key === out}
            onClick={() => O(key)}
          >
            {title}
            <strong>
              {data.filter((r) => !key || r.Resultado === key).length}
            </strong>
          </button>
        ))}
      </section>
      <h2>
        {out ? names[out] : "Todas as tentativas"}{" "}
        <small>· {selected.length}</small>
      </h2>
      <p>
        Workflows de delivery mapeados. Cada reexecução conta como uma
        tentativa.
      </p>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              {[
                "Data (UTC)",
                "Aplicação / repositório",
                "Workflow",
                "Resultado",
                "GitHub",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selected.map((r) => (
              <tr key={[r.Repositorio, r.Execucao, r.Tentativa].join("/")}>
                <td>{r.timestamp.slice(0, 16).replace("T", " ")}</td>
                <td>
                  <a
                    href={"https://github.com/" + r.Repositorio}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.Repositorio}
                  </a>
                </td>
                <td>{r.Workflow}</td>
                <td data-kind={r.Resultado}>
                  {names[r.Resultado] || r.Resultado}
                </td>
                <td>
                  {r.Link?.startsWith("https://github.com/") && (
                    <a href={r.Link} target="_blank" rel="noreferrer">
                      Execução ↗
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!selected.length && <p>Nenhuma tentativa neste recorte.</p>}
      </div>
    </main>
  );
}

