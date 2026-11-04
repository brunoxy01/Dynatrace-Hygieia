const logo = "./assets/portfolio.png";
import React, { useState } from "react";
import "./style.css";
export type Run = {
  domain?: string;
  system?: string;
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
function parts(r: Run) {
  const [portfolio, app] = (r.Repositorio.split("/").pop() || "").split("-");
  return [
    r.domain || portfolio || "Sem portfólio",
    r.system || app || "Sem aplicação",
  ];
}
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
  const [page, setPage] = useState<"overview" | "detail" | "apps">("overview");
  const metrics = [
    [
      "",
      "Tentativas finalizadas",
      "Cada tentativa finalizada de um workflow mapeado conta uma vez. Se o workflow falhar e for reexecutado, são duas tentativas.",
    ],
    [
      "success",
      "Tentativas com sucesso",
      "Tentativas finalizadas com resultado de sucesso.",
    ],
    [
      "failure",
      "Tentativas com falha",
      "Tentativas finalizadas com falha no workflow.",
    ],
    [
      "cancelled",
      "Tentativas canceladas",
      "Tentativas cujo resultado foi cancelamento.",
    ],
  ];
  const metric = metrics.find((m) => m[0] === out)!;
  const open = (key: string, next: "detail" | "apps") => {
    O(key);
    setPage(next);
  };
  const anchor = label.startsWith("Coleta") ? Date.UTC(2026, 9, 6) : Date.now();
  const today = Math.floor(anchor / 86400000);
  const days = Array.from({ length: 30 }, (_, i) =>
    new Date((today - 29 + i) * 86400000).toISOString().slice(0, 10),
  );
  function daily(items: Run[]) {
    const counts = new Map<string, number>();
    items.forEach((r) => {
      const day = r.timestamp.slice(0, 10);
      counts.set(day, (counts.get(day) || 0) + 1);
    });
    return days.map((d) => counts.get(d) || 0);
  }
  function profile(items: Run[]) {
    return choices(items.map((r) => r.Repositorio)).length;
  }
  const graph = daily(selected),
    max = Math.max(1, ...graph);
  return (
    <main>
      <header>
        <img src={logo} alt="" />
        <b>B3 Portfólio</b>
        <span>EXECUTIVO</span>
      </header>
      <nav>
        <div>
          <small>PORTFÓLIO DE DELIVERY</small>
          <h1>
            {portfolio ? portfolio.toUpperCase() : "Visão dos portfólios"}
          </h1>
        </div>
        {page !== "overview" && (
          <button onClick={() => setPage("overview")}>← Visão geral</button>
        )}
        <button onClick={() => open("", "apps")}>Ver aplicações →</button>
      </nav>
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
      <aside>
        {label} · Vínculos sem classificação confirmada usam a nomenclatura do
        repositório e aguardam validação no catálogo.
      </aside>
      {page === "overview" ? (
        <div className="widgets">
          {metrics.map(([key, title, def]) => {
            const items = data.filter((r) => !key || r.Resultado === key);
            const trend = daily(items);
            const total = (a: number[]) => a.reduce((x, y) => x + y, 0);
            const delta =
              total(trend.slice(-8, -1)) - total(trend.slice(-15, -8));
            return (
              <article key={title}>
                <div className="value">
                  <strong>{items.length}</strong>
                  <span title="Diferença em tentativas entre os últimos 7 dias completos (UTC) e os 7 anteriores.">
                    {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {Math.abs(delta)}
                    <small>vs. 7 dias anteriores</small>
                  </span>
                </div>
                <h2>{title}</h2>
                <details>
                  <summary>O que mede?</summary>
                  {def}
                </details>
                <dl>
                  <dt>Repositórios com ocorrências</dt>
                  <dd>{profile(items)}</dd>
                  <dt>Participação nas tentativas</dt>
                  <dd>
                    {data.length
                      ? Math.round((items.length / data.length) * 100) + "%"
                      : "—"}
                  </dd>
                </dl>
                <footer>
                  <button onClick={() => open(key, "detail")}>Detalhes</button>
                  <button onClick={() => open(key, "apps")}>Aplicações</button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <>
          <h2>
            {metric[1]}{" "}
            <em>/ {page === "apps" ? "Aplicações" : "Detalhe da métrica"}</em>
          </h2>
          <p>{metric[2]}</p>
          {page === "detail" && (
            <article className="chart">
              <h3>
                Ocorrências por dia <em>· UTC</em>
              </h3>
              <div className="bars">
                {graph.map((v, i) => (
                  <div
                    key={i}
                    title={days[i] + " · " + v}
                    style={{ height: Math.max(1, (v / max) * 110) }}
                  />
                ))}
              </div>
              <aside>
                {days[0]} <span>{days[29]}</span>
              </aside>
            </article>
          )}
          <article>
            <h3>Distribuição por aplicação</h3>
            {choices(data.map((r) => parts(r)[1])).map((a) => (
              <button
                className="row"
                key={a}
                onClick={() => {
                  S(a);
                  R("");
                  setPage("detail");
                }}
              >
                {a}
                <b>{selected.filter((r) => parts(r)[1] === a).length}　›</b>
              </button>
            ))}
            {!data.length && <p>Sem aplicações no recorte.</p>}
          </article>
          {page === "detail" && (
            <>
              {system && (
                <article>
                  <small>APLICAÇÃO</small>
                  <h2>{system}</h2>
                  <h3>Componentes por repositório</h3>
                  {choices(apps.map((r) => r.Repositorio)).map((id) => {
                    const group = apps.filter((r) => r.Repositorio === id);
                    const n = group.filter(
                      (r) => !out || r.Resultado === out,
                    ).length;
                    return (
                      <button
                        key={id}
                        className="row"
                        onClick={() => R(repo === id ? "" : id)}
                        aria-pressed={repo === id}
                      >
                        <span>
                          {id}
                          <small className="source">
                            {group[0].system && group[0].domain
                              ? "Vínculo configurado"
                              : "Vínculo inferido pelo nome"}
                          </small>
                        </span>
                        <b>{n}　›</b>
                      </button>
                    );
                  })}
                </article>
              )}
              <h3>Histórico de execuções · {selected.length}</h3>
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
                      <tr
                        key={[r.Repositorio, r.Execucao, r.Tentativa].join("/")}
                      >
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
            </>
          )}
        </>
      )}
    </main>
  );
}

